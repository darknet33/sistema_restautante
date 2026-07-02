# Guía de Despliegue — ALTIPIQUI

## Arquitectura

```
app.altipiqui.com (frontend)          api.altipiqui.com (backend)
     │                                         │
     │  estático (React compilado)              │  Node.js + Express + Socket.IO
     │                                         │
     └────────── HTTPS / WS ──────────────────┘
                    │
              MySQL (MariaDB)
```

## Requisitos en Plesk

- Panel **Plesk** con soporte Node.js
- Node.js **22.23.0**
- MySQL/MariaDB (gestión desde Plesk)
- 2 subdominios: `api.altipiqui.com` y `app.altipiqui.com`
- Acceso al panel Node.js de cada subdominio

## Configuración de la Base de Datos

1. Plesk > Bases de Datos > Añadir Base de Datos
2. Nombre: `rrpf_exvzlv_altipiqui_db`
3. Usuario: `rrpf_exvzlv_kevin`
4. Anotar la contraseña generada

## api.altipiqui.com — Backend

### Git

Plesk > `api.altipiqui.com` > Git

| Campo | Valor |
|-------|-------|
| URL repositorio | `https://github.com/darknet33/sistema_restautante` |
| Ruta en servidor | `/httpdocs` |
| Acciones de despliegue | **Vacías** (los comandos se ejecutan manualmente desde el panel) |

### Node.js

Plesk > `api.altipiqui.com` > Node.js

| Campo | Valor |
|-------|-------|
| Raíz del documento | `/httpdocs` |
| Raíz de la aplicación | `/httpdocs/Backend` |
| Archivo de inicio | `dist/index.js` |
| Modo de aplicación | `production` |

### Variables de entorno

```
NODE_ENV = production
PORT = 3000
DATABASE_URL = mysql://rrpf_exvzlv_kevin:CONTRASEÑA@localhost:3306/rrpf_exvzlv_altipiqui_db
JWT_SECRET = g7H2kL9mX4pQ8wR1vY3nB6jC0sF5tA8d
JWT_EXPIRES_IN = 8h
FRONTEND_URL = https://app.altipiqui.com
```

> ⚠️ Si la contraseña contiene `#`, escaparla como `%23` en la URL.

### Archivo Backend/.env

Crear en Plesk > Archivos > `httpdocs/Backend/.env`:

```
DATABASE_URL=mysql://rrpf_exvzlv_kevin:CONTRASEÑA@localhost:3306/rrpf_exvzlv_altipiqui_db
```

> Necesario porque los scripts manuales (`prisma:push`, `prisma:seed`) no heredan las variables del panel Node.js.

### Orden de comandos (Ejecutar Script)

Desde el panel Node.js, ejecutar en orden:

```
npm install
npm run prisma:generate
npm run prisma:push
npm run build
npm run prisma:seed
```

### Iniciar

Hacer clic en **Start application** o **Restart**.

## app.altipiqui.com — Frontend

### Git

Plesk > `app.altipiqui.com` > Git

| Campo | Valor |
|-------|-------|
| URL repositorio | `https://github.com/darknet33/sistema_restautante` |
| Ruta en servidor | `/httpdocs` |
| Acciones de despliegue | **Vacías** |

### Node.js (temporal, solo para build)

Plesk > `app.altipiqui.com` > Node.js

| Campo | Valor |
|-------|-------|
| Raíz de la aplicación | `/httpdocs/Frontend` |
| Raíz del documento | `/httpdocs/Frontend` |
| Modo | `production` |

### Build

Desde **Ejecutar comandos Node.js**:

```
npm install
npm run build
```

### Configuración final

1. Desactivar Node.js (ya no se necesita)
2. Plesk > Ajustes > Hosting > **Raíz del documento** → `Frontend/dist`

## Cambios de código realizados para el despliegue

### Separación frontend/backend
- `Backend/src/app.ts`: Eliminado `express.static(Frontend/dist)` y catch-all SPA
- `Backend/package.json`: `dotenv` movido de `devDependencies` a `dependencies`

### URLs configurables
- `Frontend/src/services/api.ts`: `baseURL` usa `VITE_API_URL`
- `Frontend/src/socket/index.ts`: Socket.IO usa `VITE_API_URL`
- `Frontend/.env.production`: `VITE_API_URL=https://api.altipiqui.com`

### SPA routing (HashRouter)
- `Frontend/src/App.tsx`: `BrowserRouter` → `HashRouter`
- Evita 404 al recargar rutas como `/menu` o `/login`

### Uploads (imágenes de platos)
- `Frontend/src/utils/format.ts`: Agregado `uploadUrl()` que antepone `VITE_API_URL` a las rutas de imágenes
- Actualizados todos los `<img src={...}>` en 5 componentes

### WebSocket (sin WebSocket en nginx)
- `Frontend/src/socket/index.ts`: `transports: ['polling']` — evita necesidad de configurar WebSocket en nginx

### Seguridad
- `Backend/src/routes/auth.routes.ts`: Rate limiting (10 intentos/15 min) vía `express-rate-limit`
- `Backend/prisma/seed.ts`: Contraseñas aleatorias por defecto, configurables via `SEED_*_PASSWORD`
- `Frontend/src/pages/Login.tsx`: Eliminadas credenciales de prueba

### Documentación API
- Swagger UI en `GET /api/docs` (vía `swagger-jsdoc` + `swagger-ui-express`)

## Problemas encontrados y soluciones

| Problema | Solución |
|----------|----------|
| `npm: command not found` en acciones Git | Ejecutar comandos manualmente desde el panel Node.js |
| `DATABASE_URL` no encontrada en scripts | Crear `Backend/.env` con la conexión |
| `#` en contraseña da error en URL | Escapar `#` como `%23` |
| MariaDB como MySQL | Prisma funciona igual con `provider = "mysql"` |
| 404 en rutas SPA al recargar | `HashRouter` en lugar de `BrowserRouter` |
| Imágenes rotas (`/uploads/...`) | `uploadUrl()` helper con `VITE_API_URL` |
| WebSocket rechazado por nginx | Socket.IO en modo `polling` |
| `PORT` vs `port` (mayúscula) | Usar `PORT=3000` en el panel |

## URLs finales

| URL | Descripción |
|-----|-------------|
| `https://app.altipiqui.com` | Frontend (login, dashboard, etc.) |
| `https://app.altipiqui.com/#/menu` | Menú público |
| `https://api.altipiqui.com/api/health` | Health check |
| `https://api.altipiqui.com/api/docs` | Documentación Swagger |

## Flujo de actualización

1. `git push` a GitHub
2. En Plesk: **Git > Pull** en ambos subdominios
3. `api.altipiqui.com` > Node.js > **Ejecutar script > `build`** > **Restart**
4. `app.altipiqui.com` > Node.js > **Ejecutar comandos > `npm run build`**

## Problemas conocidos y soluciones

### Tickets/recibos no se abren en producción

**Causa:** Las funciones `getKitchenTicketUrl()` y `getCustomerReceiptUrl()` en `Frontend/src/services/order.service.ts` devolvían rutas relativas (`/api/orders/...`). Como el frontend se sirve desde `app.altipiqui.com` y la API desde `api.altipiqui.com`, esas rutas relativas apuntaban al dominio incorrecto.

**Solución:** Se antepuso `VITE_API_URL` a ambas URLs, generando rutas absolutas como `https://api.altipiqui.com/api/orders/42/receipt?token=xxx`.

```
// ❌ Antes
return `/api/orders/${orderId}/ticket?token=${token}`

// ✅ Después
return `${API_URL}/api/orders/${orderId}/ticket?token=${token}`
```

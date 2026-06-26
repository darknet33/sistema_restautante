# Restaurant System — Agent Guide

## Stack
- **Backend:** Node.js + Express 5 + Prisma + MySQL + Socket.IO + pdfmake
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + TanStack Query + Socket.IO Client
- **Moneda:** Bs. (Bolivianos) — formato `Bs. 120.00`
- **Zona horaria:** Bolivia UTC-4 — fechas almacenadas UTC, convertidas en frontend con `toLocaleString('es-BO', { timeZone: 'America/La_Paz' })`

## Estructura
```
Backend/          # API REST (src/, prisma/, .env)
Frontend/         # React SPA (src/, vite.config.ts)
```
- Backend `app.ts` sirve `Frontend/dist/` en producción
- Frontend `vite.config.ts` proxy: `/api`, `/uploads`, `/socket.io` → `http://localhost:3000`
- Frontend usa `@/` alias → `src/`

## Comandos

### Backend (puerto 3000)
```bash
cd Backend
npm install
npx prisma generate
npx prisma db push        # sync schema, NO migrate dev
npm run prisma:seed       # ts-node-dev prisma/seed.ts
npm run dev               # ts-node-dev --respawn --transpile-only
npm run build             # tsc → dist/
```

### Frontend (puerto 5173)
```bash
cd Frontend
npm install
npm run dev               # vite
npm run build             # tsc && vite build
```

### Seed data
- Login con **username** (NO email): admin/admin123, cajero/cajero123, mesero/mesero123, cocina/cocina123
- 3 categorías (Platos Fuertes, Bebidas, Insumos), 3 platos, 5 consumibles, 7 mesas LIBRE

## Login & Auth
- Login usa `username` + password — el email existe pero es opcional (los READMEs están desactualizados, seed lo confirma)
- JWT via `Authorization: Bearer <token>`
- Roles: ADMIN, CAJERO, MESERO, COCINA
- Frontend `api.ts` interceptor maneja 401 → evento `auth:unauthorized`

## Flujo Kanban (OrderStatus)
```
PENDIENTE → EN_COCINA → LISTO → SERVIDO → PAGADO
```
- **COCINA:** PENDIENTE → EN_COCINA → LISTO
- **MESERO:** LISTO → SERVIDO
- **CAJERO/ADMIN:** SERVIDO → PAGADO (libera mesa)

## Consumibles (supply items) bypassan cocina
- Items `type: 'supply'` no pasan por Kanban de cocina
- Mesero marca `served = true` por item → deduce stock (movimiento tipo MERMA)
- Al cobrar: se excluyen items con `served = false`
- Kanban cocina (`filterType="dish"`) solo muestra órdenes con al menos un plato

## Socket.IO
- **Auth:** JWT en `socket.handshake.auth.token`
- **Rooms:** clientes se unen a `kitchen`, `waiter`, `admin`, `cajero` según rol
- **Eventos:** `order_created`, `order_status_changed`, `caja_opened`, `caja_closed`, `stock_low`, `menu_updated`, `table_layout_updated`

## Rutas Express (orden importante)
- Rutas con segmentos estáticos (`/low-stock`, `/:id/kardex`) deben ir ANTES de `/:id`
- Ver `supply.routes.ts` para referencia

## Convenciones
- **No tests** — sin test runner configurado
- **Sin Prettier** — sin config
- **ESLint** solo en Frontend (flat config)
- **Tailwind CSS 4** vía `@tailwindcss/vite` plugin (sin `tailwind.config.js`)
- **Prisma:** siempre `db push` (no `migrate dev`) — entorno no interactivo
- **Backend tsconfig** requiere `"types": ["node"]` para seed compilation
- Killeo processos Node: `Stop-Process -Name "node" -Force` antes de `prisma generate`

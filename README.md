# Sistema de Gestión para Restaurante

## Stack
- **Backend:** Node.js + Express 5 + Prisma + MySQL + Socket.IO + pdfmake
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + TanStack Query + Socket.IO Client
- **Moneda:** Bs. (Bolivianos) — formato `Bs. 120.00`
- **Zona horaria:** Bolivia UTC-4 — fechas UTC convertidas en frontend con `toLocaleString('es-BO', { timeZone: 'America/La_Paz' })`

## Estructura
```
Backend/          # API REST (src/, prisma/, .env)
Frontend/         # React SPA (src/, vite.config.ts)
```
- Backend `app.ts` sirve `Frontend/dist/` en producción
- Frontend `vite.config.ts` proxy: `/api`, `/uploads`, `/socket.io` → `http://localhost:3000`
- Frontend usa `@/` alias → `src/`

## Instalación Rápida

### Backend (puerto 3000)
```bash
cd Backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

### Frontend (puerto 5173)
```bash
cd Frontend
npm install
npm run dev
```

## Usuarios de Prueba
| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | admin | (aleatoria, ver consola al ejecutar seed) |
| Cajero | cajero | (aleatoria) |
| Mesero | mesero | (aleatoria) |
| Cocina | cocina | (aleatoria) |

> Login con **username** (no email).

## Flujo Kanban (OrderStatus)
```
PENDIENTE → EN_COCINA → LISTO → SERVIDO → PAGADO → ENTREGADO
```

### Por tipo de pedido
| Tipo | Flujo |
|---|---|
| **PARA_AQUI** (mesa) | PENDIENTE → EN_COCINA → LISTO → SERVIDO → PAGADO |
| **PARA_LLEVAR** | PENDIENTE → EN_COCINA → LISTO → PAGADO (cajero/admin) → ENTREGADO (mesero) |
| **DELIVERY** | PENDIENTE → EN_COCINA → LISTO → PAGADO (cajero/admin) → ENTREGADO (mesero) |

- **COCINA:** PENDIENTE → EN_COCINA → LISTO
- **MESERO:** LISTO → SERVIDO (solo PARA_AQUI) / PAGADO → ENTREGADO (PARA_LLEVAR/DELIVERY)
- **CAJERO/ADMIN:** SERVIDO → PAGADO / LISTO → PAGADO (no dine-in)

## Roles y Rutas
| Rol | Rutas principales |
|---|---|
| **ADMIN** | `/admin/dashboard`, `/admin/caja`, `/admin/mesas`, `/admin/platos`, `/admin/consumibles`, `/admin/atender-consumibles`, `/admin/perdidos`, `/admin/menu`, `/admin/usuarios`, `/admin/reportes`, `/admin/nuevo-pedido` |
| **CAJERO** | `/cajero` |
| **MESERO** | `/mesero/dashboard`, `/mesero/nuevo-pedido`, `/mesero/consumibles` |
| **COCINA** | `/cocina` |

## Características

### Backend
- JWT Auth con roles (ADMIN, CAJERO, MESERO, COCINA)
- CRUD completo: platos, consumibles, mesas, usuarios, categorías
- Gestión de mesas con layout visual (posX, posY, shape, width, height)
- Máquina de estados con 6 estados (PENDIENTE → ENTREGADO)
- Consumibles (supply items) bypassan cocina, se descuentan al servir
- Descuento automático de stock con movimientos tipo MERMA
- WebSockets (Socket.IO) para tiempo real con rooms por rol
- Impresión de tickets (ESC/POS, preparado para IPs locales)
- Reportes: ventas diarias, platos top, cierre turno, kardex
- Caja: apertura/cierre con montos, historial de sesiones
- Descarga de tickets/recibos en PDF via auth por query param

### Frontend
- React 19 + TypeScript + Vite (HMR rápido)
- Tailwind CSS 4 vía `@tailwindcss/vite` plugin (sin tailwind.config.js)
- TanStack Query (React Query) para caching e invalidación
- React Router con redirección por roles
- Socket.IO client para actualizaciones en tiempo real
- Login con persistencia JWT (localStorage)
- Vistas: Caja, Cocina, Mesero, Admin con paneles específicos
- KanbanBoard para cocina y mesero (drag-free, botones)
- TableCanvas interactivo con arrastrar mesas + soporte táctil
- TicketPreviewModal con visor PDF embebido y apertura en nueva pestaña
- CRUD completo: platos, consumibles, mesas, usuarios, menú
- Reportes con gráficos y resumen de cierre de turno
- Consumibles: vista de atención por mesa con filtro pendientes/atendidos

## WebSockets
- **Auth:** JWT en `socket.handshake.auth.token`
- **Rooms:** clientes se unen a `kitchen`, `waiter`, `admin`, `cajero` según rol
- **Eventos:** `order_created`, `order_status_changed`, `caja_opened`, `caja_closed`, `stock_low`, `menu_updated`, `table_layout_updated`

## Configuración de Impresoras
Editar `Backend/.env`:
```
PRINTER_KITCHEN_IP=192.168.1.100
PRINTER_CASHIER_IP=192.168.1.101
```

## Comandos Útiles

### Backend
```bash
npm run build        # tsc → dist/
npm run prisma:seed  # ts-node-dev prisma/seed.ts
```

### Frontend
```bash
npm run build        # tsc && vite build
```

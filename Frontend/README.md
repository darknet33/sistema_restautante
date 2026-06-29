# Frontend - Sistema de Gestión para Restaurante

## Stack
- React 19 + TypeScript
- Vite (bundler)
- Tailwind CSS 4 vía `@tailwindcss/vite` plugin
- TanStack Query (React Query)
- Socket.IO Client
- React Router DOM v7
- Lucide React (iconos)

## Scripts
- `npm run dev` — Inicia servidor desarrollo (puerto 5173, con `--host`)
- `npm run build` — `tsc && vite build` → `dist/`
- `npm run preview` — Previsualiza build producción

## Estructura
```
src/
├── components/     # KanbanBoard, Modal, TableCanvas, TicketPreview, OrderCard
├── pages/          # admin/, cajero/, cocina/, waiter/, Login.tsx
├── services/       # API calls (axios) con interceptor 401
├── hooks/          # useSocket, useOrderCreated, useOrderStatusChanged
├── types/          # interfaces TypeScript
├── App.tsx         # Routing con protección por rol
├── api.ts          # Axios instance + interceptors
└── main.tsx        # Entry point
```

## Proxy API (vite.config.ts)
- `/api` → `http://localhost:3000`
- `/uploads` → `http://localhost:3000`
- `/socket.io` → `http://localhost:3000` (WebSocket)

## Usuarios de prueba
- **Admin:** admin / (contraseña aleatoria al ejecutar seed)
- **Cajero:** cajero / (contraseña aleatoria al ejecutar seed)
- **Mesero:** mesero / (contraseña aleatoria al ejecutar seed)
- **Cocina:** cocina / (contraseña aleatoria al ejecutar seed)

> Login con **username**, no email.

## Rutas por Rol

### Admin
- `/admin/dashboard` — Panel general
- `/admin/caja` — Gestión de caja + cobros
- `/admin/mesas` — CRUD mesas + layout visual
- `/admin/platos` — CRUD platos
- `/admin/consumibles` — Inventario (CRUD insumos)
- `/admin/atender-consumibles` — Atender consumibles por mesa
- `/admin/perdidos` — Mermas y desperdicios
- `/admin/menu` — Gestión de menú
- `/admin/usuarios` — CRUD usuarios
- `/admin/reportes` — Reportes y cierre turno
- `/admin/nuevo-pedido` — Crear pedido (reusa componente mesero)

### Cajero
- `/cajero` — Dashboard con cobros y caja

### Mesero
- `/mesero/dashboard` — Kanban + mesas
- `/mesero/nuevo-pedido` — Crear pedido
- `/mesero/consumibles` — Atender consumibles

### Cocina
- `/cocina` — Kanban cocina (PENDIENTE → EN_COCINA → LISTO)

## Convenciones
- Sin test runner configurado
- Sin Prettier, ESLint con flat config
- Álias `@/` → `src/`
- Tailwind CSS 4 sin `tailwind.config.js`

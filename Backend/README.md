# Backend - Sistema de Gestión para Restaurante

## Stack
- Node.js + Express 5 + TypeScript
- MySQL + Prisma ORM v5
- Socket.IO (tiempo real)
- JWT (autenticación)
- pdfmake (generación PDF tickets)

## Variables de entorno (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=davian
DB_NAME=restaurante_db
JWT_SECRET=supersecretjwtkey_restaurant_2026
JWT_EXPIRES_IN=8h
PORT=3000
NODE_ENV=development
DATABASE_URL="mysql://root:davian@localhost:3306/restaurante_db"
PRINTER_KITCHEN_IP=
PRINTER_CASHIER_IP=
```

## Scripts
- `npm run dev` — ts-node-dev con recarga
- `npm run build` — Compila TypeScript a `dist/`
- `npm run prisma:seed` — Carga datos iniciales
- `npx prisma generate` — Genera cliente Prisma
- `npx prisma db push` — Sincroniza schema con BD (no migrate)

## Endpoints principales

### Auth
- `POST /api/auth/login` — Login con **username** + password
- `POST /api/auth/users` — Crear usuario (Admin)

### Mesas
- `GET /api/tables` — Listar mesas
- `POST /api/tables` — Crear mesa (Admin)
- `PUT /api/tables/:id` — Actualizar mesa (layout, posición)
- `DELETE /api/tables/:id` — Eliminar mesa (solo si sin pedidos activos)
- `PATCH /api/tables/:id/status` — Cambiar estado mesa

### Pedidos
- `POST /api/orders` — Crear pedido
- `GET /api/orders` — Listar pedidos
- `GET /api/orders/:id` — Detalle pedido
- `PATCH /api/orders/:id/status` — Transicionar estado
- `PATCH /api/orders/:id/serve-item/:itemId` — Marcar consumible servido
- `GET /api/orders/:id/ticket` — PDF ticket cocina (?token=)
- `GET /api/orders/:id/receipt` — PDF recibo cliente (?token=)

### Platos
- `GET /api/dishes` — Listar platos
- `POST /api/dishes` — Crear plato
- `PUT /api/dishes/:id` — Actualizar plato
- `DELETE /api/dishes/:id` — Eliminar plato

### Consumibles (Insumos)
- `GET /api/supplies` — Listar consumibles
- `GET /api/supplies/low-stock` — Alertas stock bajo
- `GET /api/supplies/:id/kardex` — Kardex de movimientos
- `POST /api/supplies` — Crear consumible
- `PUT /api/supplies/:id` — Actualizar consumible
- `DELETE /api/supplies/:id` — Eliminar consumible
- `POST /api/supplies/:id/movement` — Movimiento inventario

### Reportes
- `GET /api/reports/daily-sales` — Ventas del día
- `GET /api/reports/top-dishes` — Platos más vendidos
- `POST /api/reports/close-turno` — Cierre de turno (cierra también caja)
- `GET /api/reports/kardex` — Kardex general

### Caja
- `GET /api/caja/current` — Sesión actual
- `POST /api/caja/open` — Abrir caja
- `POST /api/caja/close` — Cerrar caja
- `GET /api/caja/history` — Historial de sesiones

### Menú
- `GET /api/menu` — Menú público (platos con isMenu=true)
- `PUT /api/menu/items` — Actualizar items del menú

### Usuarios
- `GET /api/auth/users` — Listar usuarios
- `PUT /api/auth/users/:id` — Actualizar usuario
- `DELETE /api/auth/users/:id` — Eliminar usuario

## WebSockets
- Rooms: `kitchen`, `waiter`, `admin`, `cajero`
- Eventos: `order_created`, `order_status_changed`, `caja_opened`, `caja_closed`, `stock_low`, `menu_updated`, `table_layout_updated`

## Auth
- Login con **username** + password
- JWT vía `Authorization: Bearer <token>`
- Endpoints PDF aceptan `?token=` como query param alternativo

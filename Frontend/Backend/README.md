# Backend - Sistema de Gestión para Restaurante

## Descripción
API REST para sistema de punto de venta y gestión operativa de restaurante.

## Tecnologías
- Node.js + Express + TypeScript
- MySQL + Prisma ORM v5
- Socket.io (tiempo real)
- JWT (autenticación)

## Configuración

### Variables de entorno (.env)
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
```

### Instalación
```bash
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
```

## Scripts disponibles
- `npm run dev` - Inicia servidor en modo desarrollo
- `npm run build` - Compila TypeScript
- `npm start` - Inicia servidor producción
- `npm run prisma:generate` - Genera cliente Prisma
- `npm run prisma:push` - Sincroniza schema con BD
- `npm run prisma:seed` - Carga datos iniciales

## Endpoints principales

### Auth
- POST `/api/auth/login` - Login {email, password}
- POST `/api/auth/users` - Crear usuario (Admin/Cajero)

### Productos
- GET `/api/products` - Listar productos
- GET `/api/products/low-stock` - Alerts stock bajo
- POST `/api/products` - Crear producto
- PUT `/api/products/:id` - Actualizar producto
- DELETE `/api/products/:id` - Eliminar producto

### Mesas
- GET `/api/tables` - Listar mesas (6-7)
- PATCH `/api/tables/:id/status` - Cambiar estado mesa

### Pedidos
- POST `/api/orders` - Crear pedido
- GET `/api/orders` - Listar pedidos
- PATCH `/api/orders/:id/status` - Cambiar estado (PENDIENTE→EN_COCINA→LISTO→SERVIDO→PAGADO)

### Inventario
- GET `/api/inventory/movements` - Historial movimientos
- POST `/api/inventory/movements` - Nuevo movimiento (entrada/merma/ajuste)

### Reportes
- GET `/api/reports/daily-sales` - Ventas del día
- GET `/api/reports/top-dishes` - Platos más vendidos
- POST `/api/reports/close-turno` - Cierre de turno

## Usuarios iniciales (seed)
- Admin: admin@restaurante.com / admin123
- Cajero: cajero@restaurante.com / cajero123
- Mesero: mesero@restaurante.com / mesero123

## WebSockets
Eventos en tiempo real:
- `order_created` - Nuevo pedido
- `order_status_changed` - Cambio estado pedido
- `stock_low` - Alerta stock bajo
- `menu_updated` - Cambios en menú

Rooms: `kitchen`, `waiter`, `admin`

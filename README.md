# Sistema de Gestión para Restaurante - MVP

## Estructura del Proyecto
```
Proyecto_Restaurant/
├── Backend/           # API REST (Node.js + Express + Prisma + MySQL)
│   ├── src/
│   │   ├── controllers/  # Lógica de endpoints
│   │   ├── routes/      # Definición de rutas
│   │   ├── middleware/   # Auth JWT + roles
│   │   ├── services/    # Lógica de impresión
│   │   ├── socket/      # WebSockets (tiempo real)
│   │   └── utils/       # Prisma client
│   ├── prisma/
│   │   └── schema.prisma  # Esquema BD
│   └── .env             # Variables entorno
│
└── Frontend/          # Interfaz Web (React + Vite + Tailwind)
    ├── src/
    │   ├── pages/      # Login, Caja, Cocina, Mesero, Admin
    │   ├── services/   # API calls
    │   ├── socket/     # WebSocket client
    │   ├── types/      # TypeScript interfaces
    │   └── App.tsx     # Routing
    └── dist/            # Build producción
```

## Requisitos Previos
- Node.js 18+
- MySQL 8+ corriendo localmente
- Base de datos `restaurante_db` creada
- Puerto 3000 (Backend) y 5173 (Frontend) libres

## Instalación Rápida

### 1. Backend
```powershell
cd D:\Proyectos\Locales\Proyecto_Restaurant\Backend
npm install
npx prisma generate
npx prisma db push
npx ts-node-dev --respawn --transpile-only prisma/seed.ts
npm run dev  # Inicia en puerto 3000
```

### 2. Frontend
```powershell
cd D:\Proyectos\Locales\Proyecto_Restaurant\Frontend
npm install
npm run dev  # Inicia en puerto 5173
```

## Usuarios de Prueba
| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@restaurante.com | admin123 |
| Cajero | cajero@restaurante.com | cajero123 |
| Mesero | mesero@restaurante.com | mesero123 |

## Flujo de Uso

### 1. Caja (Admin/Cajero)
1. Login con credenciales
2. Selecciona mesa (7 mesas disponibles)
3. Agrega productos/bebidas al pedido
4. Click "Crear Pedido y Enviar a Cocina"
5. Pedido se envía automáticamente a cocina
6. Al hacer click en "Pagar", la mesa se libera automáticamente

### 2. Cocina
1. Login con cualquier usuario + ve a `/cocina`
2. Ve pedidos pendientes en tiempo real (<1 seg)
3. Click "Marcar Listo" → notifica a meseros

### 3. Mesero
1. Login → vista de mesas y pedidos activos
2. Ve estado de mesas y pedidos en tiempo real

### 4. Admin
1. Login → panel de administración
2. **Ventas del día** - total, tickets, promedio
3. **Alertas de stock** - bebidas con stock bajo
4. **Platos más vendidos** - filtro por platos/bebidas
5. **Gestión de Productos** - botón "Nuevo Producto" / editar / eliminar
6. **Cerrar Turno** - resumen de ventas

## Características Implementadas

### Backend ✅
- JWT Auth con roles (ADMIN, CAJERO, MESERO, COCINA)
- CRUD completo de productos/insumos
- Gestión de mesas (7) con estados visuales
- Máquina de estados: PENDIENTE → EN_COCINA → LISTO → SERVIDO → PAGADO
- Descuento automático de stock (solo bebidas/insumos)
- Movimientos de inventario con auditoría
- WebSockets (Socket.io) para tiempo real
- Impresión ESC/POS (preparado para IPs locales)
- Reportes: ventas, platos top, cierre turno

### Frontend ✅
- React + TypeScript + Vite
- Tailwind CSS (interfaz táctil optimizada)
- TanStack Query (React Query) para caching
- React Router con redirección por roles
- Socket.io client para actualizaciones <1 seg
- Login con persistencia JWT
- Vistas: Caja, Cocina, Mesero, Admin
- CRUD productos con diferenciación platos/bebidas/insumos

## Configuración de Impresoras
Editar `Backend/.env`:
```
PRINTER_KITCHEN_IP=192.168.1.100
PRINTER_CASHIER_IP=192.168.1.101
```
Las impresoras deben estar configuradas con IP fija en la red local.

## Próximos Pasos (Semana 3)
1. **PWA** - Manifest + Service Worker para modo offline
2. **Docker + PM2** - Despliegue producción local
3. **Testing** - Pruebas de carga (5 usuarios concurrentes)
4. **Documentación** - Manual de usuario para capacitación
5. **Impresión real** - Configurar con impresoras Epson TM-T20III

## Criterios de Aceptación (MVP)
✅ CRUD productos/insumos con auditoría
✅ Pedidos para 7 mesas con validación stock bebidas
✅ Ticket cocina + ficha mesero en <3 segundos
✅ Vista cocina tiempo real (<1s latencia)
✅ Dashboard: ventas, platos top, alertas stock
✅ Cierre mesa libera estado + resumen
✅ Sistema opera estable en red local

## Soporte
Para dudas o problemas, revisar:
- Backend: `Backend/README.md`
- Frontend: `Frontend/README.md`

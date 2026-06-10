
# Proyecto_Restaurant — Documentación del Sistema

## Stack tecnológico
- **Backend:** Node.js + Express 5 + Prisma + MySQL + Socket.IO + pdfmake
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + TanStack Query + Socket.IO Client
- **Impresión:** ESC/POS para impresoras Epson TM-T20III (simulación con PDF por ahora)

## Roles del sistema (4 roles)
| Rol | Descripción |
|-----|-------------|
| ADMIN | Gestión completa: CRUD platos, consumibles, usuarios, menú, QR, reportes, dashboard tiempo real, apertura/cierre caja, cobrar |
| CAJERO | Apertura/cierre caja, cobrar pedidos, dashboard tiempo real |
| MESERO | Crear pedidos, kanban de estados, gestión consumibles extras, ver layout mesas |
| COCINA | Kanban cocina (PENDIENTE → EN_COCINA → LISTO), notificar listo |

## Login
- Todos los roles inician sesión con **username** y contraseña (NO email)
- El campo email existe pero es opcional en el modelo User

## Modelo de datos (Prisma)

### User
```
username  String  @unique  (usado para login)
email     String? @unique  (opcional)
password  String
name      String
role      UserRole (ADMIN | CAJERO | MESERO | COCINA)
```

### Dish (Platos)
```
name        String
description String?
price       Decimal
cost        Decimal
categoryId  Int    → Category (type: 'plato')
imageUrl    String?
isAvailable Boolean default true
isMenu      Boolean default false  (si aparece en menú público)
```

### Supply (Consumibles / Inventario)
```
name               String
unit               String  ('unidad' | 'ml' | 'g' | 'porcion')
purchaseCost       Decimal @default(0)
salePrice          Decimal @default(0)
stockCurrent       Decimal
stockMin           Decimal
categoryId         Int     → Category (type: 'bebida' | 'insumo')
isInventoryTracked Boolean default false
```

### Table (Mesas)
```
number    Int     @unique
seats     Int     default 4
status    TableStatus (LIBRE | OCUPADA | RESERVADA | LIMPIEZA)
posX      Float?  (posición en el canvas visual)
posY      Float?
shape     String? default 'circle' ('circle' | 'square' | 'rectangle')
width     Float?  default 80
height    Float?  default 80
```

### Order (Pedidos)
```
tableId   Int    → Table
userId    Int    → User
status    OrderStatus
total     Decimal
notes     String?
```
OrderStatus enum: `PENDIENTE | EN_COCINA | LISTO | SERVIDO | PAGADO`

### OrderItem
```
orderId   Int     → Order
dishId    Int?    → Dish (si es plato)
supplyId  Int?    → Supply (si es consumible)
type      String  ('dish' | 'supply')
quantity  Decimal
unitPrice Decimal
notes     String?
served    Boolean @default(false)  (indica si el consumible fue atendido)
```

### Waste (Perdido / Merma)
```
supplyId  Int     → Supply
quantity  Decimal
reason    String  (motivo de pérdida)
userId    Int     → User
```

### CajaSession (Apertura/Cierre de Caja)
```
userId         Int     → User
openingAmount  Decimal (monto inicial)
closingAmount  Decimal? (monto final al cerrar)
openedAt       DateTime
closedAt       DateTime?
status         String  ('ABIERTA' | 'CERRADA')
```

### Category
```
name  String
type  String ('plato' | 'bebida' | 'insumo')
Relación: dishes Dish[], supplies Supply[]
```

### InventoryMovement
```
supplyId    Int      → Supply
type        MovementType (ENTRADA | MERMA | AJUSTE)
quantity    Decimal
stockBefore Decimal
stockAfter  Decimal
userId      Int      → User
createdAt   DateTime @default(now())
```

### TurnoClosure (histórico de cierres)
```
userId      Int     → User
openedAt    DateTime
closedAt    DateTime?
totalSales  Decimal
totalOrders Int
```

## Flujo del Kanban (OrderStatus)
```
PENDIENTE ──→ EN_COCINA ──→ LISTO ──→ SERVIDO ──→ PAGADO
   (creado)   (cocina)      (listo)   (entregado)  (cobrado)
```

**Quién mueve:**
- COCINA: PENDIENTE → EN_COCINA → LISTO
- MESERO: LISTO → SERVIDO
- CAJERO/ADMIN: SERVIDO → PAGADO (libera mesa)

## Flujo de Consumibles (separado de platos)
- Los consumibles **no pasan por cocina** — bypasscan el Kanban
- El mesero atiende consumibles directamente marcando `served = true` por item
- **Deducción de stock:** ocurre al marcar `served`, no al enviar a cocina
- Stock se deduce con tipo `MERMA` en `InventoryMovement`, usando el usuario mesero como responsable
- **Al cobrar:** se excluyen del total los consumibles con `served = false` (no atendidos)
- Kanban de cocina (`filterType="dish"`): solo muestra órdenes con al menos un plato

## Eventos Socket.IO

| Evento | Emisor | Destino | Descripción |
|--------|--------|---------|-------------|
| `order_created` | Backend | kitchen, waiter, admin | Nuevo pedido creado |
| `order_status_changed` | Backend | kitchen, waiter, admin | Cambio de estado Kanban |
| `caja_opened` | Backend | admin, cajero | Caja abierta |
| `caja_closed` | Backend | admin, cajero | Caja cerrada |
| `stock_low` | Backend | admin | Stock por debajo del mínimo |
| `menu_updated` | Backend | waiter, admin | Menú actualizado (recargar) |
| `table_layout_updated` | Backend | all | Layout de mesas actualizado |

## Estructura Frontend

### Componentes reutilizables (`src/components/`)
| Componente | Descripción |
|-------------|-------------|
| `Layout.tsx` | Sidebar responsiva + header + outlet |
| `KanbanBoard.tsx` | Tablero Kanban drag & drop |
| `KanbanColumn.tsx` | Columna individual del Kanban |
| `OrderCard.tsx` | Card de pedido con imagen, nombre, cantidad, notas. Props: `filterType` ('dish'|'supply'), indicador visual de `served` |
| `TableCanvas.tsx` | Canvas interactivo para visualizar/editar mesas |
| `TableNode.tsx` | Mesa individual en el canvas |
| `TablePalette.tsx` | Paleta para arrastrar mesas al canvas |
| `DishSelector.tsx` | Selector de platos para pedidos |
| `SupplySelector.tsx` | Selector de consumibles para pedidos |
| `Modal.tsx` | Modal genérico reutilizable |
| `QRCode.tsx` | Visualizador/descargador de QR |

### Hooks (`src/hooks/`)
| Hook | Descripción |
|------|-------------|
| `useSocket.ts` | Hook para conexión socket + eventos |
| `useAuth.ts` | Hook de autenticación y rol |

### Páginas por rol

**ADMIN:**
- `/admin/dashboard` — Tiempo real: Kanban general + estado mesas en canvas
- `/admin/caja` — Apertura/cierre de caja con montos
- `/admin/platos` — CRUD platos con subida de imagen
- `/admin/consumibles` — CRUD consumibles + entrada de stock
- `/admin/perdidos` — Registro de mermas/pérdidas
- `/admin/menu` — Gestión de menú público + generación QR
- `/admin/usuarios` — CRUD usuarios del sistema
- `/admin/reportes` — Dashboard ventas, platos top, cierres

**CAJERO:**
- `/cajero` — Caja actual + cobrar pedidos + dashboard tiempo real

**MESERO:**
- `/mesero/dashboard` — Kanban (LISTO → SERVIDO) + canvas mesas
- `/mesero/nuevo-pedido` — Seleccionar mesa → agregar platos/consumibles → enviar
- `/mesero/consumibles` — Bebidas/extras ordenados por prioridad

**COCINA:**
- `/cocina` — Kanban (PENDIENTE → EN_COCINA → LISTO) con cards grandes

### Diseño responsivo

| Breakpoint | Sidebar | Kanban | TableCanvas | Modales |
|------------|---------|--------|-------------|---------|
| >1024px (PC) | Fija 240px | 4 columnas | Grid completo | Centrado |
| 768-1024px (Tablet) | Iconos 64px | 2 columnas | Scroll horizontal | Full-width |
| <768px (Móvil) | Bottom nav | 1 columna + tabs | 1 columna | Bottom sheet |

### Paleta de colores
- Sidebar: `bg-gray-900` texto blanco
- Fondo principal: `bg-gray-50`
- Kanban columnas: fondos diferenciados por estado
  - PENDIENTE: `bg-gray-100`
  - EN_COCINA: `bg-blue-50`
  - LISTO: `bg-green-50`
  - SERVIDO: `bg-orange-50`
- Estados mesa: verde (libre), rojo (ocupada), amarillo (reservada), gris (limpieza)
- Cards pedido: borde izquierdo coloreado según estado

## PDF Generation (pdfmake)
- **Ticket Cocina:** Platos + cantidades + notas + mesa. Sin precios.
- **Ticket Cliente:** Platos + cantidades + precios + total + mesa. Con costo.
- Generado en backend como buffer/binario
- Descargable desde el frontend

## Impresión Epson (automática)
- Configurable por IP en `.env` (PRINTER_KITCHEN_IP, PRINTER_CASHIER_IP)
- Al crear pedido → ticket cocina automático
- Al pagar → ticket cliente automático

## Endpoints API

### Auth
```
POST /api/auth/login       { username, password } → { token, user }
POST /api/auth/users       { username, password, name, role } → User
```

### Dishes (Platos)
```
GET    /api/dishes               → Dish[]
GET    /api/dishes/:id           → Dish
POST   /api/dishes               → Dish (multipart: form-data con imagen)
PUT    /api/dishes/:id           → Dish
DELETE /api/dishes/:id           → 204
PATCH  /api/dishes/:id/image     → Dish (subir/actualizar imagen)
```

### Supplies (Consumibles)
```
GET    /api/supplies             → Supply[]
GET    /api/supplies/low-stock   → Supply[] (stock bajo)
GET    /api/supplies/:id/kardex  → KardexResponse (movimientos + stock inicial/final)
POST   /api/supplies             → Supply
PUT    /api/supplies/:id         → Supply
DELETE /api/supplies/:id         → 204
POST   /api/supplies/:id/stock   → { quantity } (entrada inventario)
```

### Waste (Perdidos)
```
GET    /api/waste                → Waste[] (con filtro fechas)
POST   /api/waste                → { supplyId, quantity, reason }
```

### Caja
```
GET    /api/caja/current         → CajaSession actual (o null)
POST   /api/caja/open            → { openingAmount }
POST   /api/caja/close           → { closingAmount }
GET    /api/caja/history         → CajaSession[] histórico
```

### Orders
```
POST   /api/orders               → { tableId, items: [{ dishId?, supplyId?, quantity?, notes?}], notes? }
GET    /api/orders                → Order[] (filtro: status, tableId)
GET    /api/orders/:id            → Order
PATCH  /api/orders/:id/status     → { status }
PATCH  /api/orders/:orderId/items/:itemId/serve → OrderItem (marcar consumible atendido)
```

### Menu (Público)
```
GET    /api/menu                  → Dish[] (isMenu = true, isAvailable = true)
GET    /api/menu/qr               → { qrDataUrl, url }
```

### Tables
```
GET    /api/tables                → Table[] (con orders activos)
PATCH  /api/tables/:id            → { status } o { posX, posY, shape, width, height }
PUT    /api/tables/layout         → Table[] (guardar layout completo)
```

### Reports
```
GET    /api/reports/daily-sales   → { totalSales, totalOrders, avgTicket }
GET    /api/reports/top-dishes    → [{ dish, totalQty }]
POST   /api/reports/close-turno   → TurnoClosure
```

### Categories
```
GET    /api/categories            → Category[]
```

## Zona Horaria y Moneda
- **Zona horaria:** Bolivia (UTC-4, sin horario de verano)
- **Almacenamiento:** Todas las fechas se almacenan en UTC en la base de datos (Prisma `@default(now())`)
- **Visualización:** El frontend convierte UTC → Bolivia (UTC-4) usando `toLocaleString('es-BO', { timeZone: 'America/La_Paz' })`
- **Moneda:** Bolivianos (Bs.)
- **Formato:** `Bs. 120.00` — 2 decimales, separador decimal `.`, sin separador de miles
- **Formatter:** `src/utils/format.ts` — funciones `formatCurrency()`, `formatDate()`, `formatDateTime()`

## Reportes y Fechas
- Los reportes de ventas diarias (`daily-sales`, `top-dishes`) usan la fecha **Bolivia (UTC-4)** para determinar el día actual
- El backend calcula el inicio/fin del día Bolivia para filtrar órdenes PAGADO

## Seed Data (`prisma/seed.ts`)
```
Usuarios: admin/admin123, cajero/cajero123, mesero/mesero123, cocina/cocina123
Categorías: Platos Fuertes, Bebidas, Insumos
Platos: Hamburguesa Clásica (Bs. 120), Pizza Margherita (Bs. 150), Tacos al Pastor (Bs. 90)
Consumibles: Coca Cola 600ml, Agua Mineral 500ml, Jugo Naranja, Papas Fritas, Pan Hamburguesa
            — todos con purchaseCost, salePrice y movimiento inicial en kardex
Mesas: 7 mesas estado LIBRE
```

## Notas de configuración
- `tsconfig.json` requiere `"types": ["node"]` para que el seed compile con `ts-node-dev`
- Usar `npx prisma db push` para crear tablas (no `migrate dev` en entorno no-interactivo)
- Orden de rutas Express: `/:id/kardex` debe definirse ANTES de `/:id`
- Al matar procesos de Node: `Stop-Process -Name "node" -Force` antes de `prisma generate`

## Tareas pendientes del plan original
- PWA (Manifest + Service Worker)
- Docker + PM2 para producción
- Pruebas de carga 5 usuarios concurrentes
- Configuración impresoras Epson reales
- Manual de usuario

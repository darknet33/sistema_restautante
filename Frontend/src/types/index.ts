export interface User {
  id: number
  username: string
  name: string
  role: 'ADMIN' | 'CAJERO' | 'MESERO' | 'COCINA'
}

export interface Category {
  id: number
  name: string
  type: string
}

export interface Dish {
  id: number
  name: string
  description?: string
  price: number
  cost: number
  categoryId: number
  category?: Category
  imageUrl?: string
  isAvailable: boolean
  isMenu: boolean
}

export interface Supply {
  id: number
  name: string
  unit: string
  purchaseCost: number
  salePrice: number
  stockCurrent: number
  stockMin: number
  categoryId: number
  category?: Category
  isInventoryTracked: boolean
}

export interface Table {
  id: number
  number: number
  seats: number
  status: 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'LIMPIEZA'
  posX?: number
  posY?: number
  shape?: string
  width?: number
  height?: number
  orders?: Order[]
}

export interface OrderItem {
  id: number
  orderId: number
  dishId?: number
  supplyId?: number
  type: 'dish' | 'supply'
  quantity: number
  unitPrice: number
  costPrice: number
  notes?: string
  served: boolean
  dish?: Dish
  supply?: Supply
}

export interface Order {
  id: number
  tableId: number
  table?: Table
  userId: number
  user?: { id: number; name: string }
  status: 'PENDIENTE' | 'EN_COCINA' | 'LISTO' | 'SERVIDO' | 'PAGADO'
  total: number
  notes?: string
  items?: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface Waste {
  id: number
  supplyId: number
  supply?: Supply
  quantity: number
  reason: string
  userId: number
  user?: { id: number; name: string }
  createdAt: string
}

export interface CajaSession {
  id: number
  userId: number
  user?: { id: number; name: string; username: string }
  openingAmount: number
  closingAmount?: number
  openedAt: string
  closedAt?: string
  status: 'ABIERTA' | 'CERRADA'
}

export interface LoginResponse {
  token: string
  user: User
}

export interface DailySales {
  date: string
  totalSales: number
  totalOrders: number
  avgTicket: number
}

export interface KardexMovement {
  id: number
  date: string
  type: 'ENTRADA' | 'MERMA' | 'AJUSTE'
  quantity: number
  stockBefore: number
  stockAfter: number
  user: { id: number; name: string }
}

export interface KardexResponse {
  supply: {
    id: number
    name: string
    unit: string
    stockCurrent: number
  }
  initialStock: number
  startDate: string
  endDate: string
  movements: KardexMovement[]
}

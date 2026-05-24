export interface User {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'CAJERO' | 'MESERO' | 'COCINA'
}

export interface Category {
  id: number
  name: string
  type: string
}

export interface Product {
  id: number
  name: string
  categoryId: number
  category?: Category
  price: number
  cost: number
  unit: string
  stockCurrent: number
  stockMin: number
  isInventoryTracked: boolean
  isAvailable: boolean
}

export interface Table {
  id: number
  number: number
  seats: number
  status: 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'LIMPIEZA'
  orders?: Order[]
}

export interface OrderItem {
  id: number
  orderId: number
  productId: number
  product?: Product
  quantity: number
  unitPrice: number
  notes?: string
}

export interface Order {
  id: number
  tableId: number
  table?: Table
  userId: number
  user?: User
  status: 'PENDIENTE' | 'EN_COCINA' | 'LISTO' | 'SERVIDO' | 'PAGADO'
  total: number
  notes?: string
  items?: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface InventoryMovement {
  id: number
  productId: number
  product?: Product
  type: 'VENTA' | 'ENTRADA' | 'MERMA' | 'AJUSTE'
  quantity: number
  stockBefore: number
  stockAfter: number
  userId: number
  user?: User
  createdAt: string
}

export interface DailySales {
  date: string
  totalSales: number
  totalOrders: number
  avgTicket: number
}

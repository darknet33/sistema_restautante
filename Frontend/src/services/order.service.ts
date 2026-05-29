import api from './api'
import type { Order } from '../types'

export function createOrder(data: {
  tableId: number
  items: Array<{ dishId?: number; supplyId?: number; quantity: number; notes?: string }>
  notes?: string
}): Promise<Order> {
  return api.post('/orders', data).then(r => r.data)
}

export function getOrders(status?: string, tableId?: number): Promise<Order[]> {
  const params: any = {}
  if (status) params.status = status
  if (tableId) params.tableId = tableId
  return api.get('/orders', { params }).then(r => r.data)
}

export function getOrder(id: number): Promise<Order> {
  return api.get(`/orders/${id}`).then(r => r.data)
}

export function updateOrderStatus(id: number, status: string): Promise<Order> {
  return api.patch(`/orders/${id}/status`, { status }).then(r => r.data)
}

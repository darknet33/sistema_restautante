import api from './api'
import type { Order, OrderItem } from '../types'

export async function createOrder(tableId: number, items: Partial<OrderItem>[], notes?: string): Promise<Order> {
  const { data } = await api.post<Order>('/orders', { tableId, items, notes })
  return data
}

export async function getOrders(status?: string, tableId?: number): Promise<Order[]> {
  const params: any = {}
  if (status) params.status = status
  if (tableId) params.tableId = tableId
  const { data } = await api.get<Order[]>('/orders', { params })
  return data
}

export async function updateOrderStatus(id: number, status: string): Promise<Order> {
  const { data } = await api.patch<Order>(`/orders/${id}/status`, { status })
  return data
}

export async function getOrder(id: number): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`)
  return data
}

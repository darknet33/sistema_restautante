import api from './api'
import type { Order, OrderType } from '../types'

export function createOrder(data: {
  tableId?: number
  orderType: OrderType
  items: Array<{ dishId?: number; supplyId?: number; quantity: number; notes?: string }>
  notes?: string
  deliveryAddress?: string
  deliveryPhone?: string
}): Promise<Order> {
  return api.post('/orders', data).then(r => r.data)
}

export function getOrders(status?: string, tableId?: number, orderType?: string): Promise<Order[]> {
  const params: any = {}
  if (status) params.status = status
  if (tableId) params.tableId = tableId
  if (orderType) params.orderType = orderType
  return api.get('/orders', { params }).then(r => r.data)
}

export function getOrder(id: number): Promise<Order> {
  return api.get(`/orders/${id}`).then(r => r.data)
}

export function updateOrderStatus(id: number, status: string): Promise<Order> {
  return api.patch(`/orders/${id}/status`, { status }).then(r => r.data)
}

export function serveOrderItem(orderId: number, itemId: number): Promise<any> {
  return api.patch(`/orders/${orderId}/items/${itemId}/serve`).then(r => r.data)
}

export function getKitchenTicketUrl(orderId: number): string {
  const token = localStorage.getItem('token')
  return `/api/orders/${orderId}/ticket?token=${token}`
}

export function getCustomerReceiptUrl(orderId: number): string {
  const token = localStorage.getItem('token')
  return `/api/orders/${orderId}/receipt?token=${token}`
}

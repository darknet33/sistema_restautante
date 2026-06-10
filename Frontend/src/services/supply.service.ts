import api from './api'
import type { Supply, KardexResponse } from '../types'

export function getSupplies(category?: number, tracked?: boolean): Promise<Supply[]> {
  const params: any = {}
  if (category) params.category = category
  if (tracked !== undefined) params.tracked = tracked
  return api.get('/supplies', { params }).then(r => r.data)
}

export function getLowStock(): Promise<Supply[]> {
  return api.get('/supplies/low-stock').then(r => r.data)
}

export function getSupply(id: number): Promise<Supply> {
  return api.get(`/supplies/${id}`).then(r => r.data)
}

export function createSupply(data: Partial<Supply>): Promise<Supply> {
  return api.post('/supplies', data).then(r => r.data)
}

export function updateSupply(id: number, data: Partial<Supply>): Promise<Supply> {
  return api.put(`/supplies/${id}`, data).then(r => r.data)
}

export function deleteSupply(id: number): Promise<void> {
  return api.delete(`/supplies/${id}`).then(r => r.data)
}

export function addStock(id: number, quantity: number): Promise<Supply> {
  return api.post(`/supplies/${id}/stock`, { quantity }).then(r => r.data)
}

export function getSupplyKardex(id: number, startDate?: string, endDate?: string): Promise<KardexResponse> {
  const params: any = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return api.get(`/supplies/${id}/kardex`, { params }).then(r => r.data)
}

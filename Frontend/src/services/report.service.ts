import api from './api'
import type { DailySales } from '../types'

export function getDailySales(): Promise<DailySales> {
  return api.get('/reports/daily-sales').then(r => r.data)
}

export function getTopDishes(type?: string): Promise<Array<{ dish: any; totalQty: number }>> {
  const params: any = {}
  if (type) params.type = type
  return api.get('/reports/top-dishes', { params }).then(r => r.data)
}

export function closeTurno(): Promise<any> {
  return api.post('/reports/close-turno').then(r => r.data)
}

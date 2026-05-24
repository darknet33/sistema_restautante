import api from './api'
import type { DailySales } from '../types'

export async function getDailySales(): Promise<DailySales> {
  const { data } = await api.get<DailySales>('/reports/daily-sales')
  return data
}

export async function getTopDishes(): Promise<any[]> {
  const { data } = await api.get<any[]>('/reports/top-dishes')
  return data
}

export async function closeTurno(): Promise<any> {
  const { data } = await api.post<any>('/reports/close-turno')
  return data
}

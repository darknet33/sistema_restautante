import api from './api'
import type { Waste } from '../types'

export function getWastes(startDate?: string, endDate?: string): Promise<Waste[]> {
  const params: any = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return api.get('/waste', { params }).then(r => r.data)
}

export function createWaste(data: { supplyId: number; quantity: number; reason: string }): Promise<Waste> {
  return api.post('/waste', data).then(r => r.data)
}

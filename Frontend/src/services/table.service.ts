import api from './api'
import type { Table } from '../types'

export function getTables(): Promise<Table[]> {
  return api.get('/tables').then(r => r.data)
}

export function getTable(id: number): Promise<Table> {
  return api.get(`/tables/${id}`).then(r => r.data)
}

export function createTable(data: { number: number; seats?: number }): Promise<Table> {
  return api.post('/tables', data).then(r => r.data)
}

export function updateTable(id: number, data: Partial<Table>): Promise<Table> {
  return api.patch(`/tables/${id}`, data).then(r => r.data)
}

export function deleteTable(id: number): Promise<void> {
  return api.delete(`/tables/${id}`)
}

export function saveLayout(tables: Array<{ id: number; posX?: number; posY?: number; shape?: string; width?: number; height?: number }>): Promise<Table[]> {
  return api.put('/tables/layout', { tables }).then(r => r.data)
}

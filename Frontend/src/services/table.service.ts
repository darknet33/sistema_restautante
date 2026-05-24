import api from './api'
import type { Table } from '../types'

export async function getTables(): Promise<Table[]> {
  const { data } = await api.get<Table[]>('/tables')
  return data
}

export async function updateTableStatus(id: number, status: string): Promise<Table> {
  const { data } = await api.patch<Table>(`/tables/${id}/status`, { status })
  return data
}

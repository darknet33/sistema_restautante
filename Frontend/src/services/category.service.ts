import api from './api'
import type { Category } from '../types'

export function getCategories(type?: string): Promise<Category[]> {
  const params: any = {}
  if (type) params.type = type
  return api.get('/categories', { params }).then(r => r.data)
}

export function createCategory(data: { name: string; type: string }): Promise<Category> {
  return api.post('/categories', data).then(r => r.data)
}

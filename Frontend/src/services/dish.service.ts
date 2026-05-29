import api from './api'
import type { Dish } from '../types'

export function getDishes(category?: number, available?: boolean, menu?: boolean): Promise<Dish[]> {
  const params: any = {}
  if (category) params.category = category
  if (available !== undefined) params.available = available
  if (menu !== undefined) params.menu = menu
  return api.get('/dishes', { params }).then(r => r.data)
}

export function getDish(id: number): Promise<Dish> {
  return api.get(`/dishes/${id}`).then(r => r.data)
}

export function createDish(data: FormData): Promise<Dish> {
  return api.post('/dishes', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

export function updateDish(id: number, data: FormData): Promise<Dish> {
  return api.put(`/dishes/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

export function deleteDish(id: number): Promise<void> {
  return api.delete(`/dishes/${id}`).then(r => r.data)
}

export function uploadDishImage(id: number, file: File): Promise<Dish> {
  const form = new FormData()
  form.append('image', file)
  return api.patch(`/dishes/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

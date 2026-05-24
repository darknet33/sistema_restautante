import api from './api'
import type { Product, Category } from '../types'

export async function getProducts(category?: number, available?: boolean): Promise<Product[]> {
  const params: any = {}
  if (category) params.category = category
  if (available !== undefined) params.available = available
  const { data } = await api.get<Product[]>('/products', { params })
  return data
}

export async function getLowStock(): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/products/low-stock')
  return data
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  const { data } = await api.post<Product>('/products', product)
  return data
}

export async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
  const { data } = await api.put<Product>(`/products/${id}`, product)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`)
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/products/categories')
  return data
}

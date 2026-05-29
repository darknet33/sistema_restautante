import api from './api'
import type { Dish } from '../types'

export function getMenu(): Promise<Dish[]> {
  return api.get('/menu').then(r => r.data)
}

export function generateQR(): Promise<{ qrDataUrl: string; url: string }> {
  return api.get('/menu/qr').then(r => r.data)
}

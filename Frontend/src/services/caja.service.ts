import api from './api'
import type { CajaSession } from '../types'

export function getCurrentCaja(): Promise<CajaSession | null> {
  return api.get('/caja/current').then(r => r.data)
}

export function openCaja(openingAmount: number): Promise<CajaSession> {
  return api.post('/caja/open', { openingAmount }).then(r => r.data)
}

export function closeCaja(closingAmount: number): Promise<CajaSession> {
  return api.post('/caja/close', { closingAmount }).then(r => r.data)
}

export function getCajaHistory(): Promise<CajaSession[]> {
  return api.get('/caja/history').then(r => r.data)
}

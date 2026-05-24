import api from './api'
import type { LoginResponse, User } from '../types'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function createUser(email: string, password: string, name: string, role?: string): Promise<User> {
  const { data } = await api.post<User>('/auth/users', { email, password, name, role })
  return data
}

import api from './api'
import type { LoginResponse, User } from '../types'

export function login(username: string, password: string): Promise<LoginResponse> {
  return api.post('/auth/login', { username, password }).then(r => r.data)
}

export function createUser(data: { username: string; password: string; name: string; role?: string }): Promise<User> {
  return api.post('/auth/users', data).then(r => r.data)
}

export function getUsers(): Promise<User[]> {
  return api.get('/auth/users').then(r => r.data)
}

export function updateUser(id: number, data: Partial<User & { password?: string }>): Promise<User> {
  return api.put(`/auth/users/${id}`, data).then(r => r.data)
}

export function deleteUser(id: number): Promise<void> {
  return api.delete(`/auth/users/${id}`).then(r => r.data)
}

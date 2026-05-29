import { useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import { socketService } from '../socket'

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (token && user?.role) {
      socketService.connect(token)
      return () => socketService.disconnect()
    }
    if (token && !user?.role) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    }
  }, [token, user])

  useEffect(() => {
    const onUnauthorized = () => handleLogout()
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [])

  const handleLogin = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    socketService.disconnect()
    setToken(null)
    setUser(null)
  }, [])

  return { token, user, login: handleLogin, logout: handleLogout, isAuthenticated: !!token && !!user?.role }
}

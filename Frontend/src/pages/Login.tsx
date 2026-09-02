import { useState } from 'react'
import { User as UserIcon, Lock, AlertTriangle, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { login as loginApi } from '../services/auth.service'
import type { User } from '../types'

interface LoginProps {
  onLogin: (token: string, user: User) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => loginApi(username, password),
    onSuccess: (data) => onLogin(data.token, data.user),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username && password) mutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#e9e5dc' }}
    >
      {/* Brand header */}
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: '#111', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            <img src="/logo.png" alt="ALTIPIQUI" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-4xl font-heading font-bold" style={{ color: '#111' }}>
            ALTIPIQUI
          </h1>
          <p className="text-gray-600 mt-1 text-sm">Restaurante de Comida Andina — Sabor que manda</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-heading font-bold" style={{ color: '#5D4037' }}>
              Iniciar Sesión
            </h2>
            <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none text-sm transition-shadow"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none text-sm transition-shadow"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl p-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{typeof mutation.error === 'object' && mutation.error !== null && 'response' in mutation.error
                  ? (mutation.error as any).response?.data?.message || 'Error al iniciar sesión'
                  : 'Error al iniciar sesión'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2.5 font-semibold rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: '#d6a73c', color: '#111', boxShadow: '0 4px 14px rgba(214,167,60,0.4)' }}
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Iniciando sesión...</span>
                </span>
              ) : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          © 2026 ALTIPIQUI — Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}

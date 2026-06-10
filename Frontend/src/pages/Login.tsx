import { useState } from 'react'
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
    <div className="min-h-screen bg-gradient-to-br from-altipiqui-red via-altipiqui-red-dark to-altipiqui-indigo-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 ring-2 ring-white/20">
            <img src="/logo.png" alt="ALTIPIQUI" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white">ALTIPIQUI</h1>
          <p className="text-white/70 mt-1 text-sm">Sabor que manda</p>
        </div>

        {/* Login card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-heading font-bold text-altipiqui-brown">Iniciar Sesión</h2>
            <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
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
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
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
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>{typeof mutation.error === 'object' && mutation.error !== null && 'response' in mutation.error
                  ? (mutation.error as any).response?.data?.message || 'Error al iniciar sesión'
                  : 'Error al iniciar sesión'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2.5 bg-altipiqui-red text-white font-semibold rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all duration-200 shadow-lg shadow-altipiqui-red/25 hover:shadow-xl active:scale-[0.98]"
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Iniciando sesión...</span>
                </span>
              ) : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Test credentials */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center mb-2">Credenciales de prueba:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-altipiqui-cream rounded-xl p-2 text-center">
                <strong className="text-altipiqui-red">admin</strong>
                <span className="text-gray-500"> / admin123</span>
              </div>
              <div className="bg-altipiqui-indigo-light rounded-xl p-2 text-center">
                <strong className="text-altipiqui-indigo">cajero</strong>
                <span className="text-gray-500"> / cajero123</span>
              </div>
              <div className="bg-altipiqui-green-light rounded-xl p-2 text-center">
                <strong className="text-altipiqui-green">mesero</strong>
                <span className="text-gray-500"> / mesero123</span>
              </div>
              <div className="bg-altipiqui-gold-light rounded-xl p-2 text-center">
                <strong className="text-amber-800">cocina</strong>
                <span className="text-gray-500"> / cocina123</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          © 2026 ALTIPIQUI — Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}

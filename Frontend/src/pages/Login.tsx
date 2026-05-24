import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { login } from '../services/auth.service'
import type { User, LoginResponse } from '../types'

interface LoginProps {
  onLogin: (token: string, user: User) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data: LoginResponse) => {
      onLogin(data.token, data.user)
    },
    onError: () => {
      setError('Credenciales inválidas')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Restaurante</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="admin@restaurante.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {mutation.isPending ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          <p>Admin: admin@restaurante.com / admin123</p>
          <p>Cajero: cajero@restaurante.com / cajero123</p>
          <p>Mesero: mesero@restaurante.com / mesero123</p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { User } from '../types'

const roleMenus: Record<string, Array<{ to: string; label: string; icon: string }>> = {
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/admin/caja', label: 'Caja', icon: '💰' },
    { to: '/admin/platos', label: 'Platos', icon: '🍽️' },
    { to: '/admin/consumibles', label: 'Inventario', icon: '📦' },
    { to: '/admin/perdidos', label: 'Perdidos', icon: '🗑️' },
    { to: '/admin/menu', label: 'Menú', icon: '📋' },
    { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
    { to: '/admin/reportes', label: 'Reportes', icon: '📈' },
  ],
  CAJERO: [
    { to: '/cajero', label: 'Dashboard', icon: '📊' },
  ],
  MESERO: [
    { to: '/mesero/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/mesero/nuevo-pedido', label: 'Nuevo Pedido', icon: '➕' },
    { to: '/mesero/consumibles', label: 'Consumibles', icon: '🥤' },
  ],
  COCINA: [
    { to: '/cocina', label: 'Cocina', icon: '👨‍🍳' },
  ],
}

interface LayoutProps {
  user: User
  onLogout: () => void
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const menuItems = roleMenus[user.role] || []

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">Restaurant</h1>
          <p className="text-sm text-gray-400 mt-1">{user.name}</p>
          <span className="inline-block px-2 py-0.5 text-xs rounded bg-blue-600 mt-1">{user.role}</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 w-full transition-colors"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-lg">Restaurant</h1>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

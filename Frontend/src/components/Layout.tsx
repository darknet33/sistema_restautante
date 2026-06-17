import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, UtensilsCrossed, Package, Trash2,
  NotebookText, Users, ChartColumn, CirclePlus, Wine, ChefHat,
  Sun, Moon, LogOut, Menu,
} from 'lucide-react'
import type { User } from '../types'

interface NavItem {
  to: string
  label: string
  icon: string
}

const roleMenus: Record<string, NavItem[]> = {
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/admin/caja', label: 'Caja', icon: 'Wallet' },
    { to: '/admin/platos', label: 'Platos', icon: 'UtensilsCrossed' },
    { to: '/admin/consumibles', label: 'Inventario', icon: 'Package' },
    { to: '/admin/perdidos', label: 'Perdidos', icon: 'Trash2' },
    { to: '/admin/menu', label: 'Menú', icon: 'NotebookText' },
    { to: '/admin/usuarios', label: 'Usuarios', icon: 'Users' },
    { to: '/admin/reportes', label: 'Reportes', icon: 'ChartColumn' },
    { to: '/admin/nuevo-pedido', label: 'Nuevo Pedido', icon: 'CirclePlus' },
  ],
  CAJERO: [
    { to: '/cajero', label: 'Dashboard', icon: 'LayoutDashboard' },
  ],
  MESERO: [
    { to: '/mesero/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { to: '/mesero/nuevo-pedido', label: 'Nuevo Pedido', icon: 'CirclePlus' },
    { to: '/mesero/consumibles', label: 'Consumibles', icon: 'Wine' },
  ],
  COCINA: [
    { to: '/cocina', label: 'Cocina', icon: 'ChefHat' },
  ],
}

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Wallet, UtensilsCrossed, Package, Trash2,
  NotebookText, Users, ChartColumn, CirclePlus, Wine, ChefHat,
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Component = iconComponents[name]
  if (!Component) return null
  return <Component className={className || 'w-5 h-5'} />
}

interface LayoutProps {
  user: User
  onLogout: () => void
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const navigate = useNavigate()
  const location = useLocation()
  const menuItems = roleMenus[user.role] || []

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const roleColor = {
    ADMIN: 'bg-altipiqui-red text-white',
    CAJERO: 'bg-altipiqui-indigo text-white',
    MESERO: 'bg-altipiqui-green text-white',
    COCINA: 'bg-altipiqui-gold text-white',
  }[user.role]

  return (
    <div className="min-h-screen bg-altipiqui-cream dark:bg-dark-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-16 md:w-16 lg:w-64 bg-sidebar-bg text-white flex flex-col
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo & Brand */}
        <div className="p-3 lg:p-5 border-b border-white/10">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/logo.png" alt="ALTIPIQUI" className="w-8 h-8 object-contain" />
            </div>
            <div className="min-w-0 hidden lg:block">
              <h1 className="text-lg font-heading font-bold text-white leading-tight">ALTIPIQUI</h1>
              <p className="text-xs text-sidebar-text truncate">Restaurante para todos</p>
            </div>
          </div>
        </div>

        {/* User info - hidden on tablet */}
        <div className="px-3 lg:px-5 py-3 border-b border-white/5 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-altipiqui-red/20 flex items-center justify-center text-altipiqui-red-light font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full font-medium ${roleColor} mt-0.5`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm transition-all duration-200 tooltip-wrapper ${
                  isActive
                    ? 'bg-altipiqui-red text-white shadow-lg shadow-altipiqui-red/20 font-medium'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                }`
              }
              title={item.label}
            >
              <Icon name={item.icon} className={`w-5 h-5 flex-shrink-0 ${location.pathname === item.to ? 'text-altipiqui-gold' : ''}`} />
              <span className="hidden lg:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 lg:p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-white w-full transition-all duration-200"
            title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {darkMode ? <Sun className="w-5 h-5 text-altipiqui-gold flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
            <span className="hidden lg:inline">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm text-sidebar-text hover:bg-red-500/20 hover:text-red-400 w-full transition-all duration-200"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-white dark:bg-dark-surface border-b border-border dark:border-dark-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-altipiqui-cream dark:hover:bg-dark-border rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-gray-700 dark:text-dark-text" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-7 h-7 object-contain" />
            <h1 className="font-heading font-bold text-lg text-altipiqui-red">ALTIPIQUI</h1>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="ml-auto p-1.5 hover:bg-altipiqui-cream dark:hover:bg-dark-border rounded-lg transition-colors">
            {darkMode ? <Sun className="w-5 h-5 text-altipiqui-gold" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </header>

        {/* Bottom nav for mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white dark:bg-dark-surface border-t border-border dark:border-dark-border flex items-center justify-around px-2 pb-3 pt-1.5">
          {menuItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-altipiqui-red' : 'text-gray-400 dark:text-dark-text-muted'
                }`}
              >
                <Icon name={item.icon} className={`w-5 h-5 ${isActive ? 'text-altipiqui-red' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-5 lg:p-6 pb-20 md:pb-6 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

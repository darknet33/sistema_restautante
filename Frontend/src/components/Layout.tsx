import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import type { User } from '../types'

interface NavItem {
  to: string
  label: string
  icon: string
}

const roleMenus: Record<string, NavItem[]> = {
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { to: '/admin/caja', label: 'Caja', icon: 'wallet' },
    { to: '/admin/platos', label: 'Platos', icon: 'utensils-crossed' },
    { to: '/admin/consumibles', label: 'Inventario', icon: 'package' },
    { to: '/admin/perdidos', label: 'Perdidos', icon: 'trash-2' },
    { to: '/admin/menu', label: 'Menú', icon: 'notebook-text' },
    { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
    { to: '/admin/reportes', label: 'Reportes', icon: 'chart-no-axes-combined' },
  ],
  CAJERO: [
    { to: '/cajero', label: 'Dashboard', icon: 'layout-dashboard' },
  ],
  MESERO: [
    { to: '/mesero/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { to: '/mesero/nuevo-pedido', label: 'Nuevo Pedido', icon: 'circle-plus' },
    { to: '/mesero/consumibles', label: 'Consumibles', icon: 'bottle' },
  ],
  COCINA: [
    { to: '/cocina', label: 'Cocina', icon: 'chef-hat' },
  ],
}

const iconPaths: Record<string, string> = {
  'layout-dashboard': 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  'wallet': 'M21 12V7H5a2 2 0 010-4h14v4M3 12h18l-3 9H6l-3-9z',
  'utensils-crossed': 'M6 2v6a4 4 0 004 4M6 2v14M18 2v20M18 2v6a4 4 0 01-4 4',
  'package': 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  'trash-2': 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  'notebook-text': 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M8 12h8M8 16h6M10 4V2M14 4V2',
  'users': 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z',
  'chart-no-axes-combined': 'M3 3v18h18M13 17V9M18 17V5M8 17v-4',
  'circle-plus': 'M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
  'bottle': 'M6 2h12v4a4 4 0 01-4 4h-4a4 4 0 01-4-4V2zM6 10v10a2 2 0 002 2h8a2 2 0 002-2V10',
  'chef-hat': 'M6 13.87A4 4 0 017.5 6a5.5 5.5 0 019 0A4 4 0 0118 13.87V21H6z',
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[name] || iconPaths['layout-dashboard']} />
    </svg>
  )
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
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-sidebar-bg text-white flex flex-col
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Brand */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/logo.png" alt="ALTIPIQUI" className="w-8 h-8 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-heading font-bold text-white leading-tight">ALTIPIQUI</h1>
              <p className="text-xs text-sidebar-text truncate">Restaurante para todos</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-3 border-b border-white/5">
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
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-altipiqui-red text-white shadow-lg shadow-altipiqui-red/20 font-medium'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                }`
              }
            >
              <Icon name={item.icon} className={`w-5 h-5 flex-shrink-0 ${location.pathname === item.to ? 'text-altipiqui-gold' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-white w-full transition-all duration-200"
          >
            {darkMode ? (
              <svg className="w-5 h-5 text-altipiqui-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
            <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-text hover:bg-red-500/20 hover:text-red-400 w-full transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-6.75-3h12m0 0l-3-3m3 3l-3 3" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white dark:bg-dark-surface border-b border-border dark:border-dark-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-altipiqui-cream dark:hover:bg-dark-border rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-700 dark:text-dark-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-7 h-7 object-contain" />
            <h1 className="font-heading font-bold text-lg text-altipiqui-red">ALTIPIQUI</h1>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="ml-auto p-1.5 hover:bg-altipiqui-cream dark:hover:bg-dark-border rounded-lg transition-colors">
            {darkMode ? (
              <svg className="w-5 h-5 text-altipiqui-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </header>

        {/* Bottom nav for mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white dark:bg-dark-surface border-t border-border dark:border-dark-border flex items-center justify-around px-2 pb-3 pt-1.5">
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
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "./hooks/useAuth"
import Layout from "./components/Layout"

import Login from "./pages/Login"

import AdminDashboard from "./pages/admin/Dashboard"
import AdminCaja from "./pages/admin/Caja"
import AdminPlatos from "./pages/admin/Platos"
import AdminConsumibles from "./pages/admin/Consumibles"
import AdminPerdidos from "./pages/admin/Perdidos"
import AdminMenu from "./pages/admin/Menu"
import AdminUsuarios from "./pages/admin/Usuarios"
import AdminReportes from "./pages/admin/Reportes"

import CajeroDashboard from "./pages/cajero/Dashboard"

import WaiterDashboard from "./pages/waiter/Dashboard"
import WaiterNewOrder from "./pages/waiter/NewOrder"
import WaiterConsumibles from "./pages/waiter/Consumibles"

import KitchenDashboard from "./pages/kitchen/Dashboard"

const queryClient = new QueryClient()

function App() {
  const { token, user, login, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout user={user!} onLogout={logout} />}>
            {/* Admin routes */}
            {user?.role === "ADMIN" && (
              <>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/caja" element={<AdminCaja />} />
                <Route path="/admin/platos" element={<AdminPlatos />} />
                <Route path="/admin/consumibles" element={<AdminConsumibles />} />
                <Route path="/admin/perdidos" element={<AdminPerdidos />} />
                <Route path="/admin/menu" element={<AdminMenu />} />
                <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                <Route path="/admin/reportes" element={<AdminReportes />} />
              </>
            )}

            {/* Cajero routes */}
            {user?.role === "CAJERO" && (
              <Route path="/cajero" element={<CajeroDashboard />} />
            )}

            {/* Mesero routes */}
            {user?.role === "MESERO" && (
              <>
                <Route path="/mesero/dashboard" element={<WaiterDashboard />} />
                <Route path="/mesero/nuevo-pedido" element={<WaiterNewOrder />} />
                <Route path="/mesero/consumibles" element={<WaiterConsumibles />} />
              </>
            )}

            {/* Cocina routes */}
            {user?.role === "COCINA" && (
              <Route path="/cocina" element={<KitchenDashboard />} />
            )}

            {/* Default redirect based on role */}
            <Route path="/" element={
              user?.role === "ADMIN" ? <Navigate to="/admin/dashboard" replace /> :
              user?.role === "CAJERO" ? <Navigate to="/cajero" replace /> :
              user?.role === "MESERO" ? <Navigate to="/mesero/dashboard" replace /> :
              user?.role === "COCINA" ? <Navigate to="/cocina" replace /> :
              <Navigate to="/login" replace />
            } />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import Login from "./pages/Login"
import CajaDashboard from "./pages/CajaDashboard"
import KitchenView from "./pages/KitchenView"
import WaiterView from "./pages/WaiterView"
import AdminDashboard from "./pages/AdminDashboard"
import { socketService } from "./socket"

const queryClient = new QueryClient()

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"))

  useEffect(() => {
    if (token) {
      socketService.connect(token)
      return () => socketService.disconnect()
    }
  }, [token])

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem("token", newToken)
    localStorage.setItem("user", JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    socketService.disconnect()
    setToken(null)
    setUser(null)
  }

  if (!token) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
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
          <Route path="/login" element={<Navigate to="/" replace />} />
          {(user?.role === "ADMIN" || user?.role === "CAJERO") && (
            <Route path="/caja" element={<CajaDashboard user={user} onLogout={handleLogout} />} />
          )}
          {user?.role === "COCINA" && (
            <Route path="/cocina" element={<KitchenView user={user} onLogout={handleLogout} />} />
          )}
          {user?.role === "MESERO" && (
            <Route path="/mesero" element={<WaiterView user={user} onLogout={handleLogout} />} />
          )}
          {user?.role === "ADMIN" && (
            <Route path="/admin" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
          )}
          <Route path="/" element={
            user?.role === "ADMIN" || user?.role === "CAJERO" ? <Navigate to="/caja" replace /> :
            user?.role === "COCINA" ? <Navigate to="/cocina" replace /> :
            user?.role === "MESERO" ? <Navigate to="/mesero" replace /> :
            <Navigate to="/login" replace />
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

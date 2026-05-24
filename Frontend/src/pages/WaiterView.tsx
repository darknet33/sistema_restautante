import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOrders } from '../services/order.service'
import { getTables } from '../services/table.service'
import type { Order, User } from '../types'
import { useEffect } from 'react'
import { socketService } from '../socket'
import { useNavigate } from 'react-router-dom'

interface WaiterViewProps {
  user: User
  onLogout: () => void
}

export default function WaiterView({ user, onLogout }: WaiterViewProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: orders = [] } = useQuery({
    queryKey: ['waiterOrders'],
    queryFn: () => getOrders()
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables
  })

  useEffect(() => {
    socketService.joinRoom('waiter')
    const unsub1 = socketService.onOrderCreated(() => {
      queryClient.invalidateQueries({ queryKey: ['waiterOrders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    })
    const unsub2 = socketService.onOrderStatusChanged(() => {
      queryClient.invalidateQueries({ queryKey: ['waiterOrders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    })
    return () => {
      unsub1?.()
      unsub2?.()
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const colors: any = {
      'PENDIENTE': 'bg-gray-500',
      'EN_COCINA': 'bg-yellow-500',
      'LISTO': 'bg-green-500',
      'SERVIDO': 'bg-blue-500',
      'PAGADO': 'bg-gray-400'
    }
    return <span className={`px-2 py-1 text-white text-xs rounded ${colors[status] || 'bg-gray-300'}`}>{status}</span>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mesero - {user.name}</h1>
        <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Salir
        </button>
      </header>

      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Mis Mesas</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {tables.map((table: any) => (
            <div key={table.id} className={`p-4 rounded-lg text-white font-bold text-center ${
              table.status === 'LIBRE' ? 'bg-green-500' :
              table.status === 'OCUPADA' ? 'bg-red-500' :
              table.status === 'RESERVADA' ? 'bg-yellow-500' : 'bg-gray-500'
            }`}>
              <div className="text-lg">Mesa {table.number}</div>
              <div className="text-sm">{table.status}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-4">Pedidos Activos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.filter((o: Order) => o.status !== 'PAGADO').map((order: Order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between mb-2">
                {getStatusBadge(order.status)}
                <span className="font-bold">Mesa {order.table?.number}</span>
              </div>
              <div className="text-sm">
                {order.items?.map((item, idx) => (
                  <div key={idx}>{item.quantity}x {item.product?.name}</div>
                ))}
              </div>
              <div className="mt-2 font-bold">Total: ${order.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

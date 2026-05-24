import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../services/order.service'
import { getTables } from '../services/table.service'
import type { Order, User } from '../types'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { socketService } from '../socket'

interface KitchenViewProps {
  user: User
  onLogout: () => void
}

export default function KitchenView({ user, onLogout }: KitchenViewProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: orders = [] } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: () => getOrders('EN_COCINA')
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })

  useEffect(() => {
    socketService.joinRoom('kitchen')
    const unsub1 = socketService.onOrderCreated(() => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] })
    })
    const unsub2 = socketService.onOrderStatusChanged(() => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] })
    })
    return () => {
      unsub1?.()
      unsub2?.()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cocina</h1>
        <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Salir
        </button>
      </header>

      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Pedidos en Cocina</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order: Order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
              <div className="flex justify-between mb-2">
                <span className="font-bold">Pedido #{order.id}</span>
                <span className="text-sm text-gray-600">Mesa {order.table?.number}</span>
              </div>
              <div className="mb-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-1 border-b">
                    <div className="font-medium">{item.quantity}x {item.product?.name}</div>
                    {item.notes && <div className="text-sm text-gray-600">Nota: {item.notes}</div>}
                  </div>
                ))}
              </div>
              <button
                onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'LISTO' })}
                disabled={updateStatusMutation.isPending}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                Marcar Listo
              </button>
            </div>
          ))}
        </div>
        {orders.length === 0 && <p className="text-gray-500 text-center mt-8">No hay pedidos pendientes</p>}
      </div>
    </div>
  )
}

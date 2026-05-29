import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders } from '../../services/order.service'
import { getSupplies } from '../../services/supply.service'
import { useState } from 'react'
import { useOrderStatusChanged, useSocket } from '../../hooks/useSocket'
import { formatDateTime } from '../../utils/format'

export default function WaiterConsumibles() {
  const [filterStatus, setFilterStatus] = useState('all')
  const queryClient = useQueryClient()

  useSocket('waiter')
  useOrderStatusChanged(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders(), refetchInterval: 5000 })
  const { data: supplies = [] } = useQuery({ queryKey: ['supplies'], queryFn: () => getSupplies() })

  const activeOrders = orders.filter(o => !['PAGADO', 'SERVIDO'].includes(o.status))
  const filteredOrders = filterStatus === 'all'
    ? activeOrders
    : activeOrders.filter(o => o.status === filterStatus)

  const supplyMap = new Map(supplies.map(s => [s.id, s]))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Consumibles por Pedido</h2>

      <div className="flex gap-2">
        {['all', 'PENDIENTE', 'EN_COCINA', 'LISTO'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded-lg text-sm ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {status === 'all' ? 'Todos' : status}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredOrders.map(order => {
          const supplyItems = order.items?.filter(i => i.type === 'supply') || []
          if (supplyItems.length === 0) return null

          return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold">Mesa {order.table?.number}</span>
                  <span className="text-xs text-gray-500 ml-2">#{order.id}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  order.status === 'PENDIENTE' ? 'bg-gray-100' :
                  order.status === 'EN_COCINA' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>{order.status}</span>
              </div>
              <div className="border-t pt-2 space-y-1">
                {supplyItems.map(item => {
                  const supply = supplyMap.get(item.supplyId!)
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="font-medium">x{item.quantity}</span>
                      <span>{supply?.name || 'Producto'}</span>
                      {supply && (
                        <span className={`text-xs ml-auto ${Number(supply.stockCurrent) <= Number(supply.stockMin) ? 'text-red-500' : 'text-gray-400'}`}>
                          stock: {supply.stockCurrent}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Pedido: {formatDateTime(order.createdAt)}
              </p>
            </div>
          )
        })}

        {filteredOrders.length === 0 && (
          <p className="text-center text-gray-400 py-8">No hay pedidos activos con consumibles</p>
        )}
      </div>
    </div>
  )
}

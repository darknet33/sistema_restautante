import { useQuery, useQueryClient } from '@tanstack/react-query'
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

  const statusStyles: Record<string, string> = {
    PENDIENTE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    EN_COCINA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    LISTO: 'bg-altipiqui-green-light text-altipiqui-green dark:bg-green-900/30 dark:text-green-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold dark:text-dark-text">Consumibles por Pedido</h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Visualiza los consumibles de cada pedido activo</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'PENDIENTE', 'EN_COCINA', 'LISTO'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              filterStatus === status
                ? 'bg-altipiqui-red text-white shadow-lg shadow-altipiqui-red/20'
                : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-border border border-border/50 dark:border-dark-border/50'
            }`}
          >
            {status === 'all' ? 'Todos' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredOrders.map(order => {
          const supplyItems = order.items?.filter(i => i.type === 'supply') || []
          if (supplyItems.length === 0) return null

          return (
            <div key={order.id} className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 p-5 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-altipiqui-red/10 dark:bg-altipiqui-red/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-altipiqui-red">{order.table?.number}</span>
                  </div>
                  <div>
                    <span className="font-bold text-sm dark:text-dark-text">Mesa {order.table?.number}</span>
                    <span className="text-xs text-gray-400 dark:text-dark-text-muted ml-2 font-mono">#{order.id}</span>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusStyles[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
              </div>
              <div className="border-t border-border/50 dark:border-dark-border/50 pt-3 space-y-1.5">
                {supplyItems.map(item => {
                  const supply = supplyMap.get(item.supplyId!)
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-500 dark:text-dark-text-muted text-xs">x{item.quantity}</span>
                      <span className="dark:text-dark-text">{supply?.name || 'Producto'}</span>
                      {supply && (
                        <span className={`text-xs ml-auto ${Number(supply.stockCurrent) <= Number(supply.stockMin) ? 'text-altipiqui-red font-medium' : 'text-gray-400 dark:text-dark-text-muted'}`}>
                          stock: {supply.stockCurrent}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-dark-text-muted mt-3">
                Pedido: {formatDateTime(order.createdAt)}
              </p>
            </div>
          )
        })}

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-dark-text-muted">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No hay pedidos activos con consumibles</p>
          </div>
        )}
      </div>
    </div>
  )
}

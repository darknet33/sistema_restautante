import type { Order } from '../types'
import OrderCard from './OrderCard'

interface KanbanBoardProps {
  columns: Array<{ status: string; label: string; color: string; bg: string }>
  orders: Order[]
  onStatusChange?: (orderId: number, newStatus: string) => void
  allowedTransitions?: Record<string, string[]>
}

const statusColors: Record<string, string> = {
  PENDIENTE: 'border-l-gray-400',
  EN_COCINA: 'border-l-blue-500',
  LISTO: 'border-l-green-500',
  SERVIDO: 'border-l-orange-500',
}

export default function KanbanBoard({ columns, orders, onStatusChange, allowedTransitions }: KanbanBoardProps) {
  const getOrdersByStatus = (status: string) =>
    orders.filter(o => o.status === status)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map(col => (
        <div key={col.status} className={`rounded-xl ${col.bg} p-3 min-h-[300px]`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-semibold text-sm">{col.label}</h3>
            <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full font-medium">
              {getOrdersByStatus(col.status).length}
            </span>
          </div>
          <div className="space-y-3">
            {getOrdersByStatus(col.status).map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={onStatusChange}
                allowedTransitions={allowedTransitions?.[col.status]}
              />
            ))}
            {getOrdersByStatus(col.status).length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Sin pedidos</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

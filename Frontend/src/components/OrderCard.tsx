import { formatCurrency, formatTime } from '../utils/format'
import type { Order } from '../types'

interface OrderCardProps {
  order: Order
  onStatusChange?: (orderId: number, newStatus: string) => void
  allowedTransitions?: string[]
  showDetails?: boolean
}

const statusBorders: Record<string, string> = {
  PENDIENTE: 'border-l-gray-400',
  EN_COCINA: 'border-l-blue-500',
  LISTO: 'border-l-green-500',
  SERVIDO: 'border-l-orange-500',
}

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_COCINA: 'En Cocina',
  LISTO: 'Listo',
  SERVIDO: 'Servido',
  PAGADO: 'Pagado',
}

export default function OrderCard({ order, onStatusChange, allowedTransitions, showDetails = true }: OrderCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${statusBorders[order.status] || 'border-l-gray-300'} p-3`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-bold text-sm">Mesa {order.table?.number || order.tableId}</span>
          <span className="text-xs text-gray-500 ml-2">#{order.id}</span>
        </div>
        <span className="text-xs text-gray-400">
          {formatTime(order.createdAt)}
        </span>
      </div>

      <div className="space-y-1 mb-2">
        {order.items?.slice(0, 4).map(item => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            {item.dish?.imageUrl && (
              <img src={item.dish.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
            )}
            <span className="font-medium">x{item.quantity}</span>
            <span className="text-gray-700 truncate flex-1">{item.dish?.name || item.supply?.name}</span>
          </div>
        ))}
        {(order.items?.length || 0) > 4 && (
          <p className="text-xs text-gray-400">+{order.items!.length - 4} más</p>
        )}
      </div>

      {order.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded p-1.5 mb-2">📝 {order.notes}</p>
      )}

      {showDetails && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {order.user?.name}
          </span>
          <span className="text-xs font-semibold">{formatCurrency(order.total)}</span>
        </div>
      )}

      {allowedTransitions?.map(status => (
        <button
          key={status}
          onClick={() => onStatusChange?.(order.id, status)}
          className="mt-2 w-full text-xs py-1.5 rounded-lg font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
        >
          Mover a {statusLabels[status] || status}
        </button>
      ))}
    </div>
  )
}

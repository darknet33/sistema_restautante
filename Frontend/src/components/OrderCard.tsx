import { formatCurrency, formatTime } from '../utils/format'
import type { Order } from '../types'

interface OrderCardProps {
  order: Order
  onStatusChange?: (orderId: number, newStatus: string) => void
  allowedTransitions?: string[]
  showDetails?: boolean
  filterType?: 'dish' | 'supply'
}

const statusBorders: Record<string, string> = {
  PENDIENTE: 'border-l-gray-400',
  EN_COCINA: 'border-l-blue-500',
  LISTO: 'border-l-green-500',
  SERVIDO: 'border-l-orange-500',
}

const statusAccents: Record<string, string> = {
  PENDIENTE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  EN_COCINA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  LISTO: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  SERVIDO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  PAGADO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
}

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_COCINA: 'En Cocina',
  LISTO: 'Listo',
  SERVIDO: 'Servido',
  PAGADO: 'Pagado',
}

const transitionButtonColors: Record<string, string> = {
  EN_COCINA: 'bg-blue-500 hover:bg-blue-600',
  LISTO: 'bg-green-500 hover:bg-green-600',
  SERVIDO: 'bg-orange-500 hover:bg-orange-600',
  PAGADO: 'bg-purple-500 hover:bg-purple-600',
}

export default function OrderCard({ order, onStatusChange, allowedTransitions, showDetails = true, filterType }: OrderCardProps) {
  const filteredItems = filterType
    ? (order.items || []).filter(i => i.type === filterType)
    : (order.items || [])
  return (
    <div className={`bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-border/50 dark:border-dark-border/50 border-l-4 ${statusBorders[order.status] || 'border-l-gray-300'} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-altipiqui-red/10 dark:bg-altipiqui-red/20 text-altipiqui-red font-bold text-sm">
            {order.table?.number || order.tableId}
          </span>
          <div>
            <p className="font-bold text-sm dark:text-dark-text">Mesa {order.table?.number || order.tableId}</p>
            <span className="text-[10px] text-gray-400 dark:text-dark-text-muted font-mono">#{order.id}</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-dark-text-muted whitespace-nowrap">
          {formatTime(order.createdAt)}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {filteredItems.slice(0, 4).map(item => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            {item.dish?.imageUrl && (
              <img src={item.dish.imageUrl} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            )}
            {item.type === 'supply' && !item.served && (
              <span className="w-3.5 h-3.5 rounded-full border border-amber-400 flex items-center justify-center flex-shrink-0" title="No atendido">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </span>
            )}
            {item.type === 'supply' && item.served && (
              <span className="w-3.5 h-3.5 rounded-full bg-altipiqui-green flex items-center justify-center flex-shrink-0" title="Atendido">
                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            )}
            <span className="font-semibold text-gray-500 dark:text-dark-text-muted text-xs">x{item.quantity}</span>
            <span className={`text-gray-700 dark:text-dark-text truncate flex-1 text-xs ${item.served && item.type === 'supply' ? 'line-through opacity-60' : ''}`}>{item.dish?.name || item.supply?.name}</span>
          </div>
        ))}
        {filteredItems.length > 4 && (
          <p className="text-[11px] text-gray-400 dark:text-dark-text-muted font-medium">+{filteredItems.length - 4} más</p>
        )}
      </div>

      {order.notes && (
        <div className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-dark-text-muted bg-altipiqui-cream dark:bg-dark-bg rounded-xl p-2.5 mb-3">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <span>{order.notes}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/50 dark:border-dark-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-altipiqui-indigo/10 dark:bg-altipiqui-indigo/20 flex items-center justify-center">
            <span className="text-[8px] font-bold text-altipiqui-indigo dark:text-altipiqui-indigo-light">
              {order.user?.name?.charAt(0) || '?'}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 dark:text-dark-text-muted">{order.user?.name}</span>
        </div>
        {!filterType && (
          <span className="text-sm font-bold text-altipiqui-red">{formatCurrency(order.total)}</span>
        )}
      </div>

      {allowedTransitions?.map(status => (
        <button
          key={status}
          onClick={() => onStatusChange?.(order.id, status)}
          className={`mt-3 w-full text-xs py-2 rounded-xl font-medium transition-all duration-200 text-white ${transitionButtonColors[status] || 'bg-gray-500 hover:bg-gray-600'} active:scale-[0.98]`}
        >
          {status === 'EN_COCINA' && 'Tomar Pedido'}
          {status === 'LISTO' && 'Marcar Listo'}
          {status === 'SERVIDO' && 'Entregar a Mesa'}
          {status === 'PAGADO' && 'Marcar Pagado'}
          {!['EN_COCINA', 'LISTO', 'SERVIDO', 'PAGADO'].includes(status) && `Mover a ${statusLabels[status] || status}`}
        </button>
      ))}
    </div>
  )
}

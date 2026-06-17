import { Check, MessageSquare, UtensilsCrossed, ShoppingBag, Truck } from 'lucide-react'
import { formatCurrency, formatTime } from '../utils/format'
import type { Order, OrderType } from '../types'

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

const orderTypeBadge: Record<OrderType, { label: string; bg: string }> = {
  PARA_AQUI: { label: 'Aquí', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  PARA_LLEVAR: { label: 'Llevar', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  DELIVERY: { label: 'Delivery', bg: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
}
export default function OrderCard({ order, onStatusChange, allowedTransitions, showDetails = true, filterType }: OrderCardProps) {
  const filteredItems = filterType
    ? (order.items || []).filter(i => i.type === filterType)
    : (order.items || [])

  const orderType = order.orderType || 'PARA_AQUI'
  const badge = orderTypeBadge[orderType]
  const hasTable = order.table?.number || order.tableId

  return (
    <div className={`bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-border/50 dark:border-dark-border/50 border-l-4 ${statusBorders[order.status] || 'border-l-gray-300'} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${badge.bg}`}>
            {hasTable ? order.table?.number || order.tableId : (
              orderType === 'PARA_AQUI' ? <UtensilsCrossed className="w-4 h-4" /> :
              orderType === 'PARA_LLEVAR' ? <ShoppingBag className="w-4 h-4" /> :
              <Truck className="w-4 h-4" />
            )}
          </span>
          <div>
            <p className="font-bold text-sm dark:text-dark-text">
              {hasTable ? `Mesa ${order.table?.number || order.tableId}` : badge.label}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.bg}`}>
                {badge.label}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-dark-text-muted font-mono">#{order.id}</span>
            </div>
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
                <Check className="w-2 h-2 text-white" />
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
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
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

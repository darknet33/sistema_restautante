import type { Order } from '../types'
import OrderCard from './OrderCard'

interface KanbanBoardProps {
  columns: Array<{ status: string; label: string; color: string; bg: string }>
  orders: Order[]
  onStatusChange?: (orderId: number, newStatus: string) => void
  allowedTransitions?: Record<string, string[]>
  filterType?: 'dish' | 'supply'
}

const statusGradients: Record<string, string> = {
  PENDIENTE: 'from-gray-400 to-gray-300',
  EN_COCINA: 'from-blue-500 to-blue-400',
  LISTO: 'from-green-500 to-green-400',
  SERVIDO: 'from-orange-500 to-orange-400',
}

export default function KanbanBoard({ columns, orders, onStatusChange, allowedTransitions, filterType }: KanbanBoardProps) {
  const getOrdersByStatus = (status: string) =>
    orders.filter(o => o.status === status)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const getCountBg = (bg: string) => {
    if (bg.includes('gray')) return 'bg-white/70 dark:bg-dark-surface/70 text-gray-700 dark:text-dark-text'
    if (bg.includes('blue')) return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
    if (bg.includes('green')) return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
    if (bg.includes('orange')) return 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
    return 'bg-white/70 text-gray-700'
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map(col => (
        <div key={col.status} className={`rounded-2xl ${col.bg} dark:bg-dark-surface/50 p-4 min-h-[300px] border border-border/50 dark:border-dark-border/50`}>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${statusGradients[col.status] || 'from-gray-400 to-gray-300'}`} />
              <h3 className="font-heading font-semibold text-sm dark:text-dark-text">{col.label}</h3>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getCountBg(col.bg)}`}>
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
                filterType={filterType}
              />
            ))}
            {getOrdersByStatus(col.status).length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-dark-text-muted">
                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Sin pedidos</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

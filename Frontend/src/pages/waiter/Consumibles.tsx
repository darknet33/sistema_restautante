import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, serveOrderItem } from '../../services/order.service'
import { getSupplies } from '../../services/supply.service'
import { useState } from 'react'
import { useSocket } from '../../hooks/useSocket'
import { formatDateTime } from '../../utils/format'

export default function WaiterConsumibles() {
  const [filterServed, setFilterServed] = useState<'all' | 'pending' | 'served'>('pending')
  const queryClient = useQueryClient()

  useSocket('waiter')

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders(), refetchInterval: 5000 })
  const { data: supplies = [] } = useQuery({ queryKey: ['supplies'], queryFn: () => getSupplies() })

  const activeOrders = orders.filter(o => o.status !== 'PAGADO')

  const supplyMap = new Map(supplies.map(s => [s.id, s]))

  const serveMutation = useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: number; itemId: number }) => serveOrderItem(orderId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })

  const tablesWithSupplies = activeOrders.reduce<Map<number, { tableNumber: number; items: Array<{ item: typeof activeOrders[0]['items'][0]; orderId: number; createdAt: string }> }>>((acc, order) => {
    const supplyItems = order.items?.filter(i => i.type === 'supply') || []
    if (supplyItems.length === 0) return acc

    const tableNum = order.table?.number || order.tableId
    if (!acc.has(tableNum)) {
      acc.set(tableNum, { tableNumber: tableNum, items: [] })
    }
    for (const item of supplyItems) {
      acc.get(tableNum)!.items.push({ item, orderId: order.id, createdAt: order.createdAt })
    }
    return acc
  }, new Map())

  const sortedTables = [...tablesWithSupplies.values()].sort((a, b) => a.tableNumber - b.tableNumber)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold dark:text-dark-text">Consumibles / Extras</h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Atiende los consumibles por mesa</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'pending', label: 'Pendientes' },
          { key: 'served', label: 'Atendidos' },
          { key: 'all', label: 'Todos' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterServed(f.key as typeof filterServed)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              filterServed === f.key
                ? 'bg-altipiqui-red text-white shadow-lg shadow-altipiqui-red/20'
                : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-border border border-border/50 dark:border-dark-border/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sortedTables.map(({ tableNumber, items }) => {
          let filtered = filterServed === 'pending' ? items.filter(i => !i.item.served)
            : filterServed === 'served' ? items.filter(i => i.item.served)
            : items

          if (filtered.length === 0) return null

          return (
            <div key={tableNumber} className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 p-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-altipiqui-red/10 dark:bg-altipiqui-red/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-altipiqui-red">{tableNumber}</span>
                </div>
                <span className="font-bold text-sm dark:text-dark-text">Mesa {tableNumber}</span>
              </div>
              <div className="border-t border-border/50 dark:border-dark-border/50 pt-3 space-y-1.5">
                {filtered.map(({ item, orderId, createdAt }) => {
                  const supply = supplyMap.get(item.supplyId!)
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => !item.served && serveMutation.mutate({ orderId, itemId: item.id })}
                        disabled={item.served}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                          item.served
                            ? 'bg-altipiqui-green text-white'
                            : 'bg-gray-100 dark:bg-dark-border border border-border dark:border-dark-border hover:bg-altipiqui-green-light hover:border-altipiqui-green'
                        }`}
                      >
                        {item.served && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                      <span className={`font-medium text-xs flex-shrink-0 ${item.served ? 'text-altipiqui-green line-through' : 'text-gray-500 dark:text-dark-text-muted'}`}>x{item.quantity}</span>
                      <span className={`dark:text-dark-text ${item.served ? 'line-through opacity-60' : ''}`}>{supply?.name || 'Producto'}</span>
                      <span className="text-[10px] text-gray-400 dark:text-dark-text-muted ml-auto">
                        {formatDateTime(createdAt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {sortedTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-dark-text-muted">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">{filterServed === 'pending' ? 'No hay consumibles pendientes' : filterServed === 'served' ? 'No hay consumibles atendidos' : 'No hay consumibles'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

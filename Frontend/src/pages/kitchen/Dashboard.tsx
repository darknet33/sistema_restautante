import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../services/order.service'
import { useOrderCreated, useOrderStatusChanged, useSocket } from '../../hooks/useSocket'
import KanbanBoard from '../../components/KanbanBoard'

const kitchenColumns = [
  { status: 'PENDIENTE', label: 'Pendientes', color: 'gray', bg: 'bg-gray-100' },
  { status: 'EN_COCINA', label: 'En Cocina', color: 'blue', bg: 'bg-blue-50' },
  { status: 'LISTO', label: 'Listos', color: 'green', bg: 'bg-green-50' },
]

const kitchenTransitions: Record<string, string[]> = {
  PENDIENTE: ['EN_COCINA'],
  EN_COCINA: ['LISTO'],
}

export default function KitchenDashboard() {
  const queryClient = useQueryClient()

  useSocket('kitchen')
  useOrderCreated(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  useOrderStatusChanged(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    refetchInterval: 3000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })

  const kitchenOrders = orders.filter(o =>
    ['PENDIENTE', 'EN_COCINA', 'LISTO'].includes(o.status) &&
    o.items?.some(i => i.type === 'dish')
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-altipiqui-red/10 dark:bg-altipiqui-red/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-altipiqui-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Cocina — Tiempo Real</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Gestiona los pedidos entrantes</p>
        </div>
      </div>

      <KanbanBoard
        columns={kitchenColumns}
        orders={kitchenOrders}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        allowedTransitions={kitchenTransitions}
        filterType="dish"
      />

      <div className="flex items-start gap-3 bg-altipiqui-gold-light dark:bg-yellow-900/20 rounded-2xl p-4 border border-altipiqui-gold/20 dark:border-yellow-700/30">
        <svg className="w-5 h-5 text-altipiqui-gold mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
        <p className="text-sm text-amber-800 dark:text-yellow-300">
          Usa los botones para mover pedidos: <strong>Pendiente → En Cocina → Listo</strong>. 
          Cuando un pedido esté listo, notifica al mesero automáticamente.
        </p>
      </div>
    </div>
  )
}

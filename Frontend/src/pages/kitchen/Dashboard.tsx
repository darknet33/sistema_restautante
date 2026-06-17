import { Gift, UtensilsCrossed } from 'lucide-react'
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
          <Gift className="w-6 h-6 text-altipiqui-red" />
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
        <UtensilsCrossed className="w-5 h-5 text-altipiqui-gold mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800 dark:text-yellow-300">
          Usa los botones para mover pedidos: <strong>Pendiente → En Cocina → Listo</strong>. 
          Cuando un pedido esté listo, notifica al mesero automáticamente.
        </p>
      </div>
    </div>
  )
}

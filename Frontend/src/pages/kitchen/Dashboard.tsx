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

  const kitchenOrders = orders.filter(o => ['PENDIENTE', 'EN_COCINA', 'LISTO'].includes(o.status))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">👨‍🍳 Cocina — Tiempo Real</h2>

      <KanbanBoard
        columns={kitchenColumns}
        orders={kitchenOrders}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        allowedTransitions={kitchenTransitions}
      />

      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <p className="text-sm text-yellow-800">
          ⚡ Arrastra o usa los botones para mover pedidos: <strong>Pendiente → En Cocina → Listo</strong>
        </p>
      </div>
    </div>
  )
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../services/order.service'
import { getTables } from '../../services/table.service'
import { useOrderCreated, useOrderStatusChanged, useSocket } from '../../hooks/useSocket'
import KanbanBoard from '../../components/KanbanBoard'
import TableCanvas from '../../components/TableCanvas'

const columns = [
  { status: 'PENDIENTE', label: 'Pendientes', color: 'gray', bg: 'bg-gray-100' },
  { status: 'EN_COCINA', label: 'En Cocina', color: 'blue', bg: 'bg-blue-50' },
  { status: 'LISTO', label: 'Listos', color: 'green', bg: 'bg-green-50' },
  { status: 'SERVIDO', label: 'Servidos', color: 'orange', bg: 'bg-orange-50' },
]

const allowedTransitions: Record<string, string[]> = {
  LISTO: ['SERVIDO'],
}

export default function WaiterDashboard() {
  const queryClient = useQueryClient()

  useSocket('waiter')
  useOrderCreated(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  useOrderStatusChanged(() => queryClient.invalidateQueries({ queryKey: ['orders', 'tables'] }))

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders(), refetchInterval: 3000 })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables, refetchInterval: 5000 })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold dark:text-dark-text">Dashboard Mesero</h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Gestiona los pedidos y mesas</p>
      </div>

      <KanbanBoard
        columns={columns}
        orders={orders}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        allowedTransitions={allowedTransitions}
      />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-altipiqui-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          </svg>
          <h3 className="font-heading font-semibold dark:text-dark-text">Mesas</h3>
        </div>
        <TableCanvas tables={tables} />
      </div>
    </div>
  )
}

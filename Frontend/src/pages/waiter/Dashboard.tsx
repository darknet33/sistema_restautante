import { PlusCircle, Tag } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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

export default function WaiterDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useSocket('waiter')
  useOrderCreated(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  useOrderStatusChanged(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
  })

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders(), refetchInterval: 3000 })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables, refetchInterval: 5000 })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Dashboard Mesero</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Gestiona los pedidos y mesas</p>
        </div>
        <button
          onClick={() => navigate('/mesero/nuevo-pedido')}
          className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-semibold active:scale-[0.97]"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Pedido
        </button>
      </div>

      <KanbanBoard
        columns={columns}
        orders={orders}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        getOrderTransitions={(order) => {
          if (order.status === 'LISTO' && order.orderType === 'PARA_AQUI') return ['SERVIDO']
          return []
        }}
      />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-altipiqui-indigo" />
          <h3 className="font-heading font-semibold dark:text-dark-text">Mesas</h3>
        </div>
        <TableCanvas tables={tables} />
      </div>
    </div>
  )
}

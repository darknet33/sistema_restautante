import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders } from '../../services/order.service'
import { getTables, saveLayout } from '../../services/table.service'
import { useOrderCreated, useOrderStatusChanged, useSocket } from '../../hooks/useSocket'
import KanbanBoard from '../../components/KanbanBoard'
import TableCanvas from '../../components/TableCanvas'

const columns = [
  { status: 'PENDIENTE', label: 'Pendientes', color: 'gray', bg: 'bg-gray-100' },
  { status: 'EN_COCINA', label: 'En Cocina', color: 'blue', bg: 'bg-blue-50' },
  { status: 'LISTO', label: 'Listos', color: 'green', bg: 'bg-green-50' },
  { status: 'SERVIDO', label: 'Servidos', color: 'orange', bg: 'bg-orange-50' },
]

export default function AdminDashboard() {
  const [editMode, setEditMode] = useState(false)
  const queryClient = useQueryClient()

  useSocket('admin')
  useOrderCreated(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  useOrderStatusChanged(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    refetchInterval: 5000,
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    refetchInterval: 5000,
  })

  const saveMutation = useMutation({
    mutationFn: (data: Parameters<typeof saveLayout>[0]) => saveLayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      setEditMode(false)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard Tiempo Real</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            editMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {editMode ? '✕ Cerrar Editor' : '✎ Editar Mesas'}
        </button>
      </div>

      <KanbanBoard columns={columns} orders={orders} />

      <div>
        <h3 className="text-lg font-semibold mb-3">Estado de Mesas</h3>
        <TableCanvas
          tables={tables}
          editable={editMode}
          onSaveLayout={(data) => saveMutation.mutate(data)}
        />
      </div>
    </div>
  )
}

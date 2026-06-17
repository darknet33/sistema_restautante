import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Dashboard Tiempo Real</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Panel de control general</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/nuevo-pedido')}
            className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-semibold active:scale-[0.97]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nuevo Pedido
          </button>

        </div>
      </div>

      <KanbanBoard columns={columns} orders={orders} />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-altipiqui-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <h3 className="font-heading font-semibold text-lg dark:text-dark-text">Estado de Mesas</h3>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] ${editMode
                ? 'bg-altipiqui-red text-white hover:bg-altipiqui-red-dark shadow-lg shadow-altipiqui-red/20'
                : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border border border-border dark:border-dark-border'
              }`}
          >
            {editMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            )}
            <span>{editMode ? 'Cerrar Editor' : 'Editar Mesas'}</span>
          </button>
        </div>

        <TableCanvas
          tables={tables}
          editable={editMode}
          onSaveLayout={(data) => saveMutation.mutate(data)}
        />
      </div>
    </div>
  )
}

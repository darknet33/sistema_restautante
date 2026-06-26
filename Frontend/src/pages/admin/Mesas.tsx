import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTables, createTable, updateTable, deleteTable, saveLayout } from '../../services/table.service'
import Modal from '../../components/Modal'
import TableCanvas from '../../components/TableCanvas'
import type { Table } from '../../types'
import { PlusCircle, Pencil, Trash2, AlertCircle, Table2 } from 'lucide-react'

const statusColors: Record<string, string> = {
  LIBRE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OCUPADA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  RESERVADA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LIMPIEZA: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

const statusLabels: Record<string, string> = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  LIMPIEZA: 'Limpieza',
}

export default function AdminMesas() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Table | null>(null)
  const [form, setForm] = useState({ number: '', seats: '4' })
  const [editLayout, setEditLayout] = useState(false)
  const queryClient = useQueryClient()

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
  })

  const createMutation = useMutation({
    mutationFn: (data: { number: number; seats: number }) => createTable(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tables'] }); closeModal() },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al crear mesa')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { number?: number; seats?: number } }) => updateTable(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tables'] }); closeModal() },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al actualizar mesa')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al eliminar mesa')
    }
  })

  const saveLayoutMutation = useMutation({
    mutationFn: (data: Parameters<typeof saveLayout>[0]) => saveLayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      setEditLayout(false)
    }
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ number: '', seats: '4' })
    setShowModal(true)
  }

  const openEdit = (table: Table) => {
    setEditing(table)
    setForm({ number: String(table.number), seats: String(table.seats) })
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleSubmit = () => {
    const number = parseInt(form.number)
    if (isNaN(number) || number < 1) return alert('Número de mesa inválido')
    const seats = parseInt(form.seats) || 4
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { number, seats } })
    } else {
      createMutation.mutate({ number, seats })
    }
  }

  const handleDelete = (table: Table) => {
    if (table.orders && table.orders.length > 0) {
      return alert('No se puede eliminar una mesa con pedidos activos')
    }
    if (confirm(`¿Eliminar mesa ${table.number}?`)) {
      deleteMutation.mutate(table.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Mesas</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Gestiona las mesas del restaurante</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium active:scale-[0.97]">
          <PlusCircle className="w-4 h-4" />
          Nueva Mesa
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map(table => {
          const hasActiveOrders = table.orders && table.orders.length > 0
          return (
            <div key={table.id} className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 overflow-hidden transition-all hover:shadow-md">
              <div className="p-5 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg ${
                  table.status === 'LIBRE' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                  table.status === 'OCUPADA' ? 'bg-gradient-to-br from-altipiqui-red to-altipiqui-red-dark' :
                  table.status === 'RESERVADA' ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                  'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  <span className="text-2xl font-bold text-white">{table.number}</span>
                </div>
                <h3 className="font-semibold dark:text-dark-text">Mesa {table.number}</h3>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">{table.seats} asientos</p>
                <span className={`mt-2 px-2.5 py-0.5 text-[11px] rounded-full font-medium ${statusColors[table.status] || ''}`}>
                  {statusLabels[table.status]}
                </span>
                {hasActiveOrders && (
                  <span className="mt-1 text-[10px] text-altipiqui-red font-medium">
                    {table.orders!.length} pedido(s) activo(s)
                  </span>
                )}
              </div>
              <div className="flex border-t border-border/50 dark:border-dark-border/50">
                <button onClick={() => openEdit(table)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-600 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button onClick={() => handleDelete(table)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-border/50 dark:border-dark-border/50">
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          )
        })}
        {tables.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 dark:text-dark-text-muted">
            <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No hay mesas registradas</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Table2 className="w-5 h-5 text-altipiqui-red" />
            <h3 className="font-heading font-semibold text-lg dark:text-dark-text">Layout de Mesas</h3>
          </div>
          <button
            onClick={() => setEditLayout(!editLayout)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] ${editLayout
              ? 'bg-altipiqui-red text-white hover:bg-altipiqui-red-dark shadow-lg shadow-altipiqui-red/20'
              : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border border border-border dark:border-dark-border'
            }`}
          >
            {editLayout ? 'Terminar edición' : 'Editar Layout'}
          </button>
        </div>
        <TableCanvas
          tables={tables}
          editable={editLayout}
          onSaveLayout={(data) => saveLayoutMutation.mutate(data)}
        />
      </div>

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Mesa' : 'Nueva Mesa'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Número de mesa</label>
            <input
              type="number"
              value={form.number}
              onChange={e => setForm({ ...form, number: e.target.value })}
              className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text"
              min="1"
              disabled={!!editing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Asientos</label>
            <input
              type="number"
              value={form.seats}
              onChange={e => setForm({ ...form, seats: e.target.value })}
              className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text"
              min="1"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : editing ? 'Actualizar Mesa' : 'Crear Mesa'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

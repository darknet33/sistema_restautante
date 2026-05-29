import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupplies, createSupply, updateSupply, deleteSupply, addStock } from '../../services/supply.service'
import { getCategories } from '../../services/category.service'
import Modal from '../../components/Modal'
import type { Supply } from '../../types'

export default function AdminConsumibles() {
  const [showModal, setShowModal] = useState(false)
  const [stockModal, setStockModal] = useState<Supply | null>(null)
  const [stockQty, setStockQty] = useState('')
  const [editing, setEditing] = useState<Supply | null>(null)
  const [form, setForm] = useState({ name: '', unit: 'unidad', stockCurrent: '0', stockMin: '0', categoryId: '', isInventoryTracked: false })
  const queryClient = useQueryClient()

  const { data: supplies = [] } = useQuery({ queryKey: ['supplies'], queryFn: () => getSupplies() })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories() })
  const bebidasCat = categories.filter(c => c.type === 'bebida' || c.type === 'insumo')

  const createMutation = useMutation({
    mutationFn: (data: any) => createSupply(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['supplies'] }); closeModal() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateSupply(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['supplies'] }); closeModal() }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSupply(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplies'] })
  })

  const addStockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => addStock(id, qty),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['supplies'] }); setStockModal(null); setStockQty('') }
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', unit: 'unidad', stockCurrent: '0', stockMin: '0', categoryId: '', isInventoryTracked: false })
    setShowModal(true)
  }

  const openEdit = (s: Supply) => {
    setEditing(s)
    setForm({ name: s.name, unit: s.unit, stockCurrent: String(s.stockCurrent), stockMin: String(s.stockMin), categoryId: String(s.categoryId), isInventoryTracked: s.isInventoryTracked })
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleSubmit = () => {
    const data = { ...form, stockCurrent: Number(form.stockCurrent), stockMin: Number(form.stockMin), categoryId: Number(form.categoryId) }
    if (editing) updateMutation.mutate({ id: editing.id, data })
    else createMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Inventario / Consumibles</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Nuevo</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-left p-3">Unidad</th>
                <th className="text-right p-3">Stock Actual</th>
                <th className="text-right p-3">Stock Mín</th>
                <th className="text-center p-3">Control</th>
                <th className="text-center p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-gray-500">{s.category?.name}</td>
                  <td className="p-3">{s.unit}</td>
                  <td className={`p-3 text-right font-medium ${Number(s.stockCurrent) <= Number(s.stockMin) ? 'text-red-600' : ''}`}>{s.stockCurrent}</td>
                  <td className="p-3 text-right">{s.stockMin}</td>
                  <td className="p-3 text-center">{s.isInventoryTracked ? '✅' : '❌'}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setStockModal(s); setStockQty('') }} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">+ Stock</button>
                      <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">✏️</button>
                      <button onClick={() => deleteMutation.mutate(s.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Consumible' : 'Nuevo Consumible'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Seleccionar</option>
                {bebidasCat.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unidad</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="unidad">Unidad</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="g">Gramo (g)</option>
                <option value="porcion">Porción</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
              <input type="number" value={form.stockMin} onChange={e => setForm({ ...form, stockMin: e.target.value })} className="w-full border rounded-lg px-3 py-2" min="0" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isInventoryTracked} onChange={e => setForm({ ...form, isInventoryTracked: e.target.checked })} />
            Controlar inventario
          </label>
          <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {editing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </Modal>

      <Modal open={!!stockModal} onClose={() => setStockModal(null)} title="Agregar Stock">
        {stockModal && (
          <div className="space-y-4">
            <p className="text-sm">Agregar stock a <strong>{stockModal.name}</strong></p>
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad</label>
              <input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} className="w-full border rounded-lg px-3 py-2" min="1" />
            </div>
            <button onClick={() => addStockMutation.mutate({ id: stockModal.id, qty: Number(stockQty) })} disabled={addStockMutation.isPending || !stockQty}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              Agregar
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

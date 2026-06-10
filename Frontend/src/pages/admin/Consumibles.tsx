import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getSupplies, createSupply, updateSupply, deleteSupply, addStock } from '../../services/supply.service'
import { getCategories } from '../../services/category.service'
import CategoryManager from '../../components/CategoryManager'
import Modal from '../../components/Modal'
import { formatCurrency } from '../../utils/format'
import type { Supply } from '../../types'

export default function AdminConsumibles() {
  const [showModal, setShowModal] = useState(false)
  const [stockModal, setStockModal] = useState<Supply | null>(null)
  const [stockQty, setStockQty] = useState('')
  const [editing, setEditing] = useState<Supply | null>(null)
  const [form, setForm] = useState({ name: '', unit: 'unidad', purchaseCost: '0', salePrice: '0', stockCurrent: '0', stockMin: '0', categoryId: '', isInventoryTracked: false })
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplies'] }),
    onError: (error: AxiosError<{ message: string }>) => {
      alert(error.response?.data?.message || 'Error al eliminar el consumible')
    }
  })

  const addStockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => addStock(id, qty),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['supplies'] }); setStockModal(null); setStockQty('') }
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', unit: 'unidad', purchaseCost: '0', salePrice: '0', stockCurrent: '0', stockMin: '0', categoryId: '', isInventoryTracked: false })
    setShowModal(true)
  }

  const openEdit = (s: Supply) => {
    setEditing(s)
    setForm({ name: s.name, unit: s.unit, purchaseCost: String(s.purchaseCost), salePrice: String(s.salePrice), stockCurrent: String(s.stockCurrent), stockMin: String(s.stockMin), categoryId: String(s.categoryId), isInventoryTracked: s.isInventoryTracked })
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Inventario / Consumibles</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Control de stock y consumibles</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium active:scale-[0.97]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Nuevo
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-altipiqui-cream dark:bg-dark-bg">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Nombre</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Categoría</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Unidad</th>
                <th className="text-right p-4 font-semibold text-gray-600 dark:text-dark-text">Compra</th>
                <th className="text-right p-4 font-semibold text-gray-600 dark:text-dark-text">Venta</th>
                <th className="text-right p-4 font-semibold text-gray-600 dark:text-dark-text">Stock Actual</th>
                <th className="text-right p-4 font-semibold text-gray-600 dark:text-dark-text">Stock Mín</th>
                <th className="text-center p-4 font-semibold text-gray-600 dark:text-dark-text">Control</th>
                <th className="text-center p-4 font-semibold text-gray-600 dark:text-dark-text">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map(s => (
                <tr key={s.id} className="border-t border-border/50 dark:border-dark-border/50 hover:bg-altipiqui-cream/50 dark:hover:bg-dark-bg/50">
                  <td className="p-4 font-medium dark:text-dark-text">{s.name}</td>
                  <td className="p-4 text-gray-500 dark:text-dark-text-muted">{s.category?.name}</td>
                  <td className="p-4 dark:text-dark-text-muted">{s.unit}</td>
                  <td className="p-4 text-right dark:text-dark-text-muted">{formatCurrency(s.purchaseCost)}</td>
                  <td className="p-4 text-right font-medium text-altipiqui-green">{formatCurrency(s.salePrice)}</td>
                  <td className={`p-4 text-right font-medium ${Number(s.stockCurrent) <= Number(s.stockMin) ? 'text-altipiqui-red' : 'dark:text-dark-text'}`}>{s.stockCurrent}</td>
                  <td className="p-4 text-right dark:text-dark-text-muted">{s.stockMin}</td>
                  <td className="p-4 text-center">{s.isInventoryTracked ? '✅' : '❌'}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => { setStockModal(s); setStockQty('') }} className="px-2.5 py-1.5 bg-altipiqui-green-light dark:bg-green-900/20 text-altipiqui-green dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" />
                        </svg>
                        Stock
                      </button>
                      <button onClick={() => openEdit(s)} className="p-1.5 bg-gray-100 dark:bg-dark-border rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors">
                        <svg className="w-4 h-4 text-gray-600 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {supplies.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-gray-400 dark:text-dark-text-muted">Sin consumibles registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Consumible' : 'Nuevo Consumible'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Nombre</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Categoría</label>
              <div className="flex gap-2">
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="flex-1 border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text">
                  <option value="">Seleccionar</option>
                  {bebidasCat.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <CategoryManager type={['bebida', 'insumo'] as const} trigger={
                  <button type="button" className="p-2.5 bg-gray-100 dark:bg-dark-border rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors" title="Gestionar categorías">
                    <svg className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                } />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Unidad</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text">
                <option value="unidad">Unidad</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="g">Gramo (g)</option>
                <option value="porcion">Porción</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Precio de Compra (Bs.)</label>
              <input type="number" value={form.purchaseCost} onChange={e => setForm({ ...form, purchaseCost: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Precio de Venta (Bs.)</label>
              <input type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Stock Mínimo</label>
              <input type="number" value={form.stockMin} onChange={e => setForm({ ...form, stockMin: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" min="0" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-dark-text">
            <input type="checkbox" checked={form.isInventoryTracked} onChange={e => setForm({ ...form, isInventoryTracked: e.target.checked })} className="rounded accent-altipiqui-red" />
            Controlar inventario
          </label>
          <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]">
            {editing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </Modal>

      <Modal open={!!stockModal} onClose={() => setStockModal(null)} title="Agregar Stock">
        {stockModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-altipiqui-green-light dark:bg-green-900/20 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-altipiqui-green/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-altipiqui-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium dark:text-dark-text">Agregar stock a <strong>{stockModal.name}</strong></p>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">Stock actual: {stockModal.stockCurrent} {stockModal.unit}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Cantidad a agregar</label>
              <input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-green focus:border-altipiqui-green outline-none dark:bg-dark-surface dark:text-dark-text" min="1" />
            </div>
            <button onClick={() => addStockMutation.mutate({ id: stockModal.id, qty: Number(stockQty) })} disabled={addStockMutation.isPending || !stockQty}
              className="w-full py-2.5 bg-altipiqui-green text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all font-medium active:scale-[0.97]">
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" />
                </svg>
                Agregar
              </span>
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

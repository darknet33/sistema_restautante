import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getSupplies, createSupply, updateSupply, deleteSupply, addStock, getSupplyKardex } from '../../services/supply.service'
import { getCategories } from '../../services/category.service'
import CategoryManager from '../../components/CategoryManager'
import Modal from '../../components/Modal'
import { formatCurrency, formatDateTime } from '../../utils/format'
import type { Supply, KardexResponse } from '../../types'
import { PlusCircle, Plus, Package, Pencil, Trash2, Settings, RefreshCw, Loader2 } from 'lucide-react'

export default function AdminConsumibles() {
  const [showModal, setShowModal] = useState(false)
  const [stockModal, setStockModal] = useState<Supply | null>(null)
  const [stockQty, setStockQty] = useState('')
  const [editing, setEditing] = useState<Supply | null>(null)
  const [form, setForm] = useState({ name: '', unit: 'unidad', purchaseCost: '0', salePrice: '0', stockCurrent: '0', stockMin: '0', categoryId: '', isInventoryTracked: false })
  const [kardexSupply, setKardexSupply] = useState<Supply | null>(null)
  const [kardexData, setKardexData] = useState<KardexResponse | null>(null)
  const [kardexLoading, setKardexLoading] = useState(false)
  const [kardexStartDate, setKardexStartDate] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [kardexEndDate, setKardexEndDate] = useState(() => new Date().toISOString().split('T')[0])
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

  const loadKardex = async (supply: Supply) => {
    setKardexSupply(supply)
    setKardexLoading(true)
    try {
      const data = await getSupplyKardex(supply.id, kardexStartDate, kardexEndDate)
      setKardexData(data)
    } catch (e) {
      alert('Error al cargar kardex')
    }
    setKardexLoading(false)
  }

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
          <PlusCircle className="w-4 h-4" />
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
                        <Plus className="w-3 h-3" />
                        Stock
                      </button>
                      <button onClick={() => { setKardexSupply(s); loadKardex(s) }} className="px-2.5 py-1.5 bg-altipiqui-indigo-light dark:bg-altipiqui-indigo/20 text-altipiqui-indigo dark:text-altipiqui-indigo-light rounded-xl hover:bg-altipiqui-indigo/20 dark:hover:bg-altipiqui-indigo/30 transition-colors text-xs font-medium flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Kardex
                      </button>
                      <button onClick={() => openEdit(s)} className="p-1.5 bg-gray-100 dark:bg-dark-border rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors">
                        <Pencil className="w-4 h-4 text-gray-600 dark:text-dark-text-muted" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
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
                    <Settings className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
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
                <Trash2 className="w-5 h-5 text-altipiqui-green" />
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
                <Plus className="w-4 h-4" />
                Agregar
              </span>
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!kardexSupply} onClose={() => { setKardexSupply(null); setKardexData(null) }} title="Kardex de Inventario" size="lg">
        {kardexSupply && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-altipiqui-indigo-light dark:bg-altipiqui-indigo/10 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-altipiqui-indigo/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-altipiqui-indigo" />
              </div>
              <div>
                <p className="text-sm font-medium dark:text-dark-text">
                  <strong>{kardexSupply.name}</strong> <span className="text-gray-400 dark:text-dark-text-muted">({kardexSupply.unit})</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">Stock actual: {kardexSupply.stockCurrent} {kardexSupply.unit}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-dark-text">Desde</label>
                <input type="date" value={kardexStartDate} onChange={e => setKardexStartDate(e.target.value)}
                  className="border border-border dark:border-dark-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-altipiqui-indigo focus:border-altipiqui-indigo outline-none dark:bg-dark-surface dark:text-dark-text" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-dark-text">Hasta</label>
                <input type="date" value={kardexEndDate} onChange={e => setKardexEndDate(e.target.value)}
                  className="border border-border dark:border-dark-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-altipiqui-indigo focus:border-altipiqui-indigo outline-none dark:bg-dark-surface dark:text-dark-text" />
              </div>
              <button onClick={() => loadKardex(kardexSupply)}
                className="px-4 py-2 bg-altipiqui-indigo text-white rounded-xl hover:bg-altipiqui-indigo-dark transition-all text-sm font-medium active:scale-[0.97] flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" />
                Consultar
              </button>
            </div>

            {kardexLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 dark:text-dark-text-muted">
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                Cargando...
              </div>
            ) : kardexData ? (
              <div className="overflow-x-auto">
                <div className="bg-altipiqui-cream dark:bg-dark-bg rounded-xl p-3 mb-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-dark-text-muted">Stock Inicial <span className="font-semibold text-gray-800 dark:text-dark-text">({formatDateTime(kardexData.startDate)})</span>:</span>
                  <span className="font-bold text-lg text-altipiqui-indigo">{kardexData.initialStock} {kardexSupply.unit}</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50 dark:border-dark-border/50">
                      <th className="text-left p-2 font-semibold text-gray-600 dark:text-dark-text">Fecha</th>
                      <th className="text-left p-2 font-semibold text-gray-600 dark:text-dark-text">Tipo</th>
                      <th className="text-right p-2 font-semibold text-gray-600 dark:text-dark-text">Cantidad</th>
                      <th className="text-right p-2 font-semibold text-gray-600 dark:text-dark-text">Stock Antes</th>
                      <th className="text-right p-2 font-semibold text-gray-600 dark:text-dark-text">Stock Después</th>
                      <th className="text-left p-2 font-semibold text-gray-600 dark:text-dark-text">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kardexData.movements.map(m => (
                      <tr key={m.id} className="border-b border-border/30 dark:border-dark-border/30 hover:bg-altipiqui-cream/50 dark:hover:bg-dark-bg/50">
                        <td className="p-2 whitespace-nowrap dark:text-dark-text-muted">{formatDateTime(m.date)}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            m.type === 'ENTRADA' ? 'bg-altipiqui-green-light text-altipiqui-green' :
                            m.type === 'MERMA' ? 'bg-red-50 text-red-600' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {m.type === 'ENTRADA' ? 'Entrada' : m.type === 'MERMA' ? 'Salida' : 'Ajuste'}
                          </span>
                        </td>
                        <td className={`p-2 text-right font-medium ${m.type === 'ENTRADA' ? 'text-altipiqui-green' : 'text-red-500'}`}>
                          {m.type === 'ENTRADA' ? '+' : '-'}{m.quantity}
                        </td>
                        <td className="p-2 text-right dark:text-dark-text">{m.stockBefore}</td>
                        <td className="p-2 text-right font-semibold dark:text-dark-text">{m.stockAfter}</td>
                        <td className="p-2 dark:text-dark-text-muted">{m.user.name}</td>
                      </tr>
                    ))}
                    {kardexData.movements.length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-gray-400 dark:text-dark-text-muted">Sin movimientos en el período</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="bg-altipiqui-green-light dark:bg-green-900/20 rounded-xl p-3 mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-dark-text-muted">Stock Final:</span>
                  <span className="font-bold text-lg text-altipiqui-green">{kardexData.supply.stockCurrent} {kardexSupply.unit}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWastes, createWaste } from '../../services/waste.service'
import { getSupplies } from '../../services/supply.service'
import { formatDateTime } from '../../utils/format'
import Modal from '../../components/Modal'

export default function AdminPerdidos() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ supplyId: '', quantity: '', reason: '' })
  const queryClient = useQueryClient()

  const { data: wastes = [] } = useQuery({ queryKey: ['wastes'], queryFn: () => getWastes() })
  const { data: supplies = [] } = useQuery({ queryKey: ['supplies'], queryFn: () => getSupplies() })

  const createMutation = useMutation({
    mutationFn: () => createWaste({ supplyId: Number(form.supplyId), quantity: Number(form.quantity), reason: form.reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wastes'] }); queryClient.invalidateQueries({ queryKey: ['supplies'] }); setShowModal(false); setForm({ supplyId: '', quantity: '', reason: '' }) }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Registro de Pérdidas</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Control de mermas y pérdidas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium active:scale-[0.97]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Nueva Pérdida
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-altipiqui-cream dark:bg-dark-bg">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Producto</th>
                <th className="text-right p-4 font-semibold text-gray-600 dark:text-dark-text">Cantidad</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Motivo</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Registró</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {wastes.map(w => (
                <tr key={w.id} className="border-t border-border/50 dark:border-dark-border/50 hover:bg-altipiqui-cream/50 dark:hover:bg-dark-bg/50">
                  <td className="p-4 font-medium dark:text-dark-text">{w.supply?.name}</td>
                  <td className="p-4 text-right text-altipiqui-red font-medium">{w.quantity}</td>
                  <td className="p-4 text-gray-500 dark:text-dark-text-muted">{w.reason}</td>
                  <td className="p-4 dark:text-dark-text">{w.user?.name}</td>
                  <td className="p-4 text-gray-500 dark:text-dark-text-muted text-xs">{formatDateTime(w.createdAt)}</td>
                </tr>
              ))}
              {wastes.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400 dark:text-dark-text-muted">Sin registros de pérdidas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Pérdida">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Producto</label>
            <select value={form.supplyId} onChange={e => setForm({ ...form, supplyId: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text">
              <option value="">Seleccionar</option>
              {supplies.map(s => <option key={s.id} value={s.id}>{s.name} (stock: {s.stockCurrent})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Cantidad</label>
            <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" min="1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Motivo</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" rows={2} placeholder="Ej: se quemó, se cayó, caducó..." />
          </div>
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]">
            {createMutation.isPending ? 'Guardando...' : 'Registrar Pérdida'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

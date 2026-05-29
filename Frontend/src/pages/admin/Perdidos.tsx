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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Registro de Pérdidas</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">+ Nueva Pérdida</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Producto</th>
                <th className="text-right p-3">Cantidad</th>
                <th className="text-left p-3">Motivo</th>
                <th className="text-left p-3">Registró</th>
                <th className="text-left p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {wastes.map(w => (
                <tr key={w.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{w.supply?.name}</td>
                  <td className="p-3 text-right text-red-600 font-medium">{w.quantity}</td>
                  <td className="p-3 text-gray-500">{w.reason}</td>
                  <td className="p-3">{w.user?.name}</td>
                  <td className="p-3 text-gray-500">{formatDateTime(w.createdAt)}</td>
                </tr>
              ))}
              {wastes.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-400">Sin registros de pérdidas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Pérdida">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Producto</label>
            <select value={form.supplyId} onChange={e => setForm({ ...form, supplyId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="">Seleccionar</option>
              {supplies.map(s => <option key={s.id} value={s.id}>{s.name} (stock: {s.stockCurrent})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full border rounded-lg px-3 py-2" min="1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} placeholder="Ej: se quemó, se cayó, caducó..." />
          </div>
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {createMutation.isPending ? 'Guardando...' : 'Registrar Pérdida'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

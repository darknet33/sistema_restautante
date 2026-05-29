import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../services/order.service'
import { getTables } from '../../services/table.service'
import { getCurrentCaja, openCaja, closeCaja } from '../../services/caja.service'
import { useOrderCreated, useOrderStatusChanged, useSocket } from '../../hooks/useSocket'
import { formatCurrency } from '../../utils/format'
import Modal from '../../components/Modal'
import TableCanvas from '../../components/TableCanvas'
import type { Order } from '../../types'

export default function CajeroDashboard() {
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [payModal, setPayModal] = useState<Order | null>(null)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const queryClient = useQueryClient()

  useSocket('cajero')
  useOrderCreated(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  useOrderStatusChanged(() => queryClient.invalidateQueries({ queryKey: ['orders', 'tables'] }))

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders(), refetchInterval: 5000 })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables, refetchInterval: 5000 })
  const { data: currentSession } = useQuery({ queryKey: ['currentCaja'], queryFn: getCurrentCaja, refetchInterval: 3000 })

  const payMutation = useMutation({
    mutationFn: (id: number) => updateOrderStatus(id, 'PAGADO'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders', 'tables'] }); setPayModal(null) }
  })

  const openMutation = useMutation({
    mutationFn: () => openCaja(Number(openingAmount)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentCaja'] }); setOpenModal(false) }
  })

  const closeCajaMutation = useMutation({
    mutationFn: () => closeCaja(Number(closingAmount)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentCaja'] }); setCloseModal(false) }
  })

  const pendingPayment = orders.filter(o => o.status === 'SERVIDO')
  const inProgress = orders.filter(o => ['PENDIENTE', 'EN_COCINA', 'LISTO'].includes(o.status))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Cajero Dashboard</h2>
        {currentSession ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 font-medium">Caja abierta</span>
            <span className="text-gray-500">{formatCurrency(currentSession.openingAmount)}</span>
            <button onClick={() => setCloseModal(true)} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-xs">Cerrar</button>
          </div>
        ) : (
          <button onClick={() => setOpenModal(true)} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-xs">Abrir Caja</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Mesas</h3>
          <TableCanvas tables={tables} />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Pendientes de Cobro ({pendingPayment.length})</h3>
            <div className="space-y-2">
              {pendingPayment.map(order => (
                <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-orange-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Mesa {order.table?.number} — {formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500">{order.items?.length} productos</p>
                  </div>
                  <button onClick={() => setPayModal(order)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    Cobrar
                  </button>
                </div>
              ))}
              {pendingPayment.length === 0 && <p className="text-sm text-gray-400">Sin pedidos por cobrar</p>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Pedidos en Progreso ({inProgress.length})</h3>
            <div className="space-y-2">
              {inProgress.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-3 shadow-sm border text-sm flex items-center justify-between">
                  <div>
                    <span className="font-medium">Mesa {order.table?.number}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      order.status === 'PENDIENTE' ? 'bg-gray-100' :
                      order.status === 'EN_COCINA' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>{order.status}</span>
                  </div>
                  <span className="text-gray-500">{formatCurrency(order.total)}</span>
                </div>
              ))}
              {inProgress.length === 0 && <p className="text-sm text-gray-400">Sin pedidos activos</p>}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Cobrar Pedido">
        {payModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-bold text-lg">Mesa {payModal.table?.number}</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(payModal.total)}</p>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {payModal.items?.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>x{item.quantity} {item.dish?.name || item.supply?.name}</span>
                  <span>{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</span>
                </div>
              ))}
            </div>
            <button onClick={() => payMutation.mutate(payModal.id)} disabled={payMutation.isPending}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 text-lg">
              {payMutation.isPending ? 'Procesando...' : '💰 Confirmar Pago'}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir Caja">
        <div className="space-y-4">
          <input type="number" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} placeholder="Monto inicial" className="w-full border rounded-lg px-3 py-2" min="0" />
          <button onClick={() => openMutation.mutate()} disabled={openMutation.isPending}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Abrir</button>
        </div>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Cerrar Caja">
        <div className="space-y-4">
          <input type="number" value={closingAmount} onChange={e => setClosingAmount(e.target.value)} placeholder="Monto final" className="w-full border rounded-lg px-3 py-2" min="0" />
          <button onClick={() => closeCajaMutation.mutate()} disabled={closeCajaMutation.isPending}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Cerrar</button>
        </div>
      </Modal>
    </div>
  )
}

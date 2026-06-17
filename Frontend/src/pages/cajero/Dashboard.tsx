import { useState } from 'react'
import { Check, CheckCircle, CreditCard, Printer, PlusCircle, Tag } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../services/order.service'
import { getTables } from '../../services/table.service'
import { getCurrentCaja, openCaja, closeCaja } from '../../services/caja.service'
import { useOrderCreated, useOrderStatusChanged, useSocket } from '../../hooks/useSocket'
import { formatCurrency } from '../../utils/format'
import Modal from '../../components/Modal'
import TableCanvas from '../../components/TableCanvas'
import TicketPreviewModal from '../../components/TicketPreviewModal'
import { getCustomerReceiptUrl } from '../../services/order.service'
import type { Order } from '../../types'

export default function CajeroDashboard() {
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [payModal, setPayModal] = useState<Order | null>(null)
  const [paidOrder, setPaidOrder] = useState<Order | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const queryClient = useQueryClient()

  useSocket('cajero')
  useOrderCreated(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  useOrderStatusChanged(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
  })

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders(), refetchInterval: 5000 })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables, refetchInterval: 5000 })
  const { data: currentSession } = useQuery({ queryKey: ['currentCaja'], queryFn: getCurrentCaja, refetchInterval: 3000 })

  const payMutation = useMutation({
    mutationFn: (id: number) => updateOrderStatus(id, 'PAGADO'),
    onSuccess: (order) => { queryClient.invalidateQueries({ queryKey: ['orders'] }); queryClient.invalidateQueries({ queryKey: ['tables'] }); setPayModal(null); setPaidOrder(order) }
  })

  const openMutation = useMutation({
    mutationFn: () => openCaja(Number(openingAmount)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentCaja'] }); setOpenModal(false) }
  })

  const closeCajaMutation = useMutation({
    mutationFn: () => closeCaja(Number(closingAmount)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentCaja'] }); setCloseModal(false) }
  })

  const pendingPayment = orders.filter(o =>
    o.status === 'SERVIDO' || (o.status === 'LISTO' && o.orderType !== 'PARA_AQUI')
  )
  const inProgress = orders.filter(o => ['PENDIENTE', 'EN_COCINA'].includes(o.status) || (o.status === 'LISTO' && o.orderType === 'PARA_AQUI'))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Panel de Cajero</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Cobros y estado de caja</p>
        </div>
        {currentSession ? (
          <div className="flex items-center gap-3 text-sm bg-altipiqui-green-light dark:bg-green-900/20 rounded-xl px-4 py-2">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-altipiqui-green dark:text-green-400 font-medium">Caja abierta</span>
            <span className="text-gray-500 dark:text-dark-text-muted">|</span>
            <span className="font-semibold dark:text-dark-text">{formatCurrency(currentSession.openingAmount)}</span>
            <button onClick={() => setCloseModal(true)} className="px-3 py-1.5 bg-altipiqui-red/10 text-altipiqui-red rounded-xl hover:bg-altipiqui-red/20 text-xs font-medium transition-colors">Cerrar</button>
          </div>
        ) : (
          <button onClick={() => setOpenModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-indigo text-white rounded-xl hover:bg-altipiqui-indigo-dark transition-all duration-200 text-sm font-medium active:scale-[0.97]">
            <PlusCircle className="w-4 h-4" />
            Abrir Caja
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-altipiqui-indigo" />
            <h3 className="font-heading font-semibold dark:text-dark-text">Mesas</h3>
          </div>
          <TableCanvas tables={tables} />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold dark:text-dark-text">Pendientes de Cobro</h3>
              <span className="bg-altipiqui-red/10 text-altipiqui-red text-xs font-bold px-2.5 py-1 rounded-full">{pendingPayment.length}</span>
            </div>
            <div className="space-y-2">
              {pendingPayment.map(order => (
                <div key={order.id} className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-orange-200 dark:border-orange-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-bold dark:text-dark-text">
                        {order.table?.number ? `Mesa ${order.table.number}` : order.orderType === 'DELIVERY' ? 'Delivery' : 'Para Llevar'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted">{order.items?.length} productos · {formatCurrency(order.total)}</p>
                    </div>
                  </div>
                  <button onClick={() => setPayModal(order)} className="flex items-center gap-1.5 px-5 py-2 bg-altipiqui-green text-white rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-lg shadow-altipiqui-green/20 active:scale-[0.97] whitespace-nowrap">
                    <CheckCircle className="w-4 h-4" />
                    Cobrar
                  </button>
                </div>
              ))}
              {pendingPayment.length === 0 && <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-6">Sin pedidos por cobrar</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold dark:text-dark-text">Pedidos en Progreso</h3>
              <span className="bg-altipiqui-indigo/10 text-altipiqui-indigo dark:text-altipiqui-indigo-light text-xs font-bold px-2.5 py-1 rounded-full">{inProgress.length}</span>
            </div>
            <div className="space-y-2">
              {inProgress.map(order => (
                <div key={order.id} className="bg-white dark:bg-dark-surface rounded-xl p-3 shadow-sm border border-border/50 dark:border-dark-border/50 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium dark:text-dark-text">
                      {order.table?.number ? `Mesa ${order.table.number}` : order.orderType === 'DELIVERY' ? 'Delivery' : 'Para Llevar'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'PENDIENTE' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                      order.status === 'EN_COCINA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-altipiqui-green-light text-altipiqui-green dark:bg-green-900/30 dark:text-green-300'
                    }`}>{order.status}</span>
                  </div>
                  <span className="text-gray-500 dark:text-dark-text-muted font-medium">{formatCurrency(order.total)}</span>
                </div>
              ))}
              {inProgress.length === 0 && <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-6">Sin pedidos activos</p>}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Cobrar Pedido">
        {payModal && (() => {
          const chargeableItems = (payModal.items || []).filter(i => i.type !== 'supply' || i.served)
          const chargeTotal = chargeableItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0)
          const hasUnserved = (payModal.items || []).some(i => i.type === 'supply' && !i.served)
          const originalTotal = payModal.total

          return (
            <div className="space-y-4">
              <div className="bg-altipiqui-green-light dark:bg-green-900/20 rounded-2xl p-5 text-center">
                <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                  {payModal.table?.number ? `Mesa ${payModal.table.number}` : payModal.orderType === 'DELIVERY' ? 'Delivery' : 'Para Llevar'}
                </p>
                {hasUnserved ? (
                  <div className="mt-1">
                    <p className="text-sm text-gray-400 dark:text-dark-text-muted line-through">{formatCurrency(originalTotal)}</p>
                    <p className="text-3xl font-bold text-altipiqui-green">{formatCurrency(chargeTotal)}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">* Sin consumibles no atendidos</p>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-altipiqui-green mt-1">{formatCurrency(originalTotal)}</p>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(payModal.items || []).map(item => {
                  const isUnservedSupply = item.type === 'supply' && !item.served
                  return (
                    <div key={item.id} className={`flex justify-between text-sm py-1.5 border-b border-border/50 dark:border-dark-border/50 last:border-0 dark:text-dark-text ${isUnservedSupply ? 'opacity-50' : ''}`}>
                      <span className="flex items-center gap-1.5">
                        {item.type === 'supply' && (
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.served ? 'bg-altipiqui-green' : 'border border-amber-400'}`}>
                            {item.served && <Check className="w-3 h-3 text-white" />}
                          </span>
                        )}
                        <span className={isUnservedSupply ? 'line-through' : ''}>x{item.quantity} {item.dish?.name || item.supply?.name}</span>
                        {isUnservedSupply && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">(no atendido)</span>}
                      </span>
                      <span className={`font-medium ${isUnservedSupply ? 'line-through text-gray-400' : ''}`}>{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => payMutation.mutate(payModal.id)} disabled={payMutation.isPending}
                className="w-full py-3 bg-altipiqui-green text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-all duration-200 text-lg shadow-lg shadow-altipiqui-green/20 active:scale-[0.97]">
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {payMutation.isPending ? 'Procesando...' : `Cobrar ${formatCurrency(chargeTotal)}`}
                </span>
              </button>
            </div>
          )
        })()}
      </Modal>

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir Caja">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Monto inicial</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Bs.</span>
              <input type="number" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} placeholder="0.00" min="0"
                className="w-full pl-10 pr-4 py-2.5 border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-altipiqui-indigo focus:border-altipiqui-indigo outline-none dark:bg-dark-surface dark:text-dark-text" />
            </div>
          </div>
          <button onClick={() => openMutation.mutate()} disabled={openMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-indigo text-white rounded-xl hover:bg-altipiqui-indigo-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]">Abrir</button>
        </div>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Cerrar Caja">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Monto final</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Bs.</span>
              <input type="number" value={closingAmount} onChange={e => setClosingAmount(e.target.value)} placeholder="0.00" min="0"
                className="w-full pl-10 pr-4 py-2.5 border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" />
            </div>
          </div>
          <button onClick={() => closeCajaMutation.mutate()} disabled={closeCajaMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]">Cerrar</button>
        </div>
      </Modal>

      <Modal open={!!paidOrder} onClose={() => setPaidOrder(null)} title="Pedido Cobrado" size="sm">
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-altipiqui-green-light dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-altipiqui-green" />
          </div>
          <p className="text-lg font-heading font-bold dark:text-dark-text">Pedido cobrado exitosamente</p>
          {paidOrder && (
            <>
              <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">Orden #{paidOrder.id}</p>
              <button
                onClick={async () => {
                  const url = await getCustomerReceiptUrl(paidOrder.id)
                  setPreviewUrl(url)
                  setPreviewTitle('Recibo')
                  setShowPreview(true)
                }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 border-2 border-altipiqui-indigo text-altipiqui-indigo rounded-xl hover:bg-altipiqui-indigo hover:text-white transition-all duration-200 font-medium text-sm active:scale-[0.97]"
              >
                <Printer className="w-4 h-4" />
                Ver Recibo
              </button>
            </>
          )}
          <button onClick={() => setPaidOrder(null)} className="mt-3 px-6 py-2.5 bg-altipiqui-indigo text-white rounded-xl hover:bg-altipiqui-indigo-dark transition-all duration-200 shadow-lg shadow-altipiqui-indigo/20 font-medium active:scale-[0.97]">
            Cerrar
          </button>
        </div>
      </Modal>

      <TicketPreviewModal open={showPreview} url={previewUrl} title={previewTitle} onClose={() => { setShowPreview(false); URL.revokeObjectURL(previewUrl) }} />
    </div>
  )
}

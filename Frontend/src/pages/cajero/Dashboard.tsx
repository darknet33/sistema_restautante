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
  useOrderStatusChanged(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
  })

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders(), refetchInterval: 5000 })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables, refetchInterval: 5000 })
  const { data: currentSession } = useQuery({ queryKey: ['currentCaja'], queryFn: getCurrentCaja, refetchInterval: 3000 })

  const payMutation = useMutation({
    mutationFn: (id: number) => updateOrderStatus(id, 'PAGADO'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); queryClient.invalidateQueries({ queryKey: ['tables'] }); setPayModal(null) }
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Abrir Caja
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-altipiqui-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            </svg>
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
                      <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold dark:text-dark-text">Mesa {order.table?.number}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted">{order.items?.length} productos · {formatCurrency(order.total)}</p>
                    </div>
                  </div>
                  <button onClick={() => setPayModal(order)} className="flex items-center gap-1.5 px-5 py-2 bg-altipiqui-green text-white rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-lg shadow-altipiqui-green/20 active:scale-[0.97] whitespace-nowrap">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
                    <span className="font-medium dark:text-dark-text">Mesa {order.table?.number}</span>
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
                <p className="text-sm text-gray-500 dark:text-dark-text-muted">Mesa {payModal.table?.number}</p>
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
                            {item.served && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
    </div>
  )
}

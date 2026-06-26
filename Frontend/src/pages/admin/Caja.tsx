import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentCaja, openCaja, closeCaja, getCajaHistory } from '../../services/caja.service'
import { getOrders, updateOrderStatus, getCustomerReceiptUrl } from '../../services/order.service'
import { getTables } from '../../services/table.service'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { useOrderCreated, useOrderStatusChanged } from '../../hooks/useSocket'
import Modal from '../../components/Modal'
import TableCanvas from '../../components/TableCanvas'
import TicketPreviewModal from '../../components/TicketPreviewModal'
import type { Order } from '../../types'
import { Check, CheckCircle, CreditCard, DollarSign, Loader2, PlusCircle, Printer, Tag } from 'lucide-react'

export default function AdminCaja() {
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [payModal, setPayModal] = useState<Order | null>(null)
  const [paidOrder, setPaidOrder] = useState<Order | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [closeSummary, setCloseSummary] = useState<{ openingAmount: number; closingAmount: number } | null>(null)
  const queryClient = useQueryClient()

  useOrderCreated(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  useOrderStatusChanged(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
  })

  const { data: currentSession, isLoading } = useQuery({
    queryKey: ['currentCaja'],
    queryFn: getCurrentCaja,
    refetchInterval: 3000,
  })

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders(), refetchInterval: 5000 })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables, refetchInterval: 5000 })

  const { data: history = [] } = useQuery({
    queryKey: ['cajaHistory'],
    queryFn: getCajaHistory,
    enabled: showHistory,
  })

  const openMutation = useMutation({
    mutationFn: () => openCaja(Number(openingAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentCaja'] })
      setOpenModal(false)
      setOpeningAmount('')
    }
  })

  const closeMutation = useMutation({
    mutationFn: () => closeCaja(Number(closingAmount)),
    onSuccess: (session: any) => {
      queryClient.invalidateQueries({ queryKey: ['currentCaja'] })
      queryClient.invalidateQueries({ queryKey: ['dailySales'] })
      setCloseModal(false)
      setCloseSummary({ openingAmount: session.openingAmount, closingAmount: session.closingAmount })
      setClosingAmount('')
    }
  })

  const payMutation = useMutation({
    mutationFn: (id: number) => updateOrderStatus(id, 'PAGADO'),
    onSuccess: (order) => { queryClient.invalidateQueries({ queryKey: ['orders'] }); queryClient.invalidateQueries({ queryKey: ['tables'] }); setPayModal(null); setPaidOrder(order) }
  })

  const pendingPayment = orders.filter(o =>
    o.status === 'SERVIDO' || (o.status === 'LISTO' && o.orderType !== 'PARA_AQUI')
  )
  const inProgress = orders.filter(o => ['PENDIENTE', 'EN_COCINA'].includes(o.status) || (o.status === 'LISTO' && o.orderType === 'PARA_AQUI'))
  const paidOrders = orders.filter(o => ['PAGADO', 'ENTREGADO'].includes(o.status))
  const totalRecaudado = paidOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null)

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 text-gray-500 dark:text-dark-text-muted">
        <Loader2 className="animate-spin w-5 h-5" />
        <span className="text-sm">Cargando...</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold dark:text-dark-text">Gestión de Caja</h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Apertura y cierre de caja</p>
      </div>

      {currentSession ? (
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
          <div className="flex items-center gap-3 mb-5">
            <span className="relative flex w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <h3 className="font-heading font-semibold text-lg dark:text-dark-text">Caja Abierta</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
            <div className="bg-altipiqui-green-light dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-gray-500 dark:text-dark-text-muted text-xs mb-1">Abrió</p>
              <p className="font-semibold dark:text-dark-text">{currentSession.user?.name}</p>
            </div>
            <div className="bg-altipiqui-cream dark:bg-altipiqui-brown/10 rounded-xl p-4">
              <p className="text-gray-500 dark:text-dark-text-muted text-xs mb-1">Monto inicial</p>
              <p className="font-semibold text-altipiqui-red">{formatCurrency(currentSession.openingAmount)}</p>
            </div>
            <div className="bg-altipiqui-indigo-light dark:bg-altipiqui-indigo/10 rounded-xl p-4">
              <p className="text-gray-500 dark:text-dark-text-muted text-xs mb-1">Apertura</p>
              <p className="font-semibold dark:text-dark-text">{formatDateTime(currentSession.openedAt)}</p>
            </div>
            <div className="bg-altipiqui-green-light dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-gray-500 dark:text-dark-text-muted text-xs mb-1">Total recaudado</p>
              <p className="font-bold text-lg text-altipiqui-green">{formatCurrency(totalRecaudado)}</p>
            </div>
          </div>
          <button
            onClick={() => setCloseModal(true)}
            className="mt-5 flex items-center gap-1.5 px-5 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium active:scale-[0.97]"
          >
            <CheckCircle className="w-4 h-4" />
            Cerrar Caja
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-border flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg dark:text-dark-text">No hay caja abierta</h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-muted">Abre una caja para comenzar a operar</p>
            </div>
          </div>
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium active:scale-[0.97]"
          >
            <PlusCircle className="w-4 h-4" />
            Abrir Caja
          </button>
        </div>
      )}

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

      <div className="bg-white dark:bg-dark-surface rounded-2xl p-5 shadow-sm border border-border/50 dark:border-dark-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold dark:text-dark-text">Pedidos Pagados</h3>
          <span className="bg-altipiqui-green/10 text-altipiqui-green text-xs font-bold px-2.5 py-1 rounded-full">{paidOrders.length}</span>
        </div>
        <div className="space-y-2">
          {paidOrders.slice(0, 20).map(order => (
            <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-bg/50 border border-border/50 dark:border-dark-border/50 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-altipiqui-green-light dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-altipiqui-green" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium dark:text-dark-text truncate">
                    {order.table?.number ? `Mesa ${order.table.number}` : order.orderType === 'DELIVERY' ? 'Delivery' : 'Para Llevar'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-dark-text-muted">{formatCurrency(order.total)} · {formatDateTime(order.updatedAt)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const url = getCustomerReceiptUrl(order.id)
                  setReprintOrder(order)
                  setPreviewUrl(url)
                  setPreviewTitle(`Recibo #${order.id}`)
                  setShowPreview(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-altipiqui-indigo hover:bg-altipiqui-indigo/10 rounded-xl transition-colors flex-shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                Reimprimir
              </button>
            </div>
          ))}
          {paidOrders.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-4">Sin pedidos pagados aún</p>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-1.5 text-sm text-altipiqui-indigo dark:text-altipiqui-indigo-light hover:underline font-medium"
      >
        {showHistory ? 'Ocultar' : 'Ver'} historial de cierres
      </button>

      {showHistory && (
        <div className="space-y-2">
          {history.map((s: any) => (
            <div key={s.id} className="bg-white dark:bg-dark-surface rounded-xl p-4 border border-border/50 dark:border-dark-border/50 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-altipiqui-indigo/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-altipiqui-indigo">{s.user?.name?.charAt(0)}</span>
                </div>
                <span className="font-medium dark:text-dark-text">{s.user?.name}</span>
                <span className="text-gray-400 dark:text-dark-text-muted">—</span>
                <span className="text-gray-600 dark:text-dark-text-muted">{formatCurrency(s.openingAmount)} → {formatCurrency(s.closingAmount || 0)}</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full self-start sm:self-auto ${
                s.status === 'ABIERTA'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>{s.status}</span>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-4">Sin historial</p>
          )}
        </div>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir Caja">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Monto inicial</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Bs.</span>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          <button
            onClick={() => openMutation.mutate()}
            disabled={openMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]"
          >
            {openMutation.isPending ? 'Abriendo...' : 'Confirmar Apertura'}
          </button>
        </div>
      </Modal>

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

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Cerrar Caja">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Monto final en caja</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Bs.</span>
              <input
                type="number"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          <button
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]"
          >
            {closeMutation.isPending ? 'Cerrando...' : 'Confirmar Cierre'}
          </button>
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
                  const url = getCustomerReceiptUrl(paidOrder.id)
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

      <Modal open={!!closeSummary} onClose={() => setCloseSummary(null)} title="Caja Cerrada" size="sm">
        {closeSummary && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-altipiqui-green-light dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-altipiqui-green" />
            </div>
            <p className="text-lg font-heading font-bold dark:text-dark-text">Caja cerrada exitosamente</p>
            <div className="bg-altipiqui-cream dark:bg-dark-bg rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-dark-text-muted">Monto inicial</span>
                <span className="font-bold dark:text-dark-text">{formatCurrency(closeSummary.openingAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-dark-text-muted">Monto final</span>
                <span className="font-bold text-altipiqui-red">{formatCurrency(closeSummary.closingAmount)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border/50 dark:border-dark-border/50">
                <span className="text-gray-500 dark:text-dark-text-muted">Diferencia</span>
                <span className={`font-bold ${closeSummary.closingAmount >= closeSummary.openingAmount ? 'text-altipiqui-green' : 'text-red-500'}`}>
                  {formatCurrency(closeSummary.closingAmount - closeSummary.openingAmount)}
                </span>
              </div>
            </div>
            <button onClick={() => setCloseSummary(null)}
              className="px-6 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 font-medium active:scale-[0.97]">
              Aceptar
            </button>
          </div>
        )}
      </Modal>

      <TicketPreviewModal open={showPreview} url={previewUrl} title={previewTitle} onClose={() => setShowPreview(false)} />
    </div>
  )
}

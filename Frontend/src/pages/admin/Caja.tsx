import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentCaja, openCaja, closeCaja, getCajaHistory } from '../../services/caja.service'
import { getOrders, updateOrderStatus } from '../../services/order.service'
import { getTables } from '../../services/table.service'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { useOrderCreated, useOrderStatusChanged } from '../../hooks/useSocket'
import Modal from '../../components/Modal'
import TableCanvas from '../../components/TableCanvas'
import type { Order } from '../../types'

export default function AdminCaja() {
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [payModal, setPayModal] = useState<Order | null>(null)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [showHistory, setShowHistory] = useState(false)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentCaja'] })
      setCloseModal(false)
      setClosingAmount('')
    }
  })

  const payMutation = useMutation({
    mutationFn: (id: number) => updateOrderStatus(id, 'PAGADO'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); queryClient.invalidateQueries({ queryKey: ['tables'] }); setPayModal(null) }
  })

  const pendingPayment = orders.filter(o => o.status === 'SERVIDO')
  const inProgress = orders.filter(o => ['PENDIENTE', 'EN_COCINA', 'LISTO'].includes(o.status))

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 text-gray-500 dark:text-dark-text-muted">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
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
          </div>
          <button
            onClick={() => setCloseModal(true)}
            className="mt-5 flex items-center gap-1.5 px-5 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium active:scale-[0.97]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cerrar Caja
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-border flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Abrir Caja
          </button>
        </div>
      )}

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
        {payModal && (
          <div className="space-y-4">
            <div className="bg-altipiqui-green-light dark:bg-green-900/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-500 dark:text-dark-text-muted">Mesa {payModal.table?.number}</p>
              <p className="text-3xl font-bold text-altipiqui-green mt-1">{formatCurrency(payModal.total)}</p>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {payModal.items?.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-border/50 dark:border-dark-border/50 last:border-0 dark:text-dark-text">
                  <span>x{item.quantity} {item.dish?.name || item.supply?.name}</span>
                  <span className="font-medium">{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</span>
                </div>
              ))}
            </div>
            <button onClick={() => payMutation.mutate(payModal.id)} disabled={payMutation.isPending}
              className="w-full py-3 bg-altipiqui-green text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-all duration-200 text-lg shadow-lg shadow-altipiqui-green/20 active:scale-[0.97]">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {payMutation.isPending ? 'Procesando...' : 'Confirmar Pago'}
              </span>
            </button>
          </div>
        )}
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
    </div>
  )
}

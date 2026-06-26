import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDailySales, getTopDishes, closeTurno } from '../../services/report.service'
import { formatCurrency, formatDateTime } from '../../utils/format'
import Modal from '../../components/Modal'
import { DollarSign, ShoppingBag, Package, Star, Lock, CheckCircle } from 'lucide-react'

export default function AdminReportes() {
  const [filter, setFilter] = useState('all')
  const [closeResult, setCloseResult] = useState<{ totalSales: number; totalOrders: number; closedCaja?: { openingAmount: number } | null } | null>(null)
  const queryClient = useQueryClient()

  const { data: sales } = useQuery({ queryKey: ['dailySales'], queryFn: getDailySales, refetchInterval: 10000 })
  const { data: topDishes = [] } = useQuery({ queryKey: ['topDishes', filter], queryFn: () => getTopDishes(filter === 'all' ? undefined : filter) })

  const closeMutation = useMutation({
    mutationFn: closeTurno,
    onSuccess: (data: any) => {
      setCloseResult({
        totalSales: data.closure?.totalSales ?? 0,
        totalOrders: data.closure?.totalOrders ?? 0,
        closedCaja: data.closedCaja ?? null,
      })
      queryClient.invalidateQueries({ queryKey: ['dailySales'] })
      queryClient.invalidateQueries({ queryKey: ['topDishes'] })
      queryClient.invalidateQueries({ queryKey: ['currentCaja'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al cerrar turno')
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold dark:text-dark-text">Reportes</h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Estadísticas y cierre de turno</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-altipiqui-red/10 dark:bg-altipiqui-red/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-altipiqui-red" />
            </div>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">Ventas del día</p>
          </div>
          <p className="text-3xl font-bold text-altipiqui-red">{formatCurrency(sales?.totalSales || 0)}</p>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-altipiqui-indigo/10 dark:bg-altipiqui-indigo/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-altipiqui-indigo" />
            </div>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">Pedidos totales</p>
          </div>
          <p className="text-3xl font-bold dark:text-dark-text">{sales?.totalOrders || 0}</p>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-altipiqui-green-light dark:bg-green-900/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-altipiqui-green" />
            </div>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">Ticket promedio</p>
          </div>
          <p className="text-3xl font-bold text-altipiqui-green">{formatCurrency(sales?.avgTicket || 0)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-altipiqui-gold" />
            <h3 className="font-heading font-semibold dark:text-dark-text">Platos más vendidos</h3>
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-border dark:border-dark-border rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text">
            <option value="all">Todos</option>
            <option value="plato">Platos</option>
            <option value="bebida">Bebidas</option>
          </select>
        </div>
        <div className="space-y-1">
          {topDishes.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 hover:bg-altipiqui-cream/50 dark:hover:bg-dark-bg/50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-altipiqui-gold text-white' :
                  i === 1 ? 'bg-gray-300 text-gray-700' :
                  i === 2 ? 'bg-orange-200 text-orange-800' :
                  'bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-dark-text-muted'
                }`}>{i + 1}</span>
                <span className="text-sm dark:text-dark-text">{item.dish?.name}</span>
              </div>
              <span className="text-sm font-semibold text-altipiqui-red">{item.totalQty} vendidos</span>
            </div>
          ))}
          {topDishes.length === 0 && <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-4">Sin ventas hoy</p>}
        </div>
      </div>

      <button
        onClick={() => closeMutation.mutate()}
        disabled={closeMutation.isPending}
        className="flex items-center gap-2 px-6 py-3 bg-altipiqui-brown dark:bg-dark-surface text-white rounded-xl hover:bg-altipiqui-red disabled:opacity-50 transition-all duration-200 shadow-lg font-medium active:scale-[0.97] border border-border/50 dark:border-dark-border/50"
      >
        <Lock className="w-5 h-5" />
        {closeMutation.isPending ? 'Cerrando...' : 'Cerrar Turno'}
      </button>

      <Modal open={!!closeResult} onClose={() => setCloseResult(null)} title="Turno Cerrado" size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-altipiqui-green-light dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-altipiqui-green" />
          </div>
          <p className="text-lg font-heading font-bold dark:text-dark-text">Turno cerrado exitosamente</p>
          {closeResult && (
            <>
              <div className="bg-altipiqui-cream dark:bg-dark-bg rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-dark-text-muted">Total ventas</span>
                  <span className="font-bold text-altipiqui-red">{formatCurrency(closeResult.totalSales)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-dark-text-muted">Pedidos</span>
                  <span className="font-bold dark:text-dark-text">{closeResult.totalOrders}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-dark-text-muted">Ticket promedio</span>
                  <span className="font-bold text-altipiqui-green">
                    {formatCurrency(closeResult.totalOrders > 0 ? closeResult.totalSales / closeResult.totalOrders : 0)}
                  </span>
                </div>
                {closeResult.closedCaja && (
                  <div className="pt-2 mt-2 border-t border-border/50 dark:border-dark-border/50 flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-text-muted">Caja cerrada</span>
                    <span className="font-bold dark:text-dark-text">Monto inicial: {formatCurrency(closeResult.closedCaja.openingAmount)}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setCloseResult(null)}
                className="px-6 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 font-medium active:scale-[0.97]">
                Aceptar
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getDailySales, getTopDishes, closeTurno } from '../../services/report.service'
import { formatCurrency } from '../../utils/format'

export default function AdminReportes() {
  const [filter, setFilter] = useState('all')

  const { data: sales } = useQuery({ queryKey: ['dailySales'], queryFn: getDailySales, refetchInterval: 10000 })
  const { data: topDishes = [] } = useQuery({ queryKey: ['topDishes', filter], queryFn: () => getTopDishes(filter === 'all' ? undefined : filter) })

  const closeMutation = useMutation({
    mutationFn: closeTurno,
    onSuccess: () => alert('Turno cerrado exitosamente'),
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
              <svg className="w-5 h-5 text-altipiqui-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">Ventas del día</p>
          </div>
          <p className="text-3xl font-bold text-altipiqui-red">{formatCurrency(sales?.totalSales || 0)}</p>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-altipiqui-indigo/10 dark:bg-altipiqui-indigo/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-altipiqui-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">Pedidos totales</p>
          </div>
          <p className="text-3xl font-bold dark:text-dark-text">{sales?.totalOrders || 0}</p>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-altipiqui-green-light dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-altipiqui-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">Ticket promedio</p>
          </div>
          <p className="text-3xl font-bold text-altipiqui-green">{formatCurrency(sales?.avgTicket || 0)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-altipiqui-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        {closeMutation.isPending ? 'Cerrando...' : 'Cerrar Turno'}
      </button>
    </div>
  )
}

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
      <h2 className="text-xl font-bold">Reportes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Ventas del día</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(sales?.totalSales || 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Pedidos totales</p>
          <p className="text-3xl font-bold">{sales?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Ticket promedio</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(sales?.avgTicket || 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Platos más vendidos</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
            <option value="all">Todos</option>
            <option value="plato">Platos</option>
            <option value="bebida">Bebidas</option>
          </select>
        </div>
        <div className="space-y-2">
          {topDishes.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <span className="text-sm">{i + 1}. {item.dish?.name}</span>
              <span className="text-sm font-semibold">{item.totalQty} vendidos</span>
            </div>
          ))}
          {topDishes.length === 0 && <p className="text-sm text-gray-400">Sin ventas hoy</p>}
        </div>
      </div>

      <button
        onClick={() => closeMutation.mutate()}
        disabled={closeMutation.isPending}
        className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-50"
      >
        {closeMutation.isPending ? 'Cerrando...' : '🔒 Cerrar Turno'}
      </button>
    </div>
  )
}

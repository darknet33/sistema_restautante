import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTables, updateTableStatus } from '../services/table.service'
import { createOrder, getOrders, updateOrderStatus } from '../services/order.service'
import { getProducts } from '../services/product.service'
import { getDailySales } from '../services/report.service'
import type { Table, Order, Product, OrderItem, User } from '../types'
import { useNavigate } from 'react-router-dom'

interface CajaDashboardProps {
  user: User
  onLogout: () => void
}

export default function CajaDashboard({ user, onLogout }: CajaDashboardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [orderItems, setOrderItems] = useState<Partial<OrderItem>[]>([])
  const [notes, setNotes] = useState('')

  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables })
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => getProducts(undefined, true) })
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders('PENDIENTE') })
  const { data: dailySales } = useQuery({ queryKey: ['dailySales'], queryFn: getDailySales })

  const createOrderMutation = useMutation({
    mutationFn: (data: { tableId: number, items: Partial<OrderItem>[], notes?: string }) =>
      createOrder(data.tableId, data.items, data.notes),
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dailySales'] })
      setSelectedTable(null)
      setOrderItems([])
      setNotes('')
      updateOrderStatusMutation.mutate({ id: newOrder.id, status: 'EN_COCINA' })
    }
  })

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })

  const addItem = (product: Product) => {
    const existing = orderItems.find(item => item.productId === product.id)
    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.productId === product.id ? { ...item, quantity: (item.quantity || 0) + 1 } : item
      ))
    } else {
      setOrderItems([...orderItems, { productId: product.id, quantity: 1, unitPrice: Number(product.price) }])
    }
  }

  const removeItem = (productId: number) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId))
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0), 0)
  }

  const handleCreateOrder = () => {
    if (!selectedTable || orderItems.length === 0) return
    createOrderMutation.mutate({ tableId: selectedTable.id, items: orderItems, notes })
  }

  const handlePayOrder = (order: Order) => {
    updateOrderStatusMutation.mutate({ id: order.id, status: 'PAGADO' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIBRE': return 'bg-green-500'
      case 'OCUPADA': return 'bg-red-500'
      case 'RESERVADA': return 'bg-yellow-500'
      case 'LIMPIEZA': return 'bg-gray-500'
      default: return 'bg-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Caja - {user.name}</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Admin
          </button>
          <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Salir
          </button>
        </div>
      </header>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Mesas</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {tables.map((table: Table) => (
              <button
                key={table.id}
                onClick={() => {
                  setSelectedTable(table)
                  setOrderItems([])
                }}
                className={`p-4 rounded-lg text-white font-bold ${getStatusColor(table.status)} hover:opacity-80`}
              >
                <div className="text-lg">Mesa {table.number}</div>
                <div className="text-sm">{table.status}</div>
              </button>
            ))}
          </div>

          {dailySales && (
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Ventas del Día</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold">${dailySales.totalSales}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pedidos</p>
                  <p className="text-xl font-bold">{dailySales.totalOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ticket Promedio</p>
                  <p className="text-xl font-bold">${dailySales.avgTicket.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          {selectedTable ? (
            <>
              <h3 className="font-semibold mb-4">Mesa {selectedTable.number}</h3>
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Productos</h4>
                <div className="max-h-64 overflow-y-auto">
                  {products.map((product: Product) => (
                    <button
                      key={product.id}
                      onClick={() => addItem(product)}
                      className="w-full text-left p-2 hover:bg-gray-100 border-b flex justify-between"
                    >
                      <span>{product.name}</span>
                      <span className="font-medium">${product.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Pedido</h4>
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <span>{item.quantity}x #{item.productId}</span>
                    <button onClick={() => removeItem(item.productId!)} className="text-red-500">
                      ✕
                    </button>
                  </div>
                ))}
                {orderItems.length > 0 && (
                  <div className="font-bold mt-2">Total: ${calculateTotal().toFixed(2)}</div>
                )}
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones..."
                className="w-full p-2 border rounded mb-4"
                rows={2}
              />

              <button
                onClick={handleCreateOrder}
                disabled={orderItems.length === 0 || createOrderMutation.isPending}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {createOrderMutation.isPending ? 'Creando...' : 'Crear Pedido y Enviar a Cocina'}
              </button>
            </>
          ) : (
            <p className="text-gray-500">Seleccione una mesa</p>
          )}
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Pedidos Pendientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order: Order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between mb-2">
                <span className="font-bold">Pedido #{order.id}</span>
                <span className="text-sm text-gray-600">Mesa {order.table?.number}</span>
              </div>
              <div className="text-sm mb-2">
                {order.items?.map((item, idx) => (
                  <div key={idx}>{item.quantity}x {item.product?.name}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'EN_COCINA' })}
                  className="flex-1 bg-yellow-500 text-white p-1 rounded text-sm"
                >
                  Enviar a Cocina
                </button>
                <button
                  onClick={() => handlePayOrder(order)}
                  className="flex-1 bg-green-500 text-white p-1 rounded text-sm"
                >
                  Pagar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

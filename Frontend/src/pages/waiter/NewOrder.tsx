import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTables } from '../../services/table.service'
import { getDishes } from '../../services/dish.service'
import { getSupplies } from '../../services/supply.service'
import { createOrder } from '../../services/order.service'
import { formatCurrency } from '../../utils/format'
import Modal from '../../components/Modal'
import DishSelector from '../../components/DishSelector'
import SupplySelector from '../../components/SupplySelector'

interface OrderItem {
  dishId?: number
  supplyId?: number
  quantity: number
  notes?: string
}

export default function NewOrder() {
  const [step, setStep] = useState<'table' | 'dishes' | 'supplies' | 'review'>('table')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [selectedDishes, setSelectedDishes] = useState<number[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [supplyItems, setSupplyItems] = useState<Array<{ supplyId: number; quantity: number }>>([])
  const [notes, setNotes] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const queryClient = useQueryClient()

  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables })
  const { data: dishes = [] } = useQuery({ queryKey: ['dishes'], queryFn: () => getDishes(undefined, true) })
  const { data: supplies = [] } = useQuery({ queryKey: ['supplies'], queryFn: () => getSupplies() })

  const freeTables = tables.filter(t => t.status === 'LIBRE')

  const createMutation = useMutation({
    mutationFn: () => createOrder({
      tableId: selectedTable!,
      items: [
        ...orderItems.map(oi => ({ dishId: oi.dishId, quantity: oi.quantity, notes: oi.notes })),
        ...supplyItems.map(si => ({ supplyId: si.supplyId, quantity: si.quantity })),
      ],
      notes: notes || undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'tables'] })
      setShowSuccess(true)
      setSelectedTable(null)
      setSelectedDishes([])
      setOrderItems([])
      setSupplyItems([])
      setNotes('')
      setStep('table')
    }
  })

  const handleDishToggle = (dish: any) => {
    if (selectedDishes.includes(dish.id)) {
      setSelectedDishes(prev => prev.filter(id => id !== dish.id))
      setOrderItems(prev => prev.filter(i => i.dishId !== dish.id))
    } else {
      setSelectedDishes(prev => [...prev, dish.id])
      setOrderItems(prev => [...prev, { dishId: dish.id, quantity: 1 }])
    }
  }

  const handleSupplyToggle = (supply: any) => {
    const exists = supplyItems.find(s => s.supplyId === supply.id)
    if (exists) {
      setSupplyItems(prev => prev.filter(s => s.supplyId !== supply.id))
    } else {
      setSupplyItems(prev => [...prev, { supplyId: supply.id, quantity: 1 }])
    }
  }

  const handleSupplyQty = (supplyId: number, quantity: number) => {
    setSupplyItems(prev => prev.map(s => s.supplyId === supplyId ? { ...s, quantity } : s))
  }

  const handleDishQty = (dishId: number, quantity: number) => {
    setOrderItems(prev => prev.map(i => i.dishId === dishId ? { ...i, quantity } : i))
  }

  const totalItems = orderItems.length + supplyItems.length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">Nuevo Pedido</h2>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['table', 'dishes', 'supplies', 'review'].map((s, i) => (
          <div key={s} className="flex items-center">
            <span className={`px-3 py-1 rounded-full ${step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {['Mesa', 'Platos', 'Extras', 'Revisar'][i]}
            </span>
            {i < 3 && <div className="w-4 h-0.5 bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Table */}
      {step === 'table' && (
        <div>
          <h3 className="font-semibold mb-3">Seleccionar Mesa</h3>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => { setSelectedTable(table.id); setStep('dishes') }}
                disabled={table.status !== 'LIBRE'}
                className={`p-4 rounded-xl text-center transition-all ${
                  table.status === 'LIBRE'
                    ? 'bg-green-100 hover:bg-green-200 text-green-800'
                    : 'bg-red-100 text-red-400 cursor-not-allowed'
                }`}
              >
                <div className="text-2xl font-bold">{table.number}</div>
                <div className="text-xs">{table.status}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Dishes */}
      {step === 'dishes' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Seleccionar Platos</h3>
            <button onClick={() => setStep('supplies')} className="text-sm text-blue-600 hover:underline">
              Siguiente ({selectedDishes.length} seleccionados) →
            </button>
          </div>
          <DishSelector dishes={dishes} selectedIds={selectedDishes} onToggle={handleDishToggle} />
          {selectedDishes.length === 0 && dishes.length === 0 && (
            <p className="text-gray-400 text-sm">No hay platos disponibles</p>
          )}
          {/* Quantity controls for selected */}
          {orderItems.filter(i => i.dishId).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Cantidades:</p>
              {orderItems.map(item => {
                const dish = dishes.find(d => d.id === item.dishId)
                return dish ? (
                  <div key={item.dishId} className="flex items-center gap-3 bg-white rounded-lg p-2 border">
                    <span className="flex-1 text-sm">{dish.name}</span>
                    <button onClick={() => handleDishQty(dish.id, Math.max(1, item.quantity - 1))} className="w-7 h-7 rounded bg-gray-200">−</button>
                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => handleDishQty(dish.id, item.quantity + 1)} className="w-7 h-7 rounded bg-gray-200">+</button>
                  </div>
                ) : null
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Supplies */}
      {step === 'supplies' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Consumibles / Extras</h3>
            <button onClick={() => setStep('review')} className="text-sm text-blue-600 hover:underline">
              Revisar pedido →
            </button>
          </div>
          <SupplySelector supplies={supplies} selected={supplyItems} onToggle={handleSupplyToggle} onQuantityChange={handleSupplyQty} />
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <h3 className="font-semibold mb-2">Resumen del Pedido</h3>
            <p className="text-sm mb-3">Mesa: <strong>{selectedTable}</strong></p>

            {orderItems.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Platos:</p>
                {orderItems.map(item => {
                  const dish = dishes.find(d => d.id === item.dishId)
                  return dish ? (
                    <div key={item.dishId} className="flex justify-between text-sm py-1">
                      <span>x{item.quantity} {dish.name}</span>
                      <span>{formatCurrency(Number(dish.price) * item.quantity)}</span>
                    </div>
                  ) : null
                })}
              </div>
            )}

            {supplyItems.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Consumibles:</p>
                {supplyItems.map(item => {
                  const supply = supplies.find(s => s.id === item.supplyId)
                  return supply ? (
                    <div key={item.supplyId} className="flex justify-between text-sm py-1">
                      <span>x{item.quantity} {supply.name}</span>
                    </div>
                  ) : null
                })}
              </div>
            )}

            {totalItems === 0 && <p className="text-sm text-gray-400">No has agregado productos</p>}

            <div>
              <label className="block text-sm font-medium mb-1">Notas generales</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Ej: sin cebolla, bien cocido..." />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('supplies')} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">← Atrás</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || totalItems === 0}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
            >
              {createMutation.isPending ? 'Enviando...' : '📨 Enviar Pedido a Cocina'}
            </button>
          </div>
        </div>
      )}

      <Modal open={showSuccess} onClose={() => setShowSuccess(false)} title="Pedido Enviado" size="sm">
        <div className="text-center py-4">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg font-semibold">Pedido enviado a cocina</p>
          <p className="text-sm text-gray-500 mt-1">Mesa {selectedTable}</p>
          <button onClick={() => setShowSuccess(false)} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Nuevo Pedido
          </button>
        </div>
      </Modal>
    </div>
  )
}

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

  const StepIndicator = ({ label, active, completed }: { label: string; active: boolean; completed: boolean }) => (
    <div className="flex items-center">
      <div className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition-all duration-200 ${
        active ? 'bg-altipiqui-red text-white shadow-lg shadow-altipiqui-red/20 scale-110' :
        completed ? 'bg-altipiqui-green text-white' : 'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-dark-text-muted'
      }`}>
        {completed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <span>{['M', 'P', 'E', 'R'][['table', 'dishes', 'supplies', 'review'].indexOf(step)]}</span>
        )}
      </div>
      <span className={`text-xs ml-2 font-medium hidden sm:inline ${active ? 'text-altipiqui-red dark:text-altipiqui-red' : 'text-gray-400 dark:text-dark-text-muted'}`}>{label}</span>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold dark:text-dark-text">Nuevo Pedido</h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Crea un pedido para una mesa</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <StepIndicator label="Mesa" active={step === 'table'} completed={step !== 'table' && selectedTable !== null} />
        <div className={`flex-1 h-0.5 ${step !== 'table' && selectedTable !== null ? 'bg-altipiqui-green' : 'bg-gray-200 dark:bg-dark-border'}`} />
        <StepIndicator label="Platos" active={step === 'dishes'} completed={step === 'supplies' || step === 'review'} />
        <div className={`flex-1 h-0.5 ${step === 'supplies' || step === 'review' ? 'bg-altipiqui-green' : 'bg-gray-200 dark:bg-dark-border'}`} />
        <StepIndicator label="Extras" active={step === 'supplies'} completed={step === 'review'} />
        <div className={`flex-1 h-0.5 ${step === 'review' ? 'bg-altipiqui-green' : 'bg-gray-200 dark:bg-dark-border'}`} />
        <StepIndicator label="Revisar" active={step === 'review'} completed={false} />
      </div>

      {/* Step 1: Select Table */}
      {step === 'table' && (
        <div>
          <h3 className="font-heading font-semibold mb-4 dark:text-dark-text">Seleccionar Mesa</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => { setSelectedTable(table.id); setStep('dishes') }}
                disabled={table.status !== 'LIBRE'}
                className={`p-4 rounded-2xl text-center transition-all duration-200 ${
                  table.status === 'LIBRE'
                    ? 'bg-altipiqui-green-light hover:bg-altipiqui-green text-altipiqui-green-dark hover:text-white shadow-sm hover:shadow-lg hover:scale-105'
                    : 'bg-red-50 text-red-300 cursor-not-allowed dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                <div className="text-2xl font-bold">{table.number}</div>
                <div className="text-[10px] mt-1 font-medium">{table.status}</div>
                <div className="text-[10px] opacity-70">{table.seats} as.</div>
              </button>
            ))}
            {tables.length === 0 && (
              <p className="col-span-full text-sm text-gray-400 dark:text-dark-text-muted text-center py-8">No hay mesas disponibles</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Dishes */}
      {step === 'dishes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold dark:text-dark-text">Seleccionar Platos</h3>
            <button onClick={() => setStep('supplies')} className="flex items-center gap-1 text-sm text-altipiqui-red hover:text-altipiqui-red-dark font-medium">
              <span>Siguiente ({selectedDishes.length} seleccionados)</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
          <DishSelector dishes={dishes} selectedIds={selectedDishes} onToggle={handleDishToggle} />
          {selectedDishes.length === 0 && dishes.length === 0 && (
            <p className="text-gray-400 dark:text-dark-text-muted text-sm text-center py-8">No hay platos disponibles</p>
          )}
          {orderItems.filter(i => i.dishId).length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium dark:text-dark-text">Cantidades:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {orderItems.map(item => {
                  const dish = dishes.find(d => d.id === item.dishId)
                  return dish ? (
                    <div key={item.dishId} className="flex items-center gap-3 bg-white dark:bg-dark-surface rounded-xl p-3 border border-border/50 dark:border-dark-border/50">
                      <span className="flex-1 text-sm dark:text-dark-text">{dish.name}</span>
                      <button onClick={() => handleDishQty(dish.id, Math.max(1, item.quantity - 1))} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-border flex items-center justify-center text-sm font-bold text-gray-600 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors">−</button>
                      <span className="font-bold w-6 text-center dark:text-dark-text">{item.quantity}</span>
                      <button onClick={() => handleDishQty(dish.id, item.quantity + 1)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-border flex items-center justify-center text-sm font-bold text-gray-600 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors">+</button>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Supplies */}
      {step === 'supplies' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold dark:text-dark-text">Consumibles / Extras</h3>
            <button onClick={() => setStep('review')} className="flex items-center gap-1 text-sm text-altipiqui-red hover:text-altipiqui-red-dark font-medium">
              <span>Revisar pedido</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
          <SupplySelector supplies={supplies} selected={supplyItems} onToggle={handleSupplyToggle} onQuantityChange={handleSupplyQty} />
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-5 shadow-sm border border-border/50 dark:border-dark-border/50">
            <h3 className="font-heading font-semibold mb-4 dark:text-dark-text">Resumen del Pedido</h3>
            <div className="flex items-center gap-2 mb-4 bg-altipiqui-cream dark:bg-dark-bg rounded-xl p-3">
              <svg className="w-5 h-5 text-altipiqui-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              </svg>
              <p className="text-sm dark:text-dark-text">Mesa: <strong>{selectedTable}</strong></p>
            </div>

            {orderItems.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-dark-text-muted font-medium mb-2 uppercase tracking-wider">Platos</p>
                {orderItems.map(item => {
                  const dish = dishes.find(d => d.id === item.dishId)
                  return dish ? (
                    <div key={item.dishId} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0 dark:text-dark-text">
                      <span>x{item.quantity} {dish.name}</span>
                      <span className="font-medium">{formatCurrency(Number(dish.price) * item.quantity)}</span>
                    </div>
                  ) : null
                })}
              </div>
            )}

            {supplyItems.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-dark-text-muted font-medium mb-2 uppercase tracking-wider">Consumibles</p>
                {supplyItems.map(item => {
                  const supply = supplies.find(s => s.id === item.supplyId)
                  return supply ? (
                    <div key={item.supplyId} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0 dark:text-dark-text">
                      <span>x{item.quantity} {supply.name}</span>
                      <span className="font-medium">{formatCurrency(supply.salePrice * item.quantity)}</span>
                    </div>
                  ) : null
                })}
              </div>
            )}

            <div className="flex justify-between text-base font-bold border-t border-border dark:border-dark-border pt-3 dark:text-dark-text">
              <span>Total</span>
              <span className="text-altipiqui-red">{formatCurrency(
                orderItems.reduce((sum, item) => {
                  const dish = dishes.find(d => d.id === item.dishId)
                  return sum + (dish ? Number(dish.price) * item.quantity : 0)
                }, 0) +
                supplyItems.reduce((sum, item) => {
                  const supply = supplies.find(s => s.id === item.supplyId)
                  return sum + (supply ? Number(supply.salePrice) * item.quantity : 0)
                }, 0)
              )}</span>
            </div>

            {totalItems === 0 && <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-4">No has agregado productos</p>}

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Notas generales</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" rows={2} placeholder="Ej: sin cebolla, bien cocido..." />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('supplies')} className="flex items-center gap-1.5 px-4 py-2.5 border border-border dark:border-dark-border rounded-xl hover:bg-altipiqui-cream dark:hover:bg-dark-bg text-sm dark:text-dark-text transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Atrás
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || totalItems === 0}
              className="flex-1 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-semibold active:scale-[0.97]"
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                {createMutation.isPending ? 'Enviando...' : 'Enviar Pedido a Cocina'}
              </span>
            </button>
          </div>
        </div>
      )}

      <Modal open={showSuccess} onClose={() => setShowSuccess(false)} title="Pedido Enviado" size="sm">
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-altipiqui-green-light dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-altipiqui-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-heading font-bold dark:text-dark-text">Pedido enviado a cocina</p>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">Mesa {selectedTable}</p>
          <button onClick={() => setShowSuccess(false)} className="mt-6 px-6 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 font-medium active:scale-[0.97]">
            Nuevo Pedido
          </button>
        </div>
      </Modal>
    </div>
  )
}

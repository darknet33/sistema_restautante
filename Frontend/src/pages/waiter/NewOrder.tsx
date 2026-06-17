import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTables } from '../../services/table.service'
import { getDishes } from '../../services/dish.service'
import { getSupplies } from '../../services/supply.service'
import { createOrder, getKitchenTicketUrl } from '../../services/order.service'
import { formatCurrency } from '../../utils/format'
import Modal from '../../components/Modal'
import DishSelector from '../../components/DishSelector'
import TicketPreviewModal from '../../components/TicketPreviewModal'
import SupplySelector from '../../components/SupplySelector'
import TableCanvas from '../../components/TableCanvas'
import { ArrowLeft, ArrowRight, Check, CheckCircle, Clock, Printer, Send, ShoppingBag, Tag, Truck, UtensilsCrossed } from 'lucide-react'
import type { OrderType } from '../../types'

interface OrderItem {
  dishId?: number
  supplyId?: number
  quantity: number
  notes?: string
}

type Step = 'type' | 'table' | 'dishes' | 'supplies' | 'review'

const orderTypeMeta: Record<OrderType, { label: string; desc: string }> = {
  PARA_AQUI: { label: 'Comer Aquí', desc: 'Pedido para servir en mesa' },
  PARA_LLEVAR: { label: 'Para Llevar', desc: 'Pedido para recoger' },
  DELIVERY: { label: 'Delivery', desc: 'Pedido con envío a domicilio' },
}

export default function NewOrder() {
  const [step, setStep] = useState<Step>('type')
  const [orderType, setOrderType] = useState<OrderType | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [selectedDishes, setSelectedDishes] = useState<number[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [supplyItems, setSupplyItems] = useState<Array<{ supplyId: number; quantity: number }>>([])
  const [notes, setNotes] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables })
  const { data: dishes = [] } = useQuery({ queryKey: ['dishes'], queryFn: () => getDishes(undefined, true) })
  const { data: supplies = [] } = useQuery({ queryKey: ['supplies'], queryFn: () => getSupplies() })

  const resetState = () => {
    setOrderType(null)
    setSelectedTable(null)
    setSelectedDishes([])
    setOrderItems([])
    setSupplyItems([])
    setNotes('')
    setDeliveryAddress('')
    setDeliveryPhone('')
    setStep('type')
  }

  const createMutation = useMutation({
    mutationFn: () => createOrder({
      orderType: orderType!,
      tableId: orderType === 'PARA_AQUI' ? selectedTable! : undefined,
      items: [
        ...orderItems.map(oi => ({ dishId: oi.dishId, quantity: oi.quantity, notes: oi.notes })),
        ...supplyItems.map(si => ({ supplyId: si.supplyId, quantity: si.quantity })),
      ],
      notes: notes || undefined,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
      deliveryPhone: orderType === 'DELIVERY' ? deliveryPhone : undefined,
    }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setCreatedOrderId(order.id)
      setShowSuccess(true)
      resetState()
    }
  })

  const handleSelectType = (type: OrderType) => {
    setOrderType(type)
    if (type === 'PARA_AQUI') {
      setStep('table')
    } else {
      setStep('dishes')
    }
  }

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

  const handleBack = () => {
    if (step === 'dishes') {
      setStep(orderType === 'PARA_AQUI' ? 'table' : 'type')
    } else if (step === 'supplies') {
      setStep('dishes')
    } else if (step === 'review') {
      setStep('supplies')
    }
  }

  const stepLetters: Record<Step, string> = {
    type: 'T',
    table: 'M',
    dishes: 'P',
    supplies: 'E',
    review: 'R',
  }

  const stepLabels: Record<Step, string> = {
    type: 'Tipo',
    table: 'Mesa',
    dishes: 'Platos',
    supplies: 'Extras',
    review: 'Revisar',
  }

  const stepOrder: Step[] = ['type', 'table', 'dishes', 'supplies', 'review']

  const currentStepIndex = stepOrder.indexOf(step)
  const stepCompleted = (s: Step) => {
    if (s === 'type') return orderType !== null
    if (s === 'table') return step !== 'type' && step !== 'table' && (orderType !== 'PARA_AQUI' || selectedTable !== null)
    if (s === 'dishes') return step === 'supplies' || step === 'review'
    if (s === 'supplies') return step === 'review'
    return false
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold dark:text-dark-text">Nuevo Pedido</h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Crea un pedido nuevo</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepOrder.map((s, i) => (
          <Fragment key={s}>
            {i > 0 && (
              <div className={`flex-1 h-0.5 ${stepCompleted(s) ? 'bg-altipiqui-green' : 'bg-gray-200 dark:bg-dark-border'}`} />
            )}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition-all duration-200 ${
                s === step ? 'bg-altipiqui-red text-white shadow-lg shadow-altipiqui-red/20 scale-110' :
                stepCompleted(s) ? 'bg-altipiqui-green text-white' : 'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-dark-text-muted'
              }`}>
                {stepCompleted(s) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{stepLetters[s]}</span>
                )}
              </div>
              <span className={`text-xs ml-2 font-medium hidden sm:inline ${s === step ? 'text-altipiqui-red' : 'text-gray-400 dark:text-dark-text-muted'}`}>
                {stepLabels[s]}
              </span>
            </div>
          </Fragment>
        ))}
      </div>

      {/* Step 0: Select Order Type */}
      {step === 'type' && (
        <div>
          <h3 className="font-heading font-semibold mb-4 dark:text-dark-text">Tipo de Pedido</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.entries(orderTypeMeta) as [OrderType, typeof orderTypeMeta['PARA_AQUI']][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => handleSelectType(type)}
                className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-border/50 dark:border-dark-border/50 hover:border-altipiqui-red/50 hover:shadow-md transition-all duration-200 text-left group active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-altipiqui-red/10 dark:bg-altipiqui-red/20 flex items-center justify-center mb-4 group-hover:bg-altipiqui-red/20 dark:group-hover:bg-altipiqui-red/30 transition-colors">
                  {type === 'PARA_AQUI' && <UtensilsCrossed className="w-6 h-6 text-altipiqui-red" />}
                  {type === 'PARA_LLEVAR' && <ShoppingBag className="w-6 h-6 text-altipiqui-red" />}
                  {type === 'DELIVERY' && <Truck className="w-6 h-6 text-altipiqui-red" />}
                </div>
                <h4 className="font-heading font-bold text-lg dark:text-dark-text mb-1">{meta.label}</h4>
                <p className="text-sm text-gray-500 dark:text-dark-text-muted">{meta.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Select Table (only for PARA_AQUI) */}
      {step === 'table' && (
        <div>
          <h3 className="font-heading font-semibold mb-4 dark:text-dark-text">Seleccionar Mesa</h3>
          <TableCanvas
            tables={tables}
            onTableClick={(table) => {
              if (table.status === 'LIBRE') {
                setSelectedTable(table.id)
                setStep('dishes')
              }
            }}
          />
          {tables.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-8">No hay mesas disponibles</p>
          )}
          {tables.length > 0 && (
            <button onClick={() => setStep('type')} className="mt-4 flex items-center gap-1.5 px-3 py-1.5 border border-border dark:border-dark-border rounded-xl hover:bg-altipiqui-cream dark:hover:bg-dark-bg text-sm dark:text-dark-text transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Cambiar tipo de pedido
            </button>
          )}
        </div>
      )}

      {/* Step 2: Select Dishes */}
      {step === 'dishes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={handleBack} className="flex items-center gap-1.5 px-3 py-1.5 border border-border dark:border-dark-border rounded-xl hover:bg-altipiqui-cream dark:hover:bg-dark-bg text-sm dark:text-dark-text transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Atrás
              </button>
              <h3 className="font-heading font-semibold dark:text-dark-text">Seleccionar Platos</h3>
            </div>
            <button onClick={() => setStep('supplies')} className="flex items-center gap-1 text-sm text-altipiqui-red hover:text-altipiqui-red-dark font-medium">
              <span>Siguiente ({selectedDishes.length} seleccionados)</span>
              <ArrowRight className="w-4 h-4" />
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
                      <button onClick={() => handleDishQty(dish.id, Math.max(1, item.quantity - 1))} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-border flex items-center justify-center text-sm font-bold text-gray-600 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors">&minus;</button>
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
            <div className="flex items-center gap-2">
              <button onClick={handleBack} className="flex items-center gap-1.5 px-3 py-1.5 border border-border dark:border-dark-border rounded-xl hover:bg-altipiqui-cream dark:hover:bg-dark-bg text-sm dark:text-dark-text transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Atrás
              </button>
              <h3 className="font-heading font-semibold dark:text-dark-text">Consumibles / Extras</h3>
            </div>
            <button onClick={() => setStep('review')} className="flex items-center gap-1 text-sm text-altipiqui-red hover:text-altipiqui-red-dark font-medium">
              <span>Revisar pedido</span>
              <ArrowRight className="w-4 h-4" />
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
              {orderType === 'PARA_LLEVAR' && <ShoppingBag className="w-5 h-5 text-altipiqui-red" />}
              {orderType === 'DELIVERY' && <Clock className="w-5 h-5 text-altipiqui-red" />}
              {orderType === 'PARA_AQUI' && <Tag className="w-5 h-5 text-altipiqui-red" />}
              <p className="text-sm dark:text-dark-text">
                <strong>{orderTypeMeta[orderType!]?.label}</strong>
                {orderType === 'PARA_AQUI' && selectedTable && <> &middot; Mesa: <strong>{selectedTable}</strong></>}
              </p>
            </div>

            {orderType === 'DELIVERY' && deliveryAddress && (
              <div className="mb-4 bg-altipiqui-cream dark:bg-dark-bg rounded-xl p-3 text-sm dark:text-dark-text">
                <p><span className="font-medium">Dirección:</span> {deliveryAddress}</p>
                <p><span className="font-medium">Teléfono:</span> {deliveryPhone}</p>
              </div>
            )}

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

          {orderType === 'DELIVERY' && (
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-5 shadow-sm border border-border/50 dark:border-dark-border/50">
              <h4 className="font-heading font-semibold mb-3 dark:text-dark-text">Información de Delivery</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Dirección de entrega *</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text"
                    placeholder="Calle, Nro, Zona..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Teléfono de contacto *</label>
                  <input
                    type="tel"
                    value={deliveryPhone}
                    onChange={e => setDeliveryPhone(e.target.value)}
                    className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text"
                    placeholder="Ej: 71234567"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleBack} className="flex items-center gap-1.5 px-4 py-2.5 border border-border dark:border-dark-border rounded-xl hover:bg-altipiqui-cream dark:hover:bg-dark-bg text-sm dark:text-dark-text transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || totalItems === 0 || (orderType === 'DELIVERY' && (!deliveryAddress || !deliveryPhone))}
              className="flex-1 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-semibold active:scale-[0.97]"
            >
              <span className="flex items-center justify-center gap-1.5">
                <Send className="w-4 h-4" />
                {createMutation.isPending ? 'Enviando...' : 'Enviar Pedido a Cocina'}
              </span>
            </button>
          </div>
        </div>
      )}

      <Modal open={showSuccess} onClose={() => setShowSuccess(false)} title="Pedido Enviado" size="sm">
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-altipiqui-green-light dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-altipiqui-green" />
          </div>
          <p className="text-lg font-heading font-bold dark:text-dark-text">Pedido enviado a cocina</p>
          {createdOrderId && (
            <p className="text-sm dark:text-dark-text-muted mt-1">Orden #{createdOrderId}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">
            {orderType && orderTypeMeta[orderType]?.label}
          </p>
          {createdOrderId && (
            <button
              onClick={async () => {
                const url = await getKitchenTicketUrl(createdOrderId)
                setPreviewUrl(url)
                setPreviewTitle('Ticket Cocina')
                setShowPreview(true)
              }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 border-2 border-altipiqui-red text-altipiqui-red rounded-xl hover:bg-altipiqui-red hover:text-white transition-all duration-200 font-medium text-sm active:scale-[0.97]"
            >
              <Printer className="w-4 h-4" />
              Ver Ticket Cocina
            </button>
          )}
          <button onClick={() => setShowSuccess(false)} className="mt-3 px-6 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 font-medium active:scale-[0.97]">
            Nuevo Pedido
          </button>
        </div>
      </Modal>

      <TicketPreviewModal open={showPreview} url={previewUrl} title={previewTitle} onClose={() => { setShowPreview(false); URL.revokeObjectURL(previewUrl) }} />
    </div>
  )
}

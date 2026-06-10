import { formatCurrency } from '../utils/format'
import type { Supply } from '../types'

interface SupplySelectorProps {
  supplies: Supply[]
  selected: Array<{ supplyId: number; quantity: number }>
  onToggle: (supply: Supply) => void
  onQuantityChange: (supplyId: number, quantity: number) => void
}

export default function SupplySelector({ supplies, selected, onToggle, onQuantityChange }: SupplySelectorProps) {
  const getQty = (id: number) => selected.find(s => s.supplyId === id)?.quantity || 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {supplies.map(supply => {
        const qty = getQty(supply.id)
        return (
          <div
            key={supply.id}
            className={`rounded-2xl p-4 border transition-all duration-200 ${
              qty > 0
                ? 'ring-2 ring-altipiqui-indigo bg-altipiqui-indigo/5 dark:bg-altipiqui-indigo/10 border-altipiqui-indigo/30 shadow-lg shadow-altipiqui-indigo/10'
                : 'bg-white dark:bg-dark-surface border-border dark:border-dark-border dark:text-dark-text hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-sm dark:text-dark-text">{supply.name}</p>
              <button
                onClick={() => onToggle(supply)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  qty > 0
                    ? 'bg-altipiqui-red/10 text-altipiqui-red hover:bg-altipiqui-red/20'
                    : 'bg-altipiqui-indigo/10 text-altipiqui-indigo hover:bg-altipiqui-indigo/20 dark:text-altipiqui-indigo-light'
                }`}
              >
                {qty > 0 ? 'Quitar' : 'Agregar'}
              </button>
            </div>
            <p className="text-xs text-altipiqui-green font-semibold">{formatCurrency(supply.salePrice)}</p>
            <p className="text-xs text-gray-400 dark:text-dark-text-muted">{supply.unit}</p>
            {qty > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onQuantityChange(supply.id, Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-border flex items-center justify-center text-sm font-bold text-gray-600 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors"
                  >−</button>
                  <span className="text-sm font-bold w-6 text-center dark:text-dark-text">{qty}</span>
                  <button
                    onClick={() => onQuantityChange(supply.id, qty + 1)}
                    className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-border flex items-center justify-center text-sm font-bold text-gray-600 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors"
                  >+</button>
                </div>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted text-right">Subtotal: {formatCurrency(supply.salePrice * qty)}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

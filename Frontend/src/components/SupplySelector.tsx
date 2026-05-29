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
            className={`rounded-xl p-3 border transition-all ${
              qty > 0 ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm">{supply.name}</p>
              <button
                onClick={() => onToggle(supply)}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  qty > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}
              >
                {qty > 0 ? 'Quitar' : 'Agregar'}
              </button>
            </div>
            <p className="text-xs text-gray-500">{supply.unit}</p>
            {qty > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onQuantityChange(supply.id, Math.max(1, qty - 1))}
                  className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center text-sm font-bold"
                >−</button>
                <span className="text-sm font-bold w-6 text-center">{qty}</span>
                <button
                  onClick={() => onQuantityChange(supply.id, qty + 1)}
                  className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center text-sm font-bold"
                >+</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

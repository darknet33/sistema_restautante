import { AlertCircle, Check } from 'lucide-react'
import { formatCurrency } from '../utils/format'
import type { Dish } from '../types'

interface DishSelectorProps {
  dishes: Dish[]
  selectedIds: number[]
  onToggle: (dish: Dish) => void
}

export default function DishSelector({ dishes, selectedIds, onToggle }: DishSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {dishes.map(dish => {
        const selected = selectedIds.includes(dish.id)
        return (
          <button
            key={dish.id}
            onClick={() => onToggle(dish)}
            className={`relative rounded-2xl p-3 text-left transition-all duration-200 ${
              selected
                ? 'ring-2 ring-altipiqui-red bg-altipiqui-red/5 dark:bg-altipiqui-red/10 shadow-lg shadow-altipiqui-red/10'
                : 'bg-white dark:bg-dark-surface hover:shadow-md border border-border dark:border-dark-border dark:text-dark-text'
            }`}
          >
            {dish.imageUrl && (
              <div className="relative mb-2 overflow-hidden rounded-xl">
                <img src={dish.imageUrl} alt="" className="w-full h-20 object-cover rounded-xl" />
              </div>
            )}
            {!dish.imageUrl && (
              <div className="w-full h-16 bg-altipiqui-cream dark:bg-dark-bg rounded-xl mb-2 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <p className="font-medium text-sm dark:text-dark-text">{dish.name}</p>
            <p className="text-altipiqui-red font-bold text-sm mt-1">{formatCurrency(dish.price)}</p>
            {selected && (
              <span className="absolute top-3 right-3 bg-altipiqui-red text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg shadow-altipiqui-red/30">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

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
            className={`relative rounded-xl p-3 text-left transition-all ${
              selected
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'bg-white hover:shadow-md border border-gray-200'
            }`}
          >
            {dish.imageUrl && (
              <img src={dish.imageUrl} alt="" className="w-full h-20 object-cover rounded-lg mb-2" />
            )}
            <p className="font-medium text-sm">{dish.name}</p>
            <p className="text-blue-600 font-bold text-sm mt-1">{formatCurrency(dish.price)}</p>
            {selected && (
              <span className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✓</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

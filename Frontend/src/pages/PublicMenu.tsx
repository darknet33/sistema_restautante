import { Loader2, AlertCircle, Image } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getMenu } from '../services/menu.service'
import { formatCurrency } from '../utils/format'
import type { Dish } from '../types'

const categoryColors: Record<string, { bg: string; dot: string }> = {
  default: { bg: 'bg-altipiqui-cream', dot: 'bg-altipiqui-red' },
}

function groupByCategory(dishes: Dish[]): Array<{ category: string; items: Dish[] }> {
  const map = new Map<string, Dish[]>()
  dishes.forEach(d => {
    const key = d.category?.name || 'Otros'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(d)
  })
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
}

export default function PublicMenu() {
  const { data: dishes = [], isLoading } = useQuery({
    queryKey: ['public-menu'],
    queryFn: getMenu,
    refetchInterval: 30000,
  })

  const groups = groupByCategory(dishes)

  return (
    <div className="min-h-screen bg-altipiqui-cream">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-br from-altipiqui-red via-altipiqui-red-dark to-altipiqui-indigo-dark overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-5 ring-2 ring-white/20">
            <img src="/logo.png" alt="ALTIPIQUI" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-2">
            ALTIPIQUI
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
            Restaurante de Comida Andina — Sabor que manda
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-white/50 text-xs">
            <span className="w-8 h-px bg-white/20" />
            <span>Nuestro Menú</span>
            <span className="w-8 h-px bg-white/20" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-altipiqui-cream rounded-t-[24px]" />
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="animate-spin w-8 h-8 text-altipiqui-red" />
            <p className="text-sm">Cargando menú...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && dishes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 px-4">
          <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">Menú no disponible</p>
          <p className="text-sm mt-1">Pronto tendremos novedades para ti</p>
        </div>
      )}

      {/* Menu Content */}
      {!isLoading && dishes.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-16 -mt-2">
          {groups.map(group => (
            <section key={group.category} className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-border" />
                <h2 className="font-heading font-bold text-xl sm:text-2xl text-altipiqui-brown dark:text-dark-text">
                  {group.category}
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map(dish => (
                  <div
                    key={dish.id}
                    className="group bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative h-40 sm:h-44 overflow-hidden bg-altipiqui-cream">
                      {dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-heading font-bold text-base dark:text-dark-text group-hover:text-altipiqui-red transition-colors">
                        {dish.name}
                      </h3>
                      {dish.description && (
                        <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1 leading-relaxed line-clamp-2">
                          {dish.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <span className="text-lg font-bold text-altipiqui-red">
                          {formatCurrency(dish.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-border/50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
            <span className="font-heading font-bold text-altipiqui-red">ALTIPIQUI</span>
          </div>
          <p className="text-xs text-gray-400">
            Restaurante de Comida Andina — Sabores tradicionales bolivianos
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Escanea el código QR para ver el menú desde tu celular
          </p>
        </div>
      </footer>
    </div>
  )
}

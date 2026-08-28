import { Loader2, AlertCircle, Phone } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getMenu } from '../services/menu.service'
import { formatCurrency, uploadUrl } from '../utils/format'
import type { Dish } from '../types'

function groupByCategory(dishes: Dish[]): Array<{ category: string; items: Dish[] }> {
  const map = new Map<string, Dish[]>()
  dishes.forEach(d => {
    const key = d.category?.name || 'Otros'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(d)
  })
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
}

const WHATSAPP_NUMBER = '59167114647'
const WHATSAPP_MSG = encodeURIComponent('Hola! Quisiera hacer un pedido')
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`

export default function PublicMenu() {
  const { data: dishes = [], isLoading } = useQuery({
    queryKey: ['public-menu'],
    queryFn: getMenu,
    refetchInterval: 30000,
  })

  const groups = groupByCategory(dishes)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#e9e5dc' }}>
      <div className="flex flex-1 lg:flex-row flex-col min-h-screen">

        {/* =============================
            COLUMNA IZQUIERDA - SIDEBAR
        ============================== */}
        <aside
          className="w-full lg:w-[32%] flex flex-col items-center py-8 px-5 relative"
          style={{
            background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05), transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.03), transparent 30%), #111',
          }}
        >
          {/* Logo */}
          <div className="w-[110px] h-[110px] rounded-full border-[3px] border-[#d6a73c] bg-[#222] flex items-center justify-center mb-9 overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="ALTIPIQUI" className="w-full h-full object-cover" />
          </div>

          {/* Platos por categoría */}
          <div className="w-full flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin">
            {groups.map(group => (
              <div key={group.category}>
                {/* Encabezado de categoría */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1" style={{ borderColor: '#d6a73c', borderTop: '2px dashed #d6a73c' }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 whitespace-nowrap">
                    {group.category}
                  </span>
                  <div className="h-px flex-1" style={{ borderColor: '#d6a73c', borderTop: '2px dashed #d6a73c' }} />
                </div>

                {/* Lista de platos */}
                <div className="space-y-4">
                  {group.items.map((dish, i) => (
                    <div key={dish.id} className="flex items-center gap-3">
                      {/* Imagen circular */}
                      <div
                        className="w-[70px] h-[70px] rounded-full overflow-hidden flex-shrink-0"
                        style={{
                          border: '3px solid #d6a73c',
                          outline: '2px solid white',
                          background: '#333',
                          boxShadow: '0 6px 16px rgba(0,0,0,.4)',
                        }}
                      >
                        {dish.imageUrl ? (
                          <img
                            src={uploadUrl(dish.imageUrl)}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                        )}
                      </div>

                      {/* Datos del plato */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-sm text-white leading-tight">
                          {dish.name}
                        </h3>
                        {dish.description && (
                          <p className="text-[10px] text-white/50 mt-0.5 leading-snug line-clamp-2">
                            {dish.description}
                          </p>
                        )}
                        <span className="text-sm font-bold mt-0.5 inline-block" style={{ color: '#d6a73c' }}>
                          {formatCurrency(dish.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* =============================
            COLUMNA DERECHA - CONTENIDO
        ============================== */}
        <main
          className="flex-1 flex flex-col min-h-screen relative"
          style={{
            background: 'radial-gradient(circle at 10% 20%, rgba(0,0,0,.04), transparent 20%), radial-gradient(circle at 80% 70%, rgba(0,0,0,.03), transparent 25%), #f2ede3',
          }}
        >
          {/* Header con logo grande */}
          <section className="pt-9 pb-4 text-center px-7">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="ALTIPIQUI" className="w-[140px] h-[140px] object-contain drop-shadow-lg" />
            </div>
          </section>

          {/* Plato principal */}
          {dishes.length > 0 && dishes[0].imageUrl && (
            <section className="w-[86%] mx-auto mt-2">
              <img
                src={uploadUrl(dishes[0].imageUrl)}
                alt={dishes[0].name}
                className="w-full h-[330px] object-cover rounded-lg"
                style={{ boxShadow: '0 15px 30px rgba(0,0,0,.18)' }}
              />
            </section>
          )}

          {/* Sello decorativo dorado */}
          <div
            className="w-[85px] h-[85px] bg-[#d6a73c] rounded-full flex items-center justify-center z-10 mx-auto -mt-5"
            style={{
              border: '5px solid #f2ede3',
              outline: '2px solid #222',
            }}
          >
            <span className="text-[35px] text-[#222]">✦</span>
          </div>

          {/* Plato secundario */}
          {dishes.length > 1 && dishes[1].imageUrl && (
            <section className="w-[86%] mx-auto mt-14 mb-9">
              <img
                src={uploadUrl(dishes[1].imageUrl)}
                alt={dishes[1].name}
                className="w-full h-[260px] object-cover rounded-lg"
                style={{ boxShadow: '0 15px 30px rgba(0,0,0,.18)' }}
              />
            </section>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="animate-spin w-8 h-8" style={{ color: '#d6a73c' }} />
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

          {/* Franja dorada inferior */}
          <div className="h-[45px] w-full mt-auto" style={{ background: '#d6a73c' }} />
        </main>
      </div>

      {/* =============================
          FOOTER
      ============================== */}
      <footer className="w-full py-8" style={{ background: '#111' }}>
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="ALTIPIQUI" className="w-7 h-7 object-contain" />
            <span className="font-heading font-bold text-lg" style={{ color: '#d6a73c' }}>
              ALTIPIQUI
            </span>
          </div>

          <p className="text-white/90 font-medium text-sm">
            El Sabor que Manda
          </p>

          <p className="text-white/60 text-xs">
            Ubicación: Calle 1 Villa Bolivar "A"
          </p>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ background: '#25D366' }}
          >
            <Phone className="w-4 h-4" />
            Pedidos al 591 671 14647
          </a>

          <p className="text-white/30 text-[10px] mt-4">
            © 2026 ALTIPIQUI — Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}

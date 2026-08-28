import { Phone } from 'lucide-react'

const WHATSAPP_NUMBER = '59167114647'
const WHATSAPP_MSG = encodeURIComponent('Hola! Quisiera hacer un pedido')
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`

const comingSoon = [
  { name: 'Salteña', desc: 'Empanada jugosa al estilo paceño' },
  { name: 'Silpancho', desc: 'Plato típico cochabambino con arroz y ensalada' },
  { name: 'Fricase', desc: 'Sopa espesa de cerdo con chuño y mote' },
  { name: 'Chairo', desc: 'Sopa altiplánica de carne y verduras' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#e9e5dc' }}>

      {/* Hero */}
      <header
        className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-20"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05), transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.03), transparent 30%), #111',
        }}
      >
        <div className="mb-6">
          <img src="/logo.png" alt="ALTIPIQUI" className="w-[160px] h-[160px] object-contain mx-auto drop-shadow-2xl" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-2" style={{ color: '#d6a73c' }}>
          ALTIPIQUI
        </h1>
        <p className="text-white/70 text-sm sm:text-base mb-8">
          Restaurante de Comida Andina — Sabor que manda
        </p>

        <a
          href="#/menu"
          className="inline-block px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ background: '#d6a73c', color: '#111' }}
        >
          Ver Menú
        </a>
      </header>

      {/* Próximamente */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="h-px flex-1 max-w-[80px]" style={{ background: '#d6a73c' }} />
            <h2 className="font-heading font-bold text-2xl sm:text-3xl" style={{ color: '#5D4037' }}>
              Próximamente
            </h2>
            <span className="h-px flex-1 max-w-[80px]" style={{ background: '#d6a73c' }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {comingSoon.map(item => (
              <div
                key={item.name}
                className="bg-white rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-md"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: '#d6a73c' }}
                  />
                  <h3 className="font-heading font-bold text-lg" style={{ color: '#111' }}>
                    {item.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 ml-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8" style={{ background: '#111' }}>
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="ALTIPIQUI" className="w-7 h-7 object-contain" />
            <span className="font-heading font-bold text-lg" style={{ color: '#d6a73c' }}>
              ALTIPIQUI
            </span>
          </div>
          <p className="text-white/90 font-medium text-sm">El Sabor que Manda</p>
          <p className="text-white/60 text-xs">Ubicación: Calle 1 Villa Bolivar "A"</p>
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

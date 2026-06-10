import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDishes, updateDish } from '../../services/dish.service'
import { useState } from 'react'
import { getMenu, generateQR } from '../../services/menu.service'
import { formatCurrency } from '../../utils/format'
import Modal from '../../components/Modal'

export default function AdminMenu() {
  const [qrData, setQrData] = useState<{ qrDataUrl: string; url: string } | null>(null)
  const [showQR, setShowQR] = useState(false)
  const queryClient = useQueryClient()

  const { data: dishes = [] } = useQuery({ queryKey: ['dishes'], queryFn: () => getDishes() })

  const toggleMenuMutation = useMutation({
    mutationFn: ({ id, isMenu }: { id: number; isMenu: boolean }) => {
      const form = new FormData()
      form.append('isMenu', String(isMenu))
      return updateDish(id, form)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dishes'] })
  })

  const qrMutation = useMutation({
    mutationFn: generateQR,
    onSuccess: (data) => { setQrData(data); setShowQR(true) }
  })

  const menuDishes = dishes.filter(d => d.isMenu && d.isAvailable)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Menú Público</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Gestiona qué platos se muestran en el menú QR</p>
        </div>
        <button
          onClick={() => qrMutation.mutate()}
          disabled={qrMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-indigo text-white rounded-xl hover:bg-altipiqui-indigo-dark transition-all duration-200 text-sm font-medium active:scale-[0.97]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h.75" />
          </svg>
          {qrMutation.isPending ? 'Generando...' : 'Generar QR'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-altipiqui-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            Activa el interruptor para mostrar un plato en el menú público. Los clientes podrán ver los platos marcados.
          </p>
        </div>
        <div className="space-y-2">
          {dishes.map(dish => (
            <div key={dish.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-altipiqui-cream/50 dark:hover:bg-dark-bg/50 border border-border/50 dark:border-dark-border/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {dish.imageUrl ? (
                  <img src={dish.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-altipiqui-cream dark:bg-dark-bg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm dark:text-dark-text truncate">{dish.name}</p>
                  <p className="text-sm text-gray-500 dark:text-dark-text-muted">{formatCurrency(dish.price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  dish.isAvailable
                    ? 'bg-altipiqui-green-light text-altipiqui-green dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {dish.isAvailable ? 'Disponible' : 'No disponible'}
                </span>
                <button
                  onClick={() => toggleMenuMutation.mutate({ id: dish.id, isMenu: !dish.isMenu })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${dish.isMenu ? 'bg-altipiqui-red' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${dish.isMenu ? 'translate-x-5.5 left-[2px]' : 'translate-x-0.5 left-[2px]'}`} />
                </button>
              </div>
            </div>
          ))}
          {dishes.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-4">No hay platos registrados</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-altipiqui-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.25a1.444 1.444 0 000 1.5 2.045 2.045 0 003.533 1.03 2.045 2.045 0 003.533-1.03 2.045 2.045 0 003.533 1.03 2.045 2.045 0 003.533-1.03 1.444 1.444 0 000-1.5 2.045 2.045 0 00-3.533-1.03 2.045 2.045 0 00-3.533 1.03 2.045 2.045 0 00-3.533-1.03 2.045 2.045 0 00-3.533 1.03z" />
          </svg>
          <h3 className="font-heading font-semibold dark:text-dark-text">Vista previa del menú ({menuDishes.length} platos)</h3>
        </div>
        {menuDishes.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-6">Activa platos como menú para ver la vista previa</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {menuDishes.map(dish => (
              <div key={dish.id} className="rounded-xl border border-border/50 dark:border-dark-border/50 overflow-hidden">
                {dish.imageUrl ? (
                  <img src={dish.imageUrl} alt="" className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-altipiqui-cream dark:bg-dark-bg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  </div>
                )}
                <div className="p-2.5">
                  <p className="font-medium text-sm dark:text-dark-text truncate">{dish.name}</p>
                  <p className="text-altipiqui-red font-bold text-sm">{formatCurrency(dish.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showQR} onClose={() => setShowQR(false)} title="Código QR del Menú" size="sm">
        {qrData && (
          <div className="text-center space-y-4">
            <div className="bg-white rounded-2xl p-4 inline-block mx-auto shadow-sm">
              <img src={qrData.qrDataUrl} alt="QR Menú" className="w-48 h-48 mx-auto" />
            </div>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted break-all bg-altipiqui-cream dark:bg-dark-bg rounded-xl p-3">{qrData.url}</p>
            <a href={qrData.qrDataUrl} download="menu-qr.png"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Descargar QR
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}

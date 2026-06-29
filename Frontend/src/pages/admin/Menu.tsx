import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDishes, updateDish } from '../../services/dish.service'
import { useState } from 'react'
import { getMenu, generateQR } from '../../services/menu.service'
import { formatCurrency, uploadUrl } from '../../utils/format'
import Modal from '../../components/Modal'
import { Layout, Info, Image, Sparkles, Download } from 'lucide-react'

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
          <Layout className="w-4 h-4" />
          {qrMutation.isPending ? 'Generando...' : 'Generar QR'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-altipiqui-gold" />
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            Activa el interruptor para mostrar un plato en el menú público. Los clientes podrán ver los platos marcados.
          </p>
        </div>
        <div className="space-y-2">
          {dishes.map(dish => (
            <div key={dish.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-altipiqui-cream/50 dark:hover:bg-dark-bg/50 border border-border/50 dark:border-dark-border/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {dish.imageUrl ? (
                  <img src={uploadUrl(dish.imageUrl)} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-altipiqui-cream dark:bg-dark-bg flex items-center justify-center flex-shrink-0">
                    <Image className="w-5 h-5 text-gray-400" />
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
          <Sparkles className="w-5 h-5 text-altipiqui-green" />
          <h3 className="font-heading font-semibold dark:text-dark-text">Vista previa del menú ({menuDishes.length} platos)</h3>
        </div>
        {menuDishes.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-dark-text-muted text-center py-6">Activa platos como menú para ver la vista previa</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {menuDishes.map(dish => (
              <div key={dish.id} className="rounded-xl border border-border/50 dark:border-dark-border/50 overflow-hidden">
                {dish.imageUrl ? (
                  <img src={uploadUrl(dish.imageUrl)} alt="" className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-altipiqui-cream dark:bg-dark-bg flex items-center justify-center">
                    <Image className="w-6 h-6 text-gray-300" />
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
              <Download className="w-4 h-4" />
              Descargar QR
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}

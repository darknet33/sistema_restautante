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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Menú Público</h2>
        <button onClick={() => qrMutation.mutate()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          {qrMutation.isPending ? 'Generando...' : '📱 Generar QR'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="text-sm text-gray-500 mb-4">
          Activa el interruptor para mostrar un plato en el menú público. Los clientes podrán ver los platos marcados.
        </p>
        <div className="space-y-2">
          {dishes.map(dish => (
            <div key={dish.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border">
              <div className="flex items-center gap-3">
                {dish.imageUrl && <img src={dish.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <p className="font-medium">{dish.name}</p>
<p className="text-sm text-gray-500">{formatCurrency(dish.price)}</p>
              </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${dish.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {dish.isAvailable ? 'Disponible' : 'No disponible'}
                </span>
                <button
                  onClick={() => toggleMenuMutation.mutate({ id: dish.id, isMenu: !dish.isMenu })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${dish.isMenu ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dish.isMenu ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-3">Vista previa del menú ({menuDishes.length} platos)</h3>
        {menuDishes.length === 0 ? (
          <p className="text-sm text-gray-400">Activa platos como menú para ver la vista previa</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {menuDishes.map(dish => (
              <div key={dish.id} className="rounded-lg border overflow-hidden">
                {dish.imageUrl && <img src={dish.imageUrl} alt="" className="w-full h-24 object-cover" />}
                <div className="p-2">
                  <p className="font-medium text-sm">{dish.name}</p>
                  <p className="text-blue-600 font-bold text-sm">{formatCurrency(dish.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showQR} onClose={() => setShowQR(false)} title="Código QR del Menú" size="sm">
        {qrData && (
          <div className="text-center space-y-4">
            <img src={qrData.qrDataUrl} alt="QR Menú" className="mx-auto w-48 h-48" />
            <p className="text-sm text-gray-500 break-all">{qrData.url}</p>
            <a href={qrData.qrDataUrl} download="menu-qr.png" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Descargar QR
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}

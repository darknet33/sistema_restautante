import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentCaja, openCaja, closeCaja, getCajaHistory } from '../../services/caja.service'
import { formatCurrency, formatDateTime } from '../../utils/format'
import Modal from '../../components/Modal'

export default function AdminCaja() {
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const queryClient = useQueryClient()

  const { data: currentSession, isLoading } = useQuery({
    queryKey: ['currentCaja'],
    queryFn: getCurrentCaja,
    refetchInterval: 3000,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['cajaHistory'],
    queryFn: getCajaHistory,
    enabled: showHistory,
  })

  const openMutation = useMutation({
    mutationFn: () => openCaja(Number(openingAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentCaja'] })
      setOpenModal(false)
      setOpeningAmount('')
    }
  })

  const closeMutation = useMutation({
    mutationFn: () => closeCaja(Number(closingAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentCaja'] })
      setCloseModal(false)
      setClosingAmount('')
    }
  })

  if (isLoading) return <p className="text-gray-500">Cargando...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Gestión de Caja</h2>

      {currentSession ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <h3 className="font-semibold text-lg">Caja Abierta</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Abrió</p>
              <p className="font-medium">{currentSession.user?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Monto inicial</p>
              <p className="font-medium">{formatCurrency(currentSession.openingAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Apertura</p>
              <p className="font-medium">{formatDateTime(currentSession.openedAt)}</p>
            </div>
          </div>
          <button
            onClick={() => setCloseModal(true)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Cerrar Caja
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">No hay caja abierta</h3>
          <button
            onClick={() => setOpenModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Abrir Caja
          </button>
        </div>
      )}

      <button onClick={() => setShowHistory(!showHistory)} className="text-sm text-blue-600 hover:underline">
        {showHistory ? 'Ocultar' : 'Ver'} historial de cierres
      </button>

      {showHistory && (
        <div className="space-y-2">
          {history.map((s: any) => (
            <div key={s.id} className="bg-white rounded-lg p-3 border text-sm flex items-center justify-between">
              <span>{s.user?.name} — {formatCurrency(s.openingAmount)} → {formatCurrency(s.closingAmount || 0)}</span>
              <span className={s.status === 'ABIERTA' ? 'text-green-600' : 'text-gray-500'}>{s.status}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir Caja">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Monto inicial</label>
            <input
              type="number"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              min="0"
              step="0.01"
            />
          </div>
          <button
            onClick={() => openMutation.mutate()}
            disabled={openMutation.isPending}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {openMutation.isPending ? 'Abriendo...' : 'Confirmar Apertura'}
          </button>
        </div>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Cerrar Caja">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Monto final en caja</label>
            <input
              type="number"
              value={closingAmount}
              onChange={(e) => setClosingAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              min="0"
              step="0.01"
            />
          </div>
          <button
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {closeMutation.isPending ? 'Cerrando...' : 'Confirmar Cierre'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

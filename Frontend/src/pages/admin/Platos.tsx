import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDishes, createDish, updateDish, deleteDish } from '../../services/dish.service'
import { getCategories } from '../../services/category.service'
import { formatCurrency } from '../../utils/format'
import Modal from '../../components/Modal'
import type { Dish } from '../../types'

export default function AdminPlatos() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Dish | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', cost: '', categoryId: '', isAvailable: true, isMenu: false })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  const { data: dishes = [] } = useQuery({ queryKey: ['dishes'], queryFn: () => getDishes() })
  const { data: categories = [] } = useQuery({ queryKey: ['categories', 'plato'], queryFn: () => getCategories('plato') })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createDish(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dishes'] }); closeModal() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => updateDish(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dishes'] }); closeModal() }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dishes'] })
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', price: '', cost: '', categoryId: '', isAvailable: true, isMenu: false })
    setImageFile(null)
    setShowModal(true)
  }

  const openEdit = (dish: Dish) => {
    setEditing(dish)
    setForm({
      name: dish.name,
      description: dish.description || '',
      price: String(dish.price),
      cost: String(dish.cost),
      categoryId: String(dish.categoryId),
      isAvailable: dish.isAvailable,
      isMenu: dish.isMenu,
    })
    setImageFile(null)
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleSubmit = () => {
    const data = new FormData()
    data.append('name', form.name)
    data.append('description', form.description)
    data.append('price', form.price)
    data.append('cost', form.cost)
    data.append('categoryId', form.categoryId)
    data.append('isAvailable', String(form.isAvailable))
    data.append('isMenu', String(form.isMenu))
    if (imageFile) data.append('image', imageFile)

    if (editing) {
      updateMutation.mutate({ id: editing.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Platos</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          + Nuevo Plato
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.map(dish => (
          <div key={dish.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {dish.imageUrl && (
              <img src={dish.imageUrl} alt="" className="w-full h-36 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{dish.name}</h3>
                  <p className="text-xs text-gray-500">{dish.category?.name}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${dish.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {dish.isAvailable ? 'Disponible' : 'No disponible'}
                </span>
              </div>
              {dish.description && <p className="text-xs text-gray-500 mt-1">{dish.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="font-bold text-blue-600">{formatCurrency(dish.price)}</p>
                  <p className="text-xs text-gray-400">Costo: {formatCurrency(dish.cost)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(dish)} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">✏️</button>
                  <button onClick={() => deleteMutation.mutate(dish.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Plato' : 'Nuevo Plato'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Seleccionar</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full border rounded-lg px-3 py-2" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Costo</label>
              <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="w-full border rounded-lg px-3 py-2" min="0" step="0.01" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imagen</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} />
              Disponible
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isMenu} onChange={e => setForm({ ...form, isMenu: e.target.checked })} />
              Mostrar en menú
            </label>
          </div>
          <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : editing ? 'Actualizar Plato' : 'Crear Plato'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

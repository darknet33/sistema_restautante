import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getDishes, createDish, updateDish, deleteDish } from '../../services/dish.service'
import { getCategories } from '../../services/category.service'
import CategoryManager from '../../components/CategoryManager'
import { formatCurrency, uploadUrl } from '../../utils/format'
import Modal from '../../components/Modal'
import type { Dish } from '../../types'
import { PlusCircle, Image, Pencil, Trash2, AlertCircle, Settings, X, Upload } from 'lucide-react'

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dishes'] }),
    onError: (error: AxiosError<{ message: string }>) => {
      alert(error.response?.data?.message || 'Error al eliminar el plato')
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Platos</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Gestión del menú de platos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium active:scale-[0.97]">
          <PlusCircle className="w-4 h-4" />
          Nuevo Plato
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.map(dish => (
          <div key={dish.id} className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 overflow-hidden transition-all hover:shadow-md">
            {dish.imageUrl ? (
              <div className="relative h-40 overflow-hidden">
                <img src={uploadUrl(dish.imageUrl)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className={`absolute top-3 right-3 px-2.5 py-0.5 text-[11px] rounded-full font-medium ${dish.isAvailable ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {dish.isAvailable ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            ) : (
              <div className="h-24 bg-altipiqui-cream dark:bg-dark-bg flex items-center justify-center">
                <Image className="w-10 h-10 text-gray-300 dark:text-dark-text-muted" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold dark:text-dark-text truncate">{dish.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">{dish.category?.name}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] rounded-full ml-2 ${
                  dish.isMenu ? 'bg-altipiqui-indigo-light text-altipiqui-indigo dark:bg-altipiqui-indigo/20 dark:text-altipiqui-indigo-light' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {dish.isMenu ? 'Menú' : 'Oculto'}
                </span>
              </div>
              {dish.description && <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-3 line-clamp-2">{dish.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-border/50 dark:border-dark-border/50">
                <div>
                  <p className="font-bold text-altipiqui-red">{formatCurrency(dish.price)}</p>
                  <p className="text-[11px] text-gray-400 dark:text-dark-text-muted">Costo: {formatCurrency(dish.cost)}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(dish)} className="p-2 bg-gray-100 dark:bg-dark-border rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors" title="Editar">
                    <Pencil className="w-4 h-4 text-gray-600 dark:text-dark-text-muted" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(dish.id)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Eliminar">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {dishes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 dark:text-dark-text-muted">
            <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No hay platos registrados</p>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Plato' : 'Nuevo Plato'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Nombre</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Categoría</label>
              <div className="flex gap-2">
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="flex-1 border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text">
                  <option value="">Seleccionar</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <CategoryManager type="plato" trigger={
                  <button type="button" className="p-2.5 bg-gray-100 dark:bg-dark-border rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors" title="Gestionar categorías">
                    <Settings className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
                  </button>
                } />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Precio (Bs.)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Costo (Bs.)</label>
              <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" min="0" step="0.01" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Descripción</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Imagen</label>
            <div
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDragLeave={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => {
                e.preventDefault()
                e.stopPropagation()
                const file = e.dataTransfer.files?.[0]
                if (file && file.type.startsWith('image/')) setImageFile(file)
              }}
              onClick={() => document.getElementById('dish-image-input')?.click()}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                imageFile
                  ? 'border-altipiqui-red bg-altipiqui-red/5 dark:bg-altipiqui-red/10'
                  : 'border-border dark:border-dark-border hover:border-altipiqui-red/50 hover:bg-altipiqui-cream/50 dark:hover:bg-dark-bg/50'
              }`}
            >
              <input
                id="dish-image-input"
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              {imageFile ? (
                <div className="text-center w-full">
                  <div className="relative w-full h-40 mb-3 rounded-xl overflow-hidden bg-altipiqui-cream dark:bg-dark-bg">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={e => { e.stopPropagation(); setImageFile(null) }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-altipiqui-red truncate">{imageFile.name}</p>
                  <p className="text-xs text-gray-400">{(imageFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : editing?.imageUrl ? (
                <div className="text-center w-full">
                  <div className="relative w-full h-40 mb-3 rounded-xl overflow-hidden bg-altipiqui-cream dark:bg-dark-bg">
                    <img src={uploadUrl(editing.imageUrl)} alt="Current" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-dark-text-muted">Imagen actual. Haz clic o arrastra para cambiar</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-altipiqui-cream dark:bg-dark-border flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-text mb-1">
                    Arrastra una imagen aquí
                  </p>
                  <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                    o haz clic para seleccionar (PNG, JPG, WebP — máx 5MB)
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-dark-text">
              <input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} className="rounded accent-altipiqui-red" />
              Disponible
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-dark-text">
              <input type="checkbox" checked={form.isMenu} onChange={e => setForm({ ...form, isMenu: e.target.checked })} className="rounded accent-altipiqui-red" />
              Mostrar en menú
            </label>
          </div>
          <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]">
            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : editing ? 'Actualizar Plato' : 'Crear Plato'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

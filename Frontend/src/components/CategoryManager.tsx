import { AlertTriangle, PlusCircle, Tag, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/category.service'
import Modal from './Modal'
import type { Category } from '../types'

interface CategoryManagerProps {
  type: 'plato' | 'bebida' | 'insumo' | ('bebida' | 'insumo')[]
  trigger: React.ReactNode
  title?: string
}

export default function CategoryManager({ type, trigger, title }: CategoryManagerProps) {
  const [open, setOpen] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const typeArr = Array.isArray(type) ? type : [type]
  const typeLabel = title || (Array.isArray(type) ? 'Inventario' : type === 'plato' ? 'Platos' : type === 'bebida' ? 'Bebidas' : 'Insumos')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', ...typeArr],
    queryFn: () => {
      if (Array.isArray(type)) {
        return getCategories().then(all => all.filter(c => type.includes(c.type as any)))
      }
      return getCategories(type)
    }
  })

  const [createType, setCreateType] = useState(typeArr[0])

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string }) => createCategory(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); queryClient.invalidateQueries({ queryKey: ['categories', ...typeArr] }); closeForm() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) => updateCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); queryClient.invalidateQueries({ queryKey: ['categories', ...typeArr] }); closeForm() }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); queryClient.invalidateQueries({ queryKey: ['categories', ...typeArr] }); setDeleteConfirm(null); setDeleteError(null) },
    onError: (error: AxiosError<{ message: string }>) => {
      setDeleteError(error.response?.data?.message || 'Error al eliminar la categoría')
    }
  })

  const closeForm = () => { setModalType(null); setEditing(null); setName(''); setCreateType(typeArr[0]) }

  const openCreate = () => { setModalType('create'); setName(''); setCreateType(typeArr[0]) }

  const openEdit = (cat: Category) => { setModalType('edit'); setEditing(cat); setName(cat.name) }

  return (
    <>
      <div onClick={e => e.stopPropagation()}>
        <span onClick={() => setOpen(true)}>{trigger}</span>
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setDeleteConfirm(null) }} title={`Categorías — ${typeLabel}`} size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">
              {categories.length} categoría{categories.length !== 1 ? 's' : ''}
            </p>
            <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all text-xs font-medium active:scale-[0.97]">
              <PlusCircle className="w-3.5 h-3.5" />
              Nueva categoría
            </button>
          </div>

              {categories.length === 0 ? (
            <p className="text-center py-8 text-gray-400 dark:text-dark-text-muted text-sm">No hay categorías de este tipo</p>
          ) : (
            <div className="space-y-1.5">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-altipiqui-cream/50 dark:bg-dark-bg/50 hover:bg-altipiqui-cream dark:hover:bg-dark-bg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-altipiqui-red/10 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-altipiqui-red" />
                    </div>
                    <div>
                      <span className="font-medium dark:text-dark-text">{cat.name}</span>
                      {Array.isArray(type) && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-dark-text-muted uppercase">{cat.type}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1.5 bg-gray-100 dark:bg-dark-border rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-gray-500 dark:text-dark-text-muted" />
                    </button>
                    <button onClick={() => setDeleteConfirm(cat)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={modalType !== null} onClose={closeForm} title={modalType === 'create' ? 'Nueva categoría' : 'Editar categoría'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text"
              placeholder="Ej: Entradas, Platos de fondo, Postres..."
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); modalType === 'create' ? createMutation.mutate({ name, type: createType }) : editing && updateMutation.mutate({ id: editing.id, data: { name } }) } }}
            />
          </div>
          {modalType === 'create' && Array.isArray(type) && (
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Tipo</label>
              <select value={createType} onChange={e => setCreateType(e.target.value)} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text">
                {typeArr.map(t => <option key={t} value={t}>{t === 'bebida' ? 'Bebida' : 'Insumo'}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => modalType === 'create' ? createMutation.mutate({ name, type: createType }) : editing && updateMutation.mutate({ id: editing.id, data: { name } })}
            disabled={createMutation.isPending || updateMutation.isPending || !name.trim()}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]">
            {modalType === 'create' ? 'Crear categoría' : 'Guardar cambios'}
          </button>
        </div>
      </Modal>

      <Modal open={deleteConfirm !== null} onClose={() => { setDeleteConfirm(null); setDeleteError(null) }} title="Eliminar categoría" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  ¿Eliminar <strong>{deleteConfirm.name}</strong>?
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            {deleteError && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setDeleteConfirm(null); setDeleteError(null) }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg transition-all font-medium">
                Cancelar
              </button>
              <button onClick={() => { setDeleteError(null); deleteMutation.mutate(deleteConfirm.id) }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all font-medium active:scale-[0.97]">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
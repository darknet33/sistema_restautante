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
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
                      <svg className="w-4 h-4 text-altipiqui-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                      </svg>
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
                      <svg className="w-3.5 h-3.5 text-gray-500 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteConfirm(cat)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165" />
                      </svg>
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
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
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
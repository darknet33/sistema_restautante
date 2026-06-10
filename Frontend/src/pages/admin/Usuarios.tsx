import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getUsers, createUser, updateUser, deleteUser } from '../../services/auth.service'
import Modal from '../../components/Modal'
import type { User } from '../../types'

export default function AdminUsuarios() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'MESERO' })
  const queryClient = useQueryClient()

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers })

  const createMutation = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); close() }
  })

  const updateMutation = useMutation({
    mutationFn: () => updateUser(editing!.id, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); close() }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (error: AxiosError<{ message: string }>) => {
      alert(error.response?.data?.message || 'Error al eliminar el usuario')
    }
  })

  const openCreate = () => { setEditing(null); setForm({ username: '', password: '', name: '', role: 'MESERO' }); setShowModal(true) }
  const openEdit = (u: User) => { setEditing(u); setForm({ username: u.username, password: '', name: u.name, role: u.role }); setShowModal(true) }
  const close = () => setShowModal(false)

  const handleSubmit = () => {
    if (editing) updateMutation.mutate()
    else createMutation.mutate()
  }

  const roleStyles: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    CAJERO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    COCINA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    MESERO: 'bg-altipiqui-green-light text-altipiqui-green dark:bg-green-900/30 dark:text-green-300',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold dark:text-dark-text">Usuarios</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Gestión de usuarios del sistema</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 text-sm font-medium active:scale-[0.97]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-border/50 dark:border-dark-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-altipiqui-cream dark:bg-dark-bg">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Usuario</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Nombre</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-dark-text">Rol</th>
                <th className="text-center p-4 font-semibold text-gray-600 dark:text-dark-text">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-border/50 dark:border-dark-border/50 hover:bg-altipiqui-cream/50 dark:hover:bg-dark-bg/50">
                  <td className="p-4 font-mono text-sm dark:text-dark-text">{u.username}</td>
                  <td className="p-4 dark:text-dark-text">{u.name}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${roleStyles[u.role] || 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => openEdit(u)} className="p-1.5 bg-gray-100 dark:bg-dark-border rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg transition-colors">
                        <svg className="w-4 h-4 text-gray-600 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button onClick={() => deleteMutation.mutate(u.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-dark-text-muted">No hay usuarios registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={close} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Username</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Nombre</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Contraseña {editing && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-dark-text">Rol</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border border-border dark:border-dark-border rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-altipiqui-red focus:border-altipiqui-red outline-none dark:bg-dark-surface dark:text-dark-text">
              <option value="MESERO">Mesero</option>
              <option value="CAJERO">Cajero</option>
              <option value="COCINA">Cocina</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2.5 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark disabled:opacity-50 transition-all font-medium active:scale-[0.97]">
            {editing ? 'Actualizar' : 'Crear Usuario'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const openCreate = () => { setEditing(null); setForm({ username: '', password: '', name: '', role: 'MESERO' }); setShowModal(true) }
  const openEdit = (u: User) => { setEditing(u); setForm({ username: u.username, password: '', name: u.name, role: u.role }); setShowModal(true) }
  const close = () => setShowModal(false)

  const handleSubmit = () => {
    if (editing) updateMutation.mutate()
    else createMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Usuarios</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Nuevo Usuario</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Usuario</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Rol</th>
                <th className="text-center p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{u.username}</td>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'CAJERO' ? 'bg-blue-100 text-blue-700' :
                      u.role === 'COCINA' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(u)} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">✏️</button>
                      <button onClick={() => deleteMutation.mutate(u.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={close} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña {editing && '(dejar vacío para no cambiar)'}</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rol</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="MESERO">Mesero</option>
              <option value="CAJERO">Cajero</option>
              <option value="COCINA">Cocina</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {editing ? 'Actualizar' : 'Crear Usuario'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

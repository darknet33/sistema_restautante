import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, getLowStock, createProduct, updateProduct, deleteProduct } from '../services/product.service'
import { getDailySales, getTopDishes, closeTurno } from '../services/report.service'
import { getCategories } from '../services/category.service'
import type { User, Product, Category } from '../types'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

interface AdminDashboardProps {
  user: User
  onLogout: () => void
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [productFilter, setProductFilter] = useState<string>('all')
  const [dishFilter, setDishFilter] = useState<string>('all')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: 0,
    price: 0,
    cost: 0,
    unit: 'unidad',
    stockCurrent: 0,
    stockMin: 0,
    isInventoryTracked: false,
    isAvailable: true
  })

  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => getProducts()
  })

  const { data: lowStock = [] } = useQuery({
    queryKey: ['lowStock'],
    queryFn: getLowStock
  })

  const { data: dailySales } = useQuery({
    queryKey: ['dailySales'],
    queryFn: getDailySales
  })

  const { data: topDishes = [], refetch: refetchDishes } = useQuery({
    queryKey: ['topDishes', dishFilter],
    queryFn: () => getTopDishes(dishFilter === 'all' ? undefined : dishFilter)
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  })

  const createProductMutation = useMutation({
    mutationFn: (data: any) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
      setShowProductModal(false)
      resetForm()
    }
  })

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
      setShowProductModal(false)
      setEditingProduct(null)
      resetForm()
    }
  })

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
    }
  })

  const closeTurnoMutation = useMutation({
    mutationFn: closeTurno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySales'] })
      alert('Turno cerrado exitosamente')
    }
  })

  const resetForm = () => {
    setProductForm({
      name: '',
      categoryId: categories[0]?.id || 0,
      price: 0,
      cost: 0,
      unit: 'unidad',
      stockCurrent: 0,
      stockMin: 0,
      isInventoryTracked: false,
      isAvailable: true
    })
  }

  const openCreateModal = () => {
    resetForm()
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const openEditModal = (product: Product) => {
    setProductForm({
      name: product.name,
      categoryId: product.categoryId,
      price: Number(product.price),
      cost: Number(product.cost),
      unit: product.unit,
      stockCurrent: Number(product.stockCurrent),
      stockMin: Number(product.stockMin),
      isInventoryTracked: product.isInventoryTracked,
      isAvailable: product.isAvailable
    })
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleSubmitProduct = () => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productForm })
    } else {
      createProductMutation.mutate(productForm)
    }
  }

  const filteredProducts = productFilter === 'all' 
    ? products 
    : products.filter((p: Product) => p.category?.type === productFilter)

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin - {user.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/caja')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Caja
          </button>
          <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Salir
          </button>
        </div>
      </header>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Ventas del Día</h2>
          {dailySales && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold">${dailySales.totalSales}</span>
              </div>
              <div className="flex justify-between">
                <span>Pedidos:</span>
                <span className="font-bold">{dailySales.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span>Ticket Promedio:</span>
                <span className="font-bold">${dailySales.avgTicket.toFixed(2)}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => closeTurnoMutation.mutate()}
            disabled={closeTurnoMutation.isPending}
            className="mt-4 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Cerrar Turno
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Alertas de Stock</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-500">No hay alertas</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lowStock.map((product: Product) => (
                <div key={product.id} className="p-2 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-red-600">
                    Stock: {product.stockCurrent} / Mín: {product.stockMin}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Platos Más Vendidos</h2>
          <div className="mb-2">
            <button 
              onClick={() => { setDishFilter('all'); refetchDishes() }}
              className={`px-2 py-1 text-xs rounded mr-1 ${dishFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => { setDishFilter('plato'); refetchDishes() }}
              className={`px-2 py-1 text-xs rounded mr-1 ${dishFilter === 'plato' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Platos
            </button>
            <button 
              onClick={() => { setDishFilter('bebida'); refetchDishes() }}
              className={`px-2 py-1 text-xs rounded ${dishFilter === 'bebida' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Bebidas
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {topDishes.map((dish: any, idx: number) => (
              <div key={idx} className="flex justify-between p-2 border-b">
                <span>{dish.product} <span className="text-xs text-gray-500">({dish.categoryType})</span></span>
                <span className="font-medium">{dish.quantitySold} vendidos</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Productos</h2>
            <div className="flex gap-2">
              <select 
                value={productFilter} 
                onChange={(e) => setProductFilter(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="all">Todos</option>
                <option value="plato">Platos</option>
                <option value="bebida">Bebidas</option>
                <option value="insumo">Insumos</option>
              </select>
              <button 
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Nuevo Producto
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Categoría</th>
                <th className="p-2 text-left">Precio</th>
                <th className="p-2 text-left">Stock</th>
                <th className="p-2 text-left">Estado</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: Product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-2">{product.name}</td>
                  <td className="p-2">{product.category?.name}</td>
                  <td className="p-2">${product.price}</td>
                  <td className="p-2">
                    {product.isInventoryTracked ? `${product.stockCurrent} / ${product.stockMin}` : 'N/A'}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs rounded ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.isAvailable ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                  <td className="p-2">
                    <button 
                      onClick={() => openEditModal(product)}
                      className="text-blue-500 mr-2"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('¿Eliminar este producto?')) {
                          deleteProductMutation.mutate(product.id)
                        }
                      }}
                      className="text-red-500"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({...productForm, categoryId: Number(e.target.value)})}
                  className="w-full p-2 border rounded"
                >
                  {categories.map((cat: Category) => (
                    <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Precio</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Costo</label>
                  <input
                    type="number"
                    value={productForm.cost}
                    onChange={(e) => setProductForm({...productForm, cost: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unidad</label>
                <input
                  type="text"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={productForm.stockCurrent}
                    onChange={(e) => setProductForm({...productForm, stockCurrent: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={productForm.stockMin}
                    onChange={(e) => setProductForm({...productForm, stockMin: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={productForm.isInventoryTracked}
                  onChange={(e) => setProductForm({...productForm, isInventoryTracked: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Controlar stock (bebidas/insumos)</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={productForm.isAvailable}
                  onChange={(e) => setProductForm({...productForm, isAvailable: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Disponible</label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSubmitProduct}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {editingProduct ? 'Actualizar' : 'Crear'}
              </button>
              <button
                onClick={() => {
                  setShowProductModal(false)
                  setEditingProduct(null)
                }}
                className="flex-1 bg-gray-300 p-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

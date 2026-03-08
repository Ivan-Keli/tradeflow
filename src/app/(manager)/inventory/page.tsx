'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, XCircle } from 'lucide-react'

type Product = {
  id: string
  name: string
  sku: string
  price: number
  categoryId: string
  supplierId: string
  category: { id: string; name: string }
  supplier: { id: string; name: string }
  inventory: { id: string; quantity: number; minimumThreshold: number } | null
}

type Category = { id: string; name: string }
type Supplier = { id: string; name: string }

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/categories'),
        fetch('/api/suppliers'),
      ])
      setProducts(await productsRes.json())
      setCategories(await categoriesRes.json())
      setSuppliers(await suppliersRes.json())
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !filterCategory || p.categoryId === filterCategory
    return matchesSearch && matchesCategory
  })

  const totalProducts = products.length
  const lowStock = products.filter(
    (p) => p.inventory && p.inventory.quantity < p.inventory.minimumThreshold && p.inventory.quantity > 0
  ).length
  const outOfStock = products.filter(
    (p) => p.inventory && p.inventory.quantity === 0
  ).length

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <p className="text-gray-500">Loading inventory...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Product Table */}
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">Product Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock Qty</th>
                <th className="px-4 py-3 font-medium text-right">Min Threshold</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const qty = product.inventory?.quantity ?? 0
                const threshold = product.inventory?.minimumThreshold ?? 10
                const isLow = qty < threshold && qty > 0
                const isOut = qty === 0

                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                    <td className="px-4 py-3">{product.category.name}</td>
                    <td className="px-4 py-3">{product.supplier.name}</td>
                    <td className="px-4 py-3 text-right">${product.price.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-green-600'}`}>
                      {qty}
                      {isLow && <span className="ml-1 text-xs">(Low)</span>}
                      {isOut && <span className="ml-1 text-xs">(Out)</span>}
                    </td>
                    <td className="px-4 py-3 text-right">{threshold}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setEditProduct(product)}
                        className="mr-2 text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Pencil className="inline h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteProduct(product)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="inline h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <ProductModal
          title="Add Product"
          categories={categories}
          suppliers={suppliers}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            const res = await fetch('/api/inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.error)
            }
            setShowAddModal(false)
            fetchData()
          }}
          onCategoryCreated={fetchData}
        />
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <ProductModal
          title="Edit Product"
          product={editProduct}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setEditProduct(null)}
          onSave={async (data) => {
            const res = await fetch(`/api/inventory/${editProduct.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.error)
            }
            setEditProduct(null)
            fetchData()
          }}
          onCategoryCreated={fetchData}
        />
      )}

      {/* Delete Confirmation */}
      {deleteProduct && (
        <DeleteModal
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onConfirm={async () => {
            const res = await fetch(`/api/inventory/${deleteProduct.id}`, {
              method: 'DELETE',
            })
            if (!res.ok) {
              const err = await res.json()
              setError(err.error)
            }
            setDeleteProduct(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function ProductModal({
  title,
  product,
  categories,
  suppliers,
  onClose,
  onSave,
  onCategoryCreated,
}: {
  title: string
  product?: Product
  categories: Category[]
  suppliers: Supplier[]
  onClose: () => void
  onSave: (data: any) => Promise<void>
  onCategoryCreated: () => void
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    supplierId: product?.supplierId || '',
    price: product?.price?.toString() || '',
    quantity: product?.inventory?.quantity?.toString() || '0',
    minimumThreshold: product?.inventory?.minimumThreshold?.toString() || '10',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(form)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error)
        return
      }
      const cat = await res.json()
      setForm({ ...form, categoryId: cat.id })
      setNewCategory('')
      setShowNewCategory(false)
      onCategoryCreated()
    } catch {
      setError('Failed to create category')
    }
  }

  const generateSku = () => {
    const cat = categories.find((c) => c.id === form.categoryId)
    const prefix = cat ? cat.name.substring(0, 4).toUpperCase() : 'PROD'
    const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    setForm({ ...form, sku: `${prefix}-${num}` })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">{title}</h2>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SKU *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                required
                className="mt-1 block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {!product && (
                <button type="button" onClick={generateSku} className="mt-1 rounded-md bg-gray-100 px-3 py-2 text-xs hover:bg-gray-200">
                  Generate
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <div className="flex gap-2">
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
                className="mt-1 block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowNewCategory(!showNewCategory)} className="mt-1 rounded-md bg-gray-100 px-3 py-2 text-xs hover:bg-gray-200">
                + New
              </button>
            </div>
            {showNewCategory && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category name"
                  className="block flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button type="button" onClick={handleAddCategory} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700">
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier *</label>
            <select
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {!product && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Threshold *</label>
              <input
                type="number"
                min="1"
                value={form.minimumThreshold}
                onChange={(e) => setForm({ ...form, minimumThreshold: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({
  product,
  onClose,
  onConfirm,
}: {
  product: Product
  onClose: () => void
  onConfirm: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-bold">Delete Product</h2>
        <p className="mb-4 text-sm text-gray-600">
          Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={async () => {
              setDeleting(true)
              await onConfirm()
              setDeleting(false)
            }}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

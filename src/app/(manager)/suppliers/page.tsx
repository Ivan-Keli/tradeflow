'use client'

import { useEffect, useState } from 'react'
import { Plus, Truck, ChevronDown, ChevronUp } from 'lucide-react'

type Supplier = {
  id: string
  name: string
  contactInfo: string | null
  address: string | null
  _count: { products: number; deliveries: number }
}

type DeliveryItem = {
  id: string
  productId: string
  productName: string
  quantity: number
}

type Delivery = {
  id: string
  dateReceived: string
  notes: string | null
  items: DeliveryItem[]
}

type Product = {
  id: string
  name: string
  supplierId: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deliverySupplier, setDeliverySupplier] = useState<Supplier | null>(null)
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({})
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/inventory'),
      ])
      setSuppliers(await suppliersRes.json())
      const prods = await productsRes.json()
      setProducts(prods.map((p: any) => ({ id: p.id, name: p.name, supplierId: p.supplierId })))
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const toggleDeliveries = async (supplierId: string) => {
    if (expandedSupplier === supplierId) {
      setExpandedSupplier(null)
      return
    }

    setExpandedSupplier(supplierId)
    if (!deliveries[supplierId]) {
      const res = await fetch(`/api/suppliers/${supplierId}/deliveries`)
      const data = await res.json()
      setDeliveries((prev) => ({ ...prev, [supplierId]: data }))
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <p className="text-gray-500">Loading suppliers...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="rounded-lg bg-white shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="text-lg font-semibold">{supplier.name}</h3>
                  {supplier.contactInfo && (
                    <p className="text-sm text-gray-500">{supplier.contactInfo}</p>
                  )}
                  {supplier.address && (
                    <p className="text-sm text-gray-400">{supplier.address}</p>
                  )}
                  <div className="mt-1 flex gap-4 text-xs text-gray-500">
                    <span>{supplier._count.products} products</span>
                    <span>{supplier._count.deliveries} deliveries</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeliverySupplier(supplier)}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                  >
                    <Truck className="h-4 w-4" /> Log Delivery
                  </button>
                  <button
                    onClick={() => toggleDeliveries(supplier.id)}
                    className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    History
                    {expandedSupplier === supplier.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {expandedSupplier === supplier.id && (
                <div className="border-t bg-gray-50 p-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">Delivery History</h4>
                  {deliveries[supplier.id]?.length ? (
                    <div className="space-y-3">
                      {deliveries[supplier.id].map((delivery) => (
                        <div key={delivery.id} className="rounded-md bg-white p-3">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              {new Date(delivery.dateReceived).toLocaleDateString()}
                            </span>
                            {delivery.notes && (
                              <span className="text-gray-500">{delivery.notes}</span>
                            )}
                          </div>
                          <div className="mt-1 space-y-1">
                            {delivery.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-xs text-gray-600">
                                <span>{item.productName}</span>
                                <span>+{item.quantity} units</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No deliveries recorded</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {suppliers.length === 0 && (
            <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">
              No suppliers found. Add your first supplier.
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <AddSupplierModal
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            const res = await fetch('/api/suppliers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create supplier')
            setShowAddModal(false)
            fetchData()
          }}
        />
      )}

      {/* Log Delivery Modal */}
      {deliverySupplier && (
        <DeliveryModal
          supplier={deliverySupplier}
          products={products.filter((p) => p.supplierId === deliverySupplier.id)}
          allProducts={products}
          onClose={() => setDeliverySupplier(null)}
          onSave={async (data) => {
            const res = await fetch('/api/deliveries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to log delivery')
            setDeliverySupplier(null)
            // Clear cached deliveries
            setDeliveries((prev) => {
              const next = { ...prev }
              delete next[deliverySupplier.id]
              return next
            })
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function AddSupplierModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (data: { name: string; contactInfo: string; address: string }) => Promise<void>
}) {
  const [form, setForm] = useState({ name: '', contactInfo: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">Add Supplier</h2>
        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Info</label>
            <input
              type="text"
              value={form.contactInfo}
              onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Email, phone, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeliveryModal({
  supplier,
  products,
  allProducts,
  onClose,
  onSave,
}: {
  supplier: Supplier
  products: Product[]
  allProducts: Product[]
  onClose: () => void
  onSave: (data: any) => Promise<void>
}) {
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ productId: '', quantity: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Use supplier's products first, but allow all products
  const availableProducts = allProducts

  const addRow = () => setItems([...items, { productId: '', quantity: '' }])

  const updateRow = (index: number, field: string, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const removeRow = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validItems = items.filter((i) => i.productId && parseInt(i.quantity) > 0)
    if (validItems.length === 0) {
      setError('Add at least one item with a quantity')
      return
    }

    setSaving(true)
    try {
      await onSave({
        supplierId: supplier.id,
        dateReceived,
        notes: notes || null,
        items: validItems.map((item) => ({
          productId: item.productId,
          productName: availableProducts.find((p) => p.id === item.productId)?.name || '',
          quantity: item.quantity,
        })),
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-bold">Log Delivery</h2>
        <p className="mb-4 text-sm text-gray-500">Supplier: {supplier.name}</p>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Received</label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Items</label>
            <div className="mt-1 space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    value={item.productId}
                    onChange={(e) => updateRow(idx, 'productId', e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select product</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700">
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              + Add another item
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Log Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

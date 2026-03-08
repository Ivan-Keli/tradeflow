'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react'

type Product = {
  id: string
  name: string
  sku: string
  price: number
  category: { id: string; name: string }
  inventory: { quantity: number } | null
}

type CartItem = {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  maxStock: number
}

type CompletedSale = {
  id: string
  totalAmount: number
  paymentMethod: string
  items: { productName: string; quantity: number; unitPrice: number }[]
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE'>('CASH')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const [error, setError] = useState('')

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      setProducts(await res.json())
    } catch {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: Product) => {
    const stock = product.inventory?.quantity || 0
    if (stock === 0) return

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= stock) return prev
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          maxStock: stock,
        },
      ]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item
          const newQty = item.quantity + delta
          if (newQty <= 0) return null as any
          if (newQty > item.maxStock) return item
          return { ...item, quantity: newQty }
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  const handleCheckout = async () => {
    setError('')
    setProcessing(true)

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(({ productId, productName, unitPrice, quantity }) => ({
            productId,
            productName,
            unitPrice,
            quantity,
          })),
          paymentMethod,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }

      const sale = await res.json()
      setCompletedSale(sale)
      setCart([])
      setShowConfirm(false)
      fetchProducts() // Refresh stock levels
    } catch (err: any) {
      setError(err.message)
      setShowConfirm(false)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500">Loading POS...</p>
        </div>
      </div>
    )
  }

  // Success screen
  if (completedSale) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-md p-6">
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-3 h-16 w-16 text-green-500" />
            <h2 className="mb-1 text-xl font-bold">Sale Complete!</h2>
            <p className="mb-4 text-sm text-gray-500">
              Sale ID: {completedSale.id.substring(0, 8)}
            </p>

            <div className="mb-4 rounded-md bg-gray-50 p-3 text-left">
              {completedSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {item.productName} x{item.quantity}
                  </span>
                  <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-2 border-t pt-2 text-right font-bold">
                Total: ${completedSale.totalAmount.toFixed(2)}
              </div>
              <div className="text-right text-xs text-gray-500">
                Payment: {completedSale.paymentMethod}
              </div>
            </div>

            <button
              onClick={() => setCompletedSale(null)}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Panel - Products */}
        <div className="flex-[3] overflow-y-auto border-r p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const stock = product.inventory?.quantity || 0
              const isOutOfStock = stock === 0
              const inCart = cart.find((i) => i.productId === product.id)

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={isOutOfStock}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    isOutOfStock
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-50'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-blue-600">${product.price.toFixed(2)}</span>
                    <span className={`text-xs ${isOutOfStock ? 'text-red-500' : 'text-gray-400'}`}>
                      {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                    </span>
                  </div>
                  {inCart && (
                    <div className="mt-1 text-xs text-blue-600">
                      {inCart.quantity} in cart
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="flex w-96 flex-col bg-white">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg font-bold">Cart</h2>
              <span className="text-sm text-gray-500">
                ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
              </span>
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-3 rounded-md bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="text-center text-sm text-gray-400">Cart is empty</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 rounded-md border p-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-gray-500">${item.unitPrice.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-medium">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Area */}
          <div className="border-t p-4">
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-500">Payment Method</label>
              <div className="flex gap-2">
                {(['CASH', 'CARD', 'MOBILE'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 rounded-md py-2 text-sm font-medium ${
                      paymentMethod === method
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3 flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={cart.length === 0 || processing}
              className="w-full rounded-md bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-bold">Confirm Sale</h2>
            <p className="mb-1 text-sm text-gray-600">
              Total: <strong>${total.toFixed(2)}</strong>
            </p>
            <p className="mb-4 text-sm text-gray-600">
              Payment: <strong>{paymentMethod}</strong>
            </p>
            <p className="mb-4 text-xs text-gray-400">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} items in cart
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

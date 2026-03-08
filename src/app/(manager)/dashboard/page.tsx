'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  XCircle,
  Package,
  Truck,
} from 'lucide-react'

type DashboardData = {
  kpis: {
    salesTodayAmount: number
    transactionsToday: number
    lowStockCount: number
    outOfStockCount: number
    totalProducts: number
    totalSuppliers: number
  }
  recentSales: {
    id: string
    totalAmount: number
    paymentMethod: string
    createdAt: string
    processedBy: { name: string }
    items: { id: string }[]
  }[]
  lowStockItems: {
    id: string
    quantity: number
    minimumThreshold: number
    product: { name: string; sku: string }
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  const { kpis, recentSales, lowStockItems } = data

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KPICard
          icon={<DollarSign className="h-8 w-8 text-green-500" />}
          label="Sales Today"
          value={`$${kpis.salesTodayAmount.toFixed(2)}`}
        />
        <KPICard
          icon={<ShoppingCart className="h-8 w-8 text-blue-500" />}
          label="Transactions Today"
          value={kpis.transactionsToday.toString()}
        />
        <KPICard
          icon={<AlertTriangle className="h-8 w-8 text-yellow-500" />}
          label="Low Stock Items"
          value={kpis.lowStockCount.toString()}
          highlight={kpis.lowStockCount > 0 ? 'yellow' : undefined}
        />
        <KPICard
          icon={<XCircle className="h-8 w-8 text-red-500" />}
          label="Out of Stock"
          value={kpis.outOfStockCount.toString()}
          highlight={kpis.outOfStockCount > 0 ? 'red' : undefined}
        />
        <KPICard
          icon={<Package className="h-8 w-8 text-purple-500" />}
          label="Total Products"
          value={kpis.totalProducts.toString()}
        />
        <KPICard
          icon={<Truck className="h-8 w-8 text-indigo-500" />}
          label="Total Suppliers"
          value={kpis.totalSuppliers.toString()}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Sales */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white shadow-sm">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Recent Sales</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-2 font-medium">Sale ID</th>
                    <th className="px-4 py-2 font-medium">Processed By</th>
                    <th className="px-4 py-2 font-medium text-center">Items</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                    <th className="px-4 py-2 font-medium">Payment</th>
                    <th className="px-4 py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">
                        {sale.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-2">{sale.processedBy.name}</td>
                      <td className="px-4 py-2 text-center">{sale.items.length}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        ${sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                        No sales recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div>
          <div className="rounded-lg bg-white shadow-sm">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
            </div>
            <div className="p-4">
              {lowStockItems.length > 0 ? (
                <div className="space-y-2">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border border-yellow-200 bg-yellow-50 p-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-yellow-600">{item.quantity}</p>
                        <p className="text-xs text-gray-400">min: {item.minimumThreshold}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">All items sufficiently stocked</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: 'yellow' | 'red'
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p
            className={`text-2xl font-bold ${
              highlight === 'yellow'
                ? 'text-yellow-600'
                : highlight === 'red'
                ? 'text-red-600'
                : ''
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

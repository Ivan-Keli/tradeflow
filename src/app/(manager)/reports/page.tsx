'use client'

import { useEffect, useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'

type SalesReport = {
  summary: { totalRevenue: number; totalTransactions: number; averageSaleValue: number }
  topProducts: { name: string; unitsSold: number; revenue: number }[]
  paymentBreakdown: Record<string, { count: number; amount: number }>
  dailySales: { date: string; transactions: number; amount: number }[]
}

type InventoryMovement = {
  productName: string
  sku: string
  category: string
  currentStock: number
  minimumThreshold: number
  received: number
  sold: number
  netChange: number
  belowThreshold: boolean
}

type InventoryReport = {
  inventoryMovement: InventoryMovement[]
}

export default function ReportsPage() {
  const [tab, setTab] = useState<'sales' | 'inventory'>('sales')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [salesData, setSalesData] = useState<SalesReport | null>(null)
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      if (tab === 'sales') {
        const res = await fetch(`/api/reports/sales?${params}`)
        setSalesData(await res.json())
      } else {
        const res = await fetch(`/api/reports/inventory?${params}`)
        setInventoryData(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [tab, from, to])

  const exportPDF = async () => {
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()

    if (tab === 'sales' && salesData) {
      doc.text('Sales Performance Report', 14, 15)
      doc.setFontSize(10)
      doc.text(`Period: ${from || 'All'} to ${to || 'Present'}`, 14, 22)

      doc.text(`Total Revenue: $${salesData.summary.totalRevenue.toFixed(2)}`, 14, 32)
      doc.text(`Transactions: ${salesData.summary.totalTransactions}`, 14, 38)
      doc.text(`Average Sale: $${salesData.summary.averageSaleValue.toFixed(2)}`, 14, 44)

      autoTable(doc, {
        head: [['Product', 'Units Sold', 'Revenue']],
        body: salesData.topProducts.map((p) => [p.name, p.unitsSold, `$${p.revenue.toFixed(2)}`]),
        startY: 52,
      })

      doc.save('Sales_Report.pdf')
    } else if (tab === 'inventory' && inventoryData) {
      doc.text('Inventory Movement Report', 14, 15)
      doc.setFontSize(10)
      doc.text(`Period: ${from || 'All'} to ${to || 'Present'}`, 14, 22)

      autoTable(doc, {
        head: [['Product', 'SKU', 'Current Stock', 'Received', 'Sold', 'Net Change', 'Status']],
        body: inventoryData.inventoryMovement.map((p) => [
          p.productName,
          p.sku,
          p.currentStock,
          p.received,
          p.sold,
          p.netChange,
          p.belowThreshold ? 'LOW' : 'OK',
        ]),
        startY: 30,
      })

      doc.save('Inventory_Report.pdf')
    }
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')

    if (tab === 'sales' && salesData) {
      const wb = XLSX.utils.book_new()

      // Summary sheet
      const summaryData = [
        { Metric: 'Total Revenue', Value: `$${salesData.summary.totalRevenue.toFixed(2)}` },
        { Metric: 'Total Transactions', Value: salesData.summary.totalTransactions },
        { Metric: 'Average Sale Value', Value: `$${salesData.summary.averageSaleValue.toFixed(2)}` },
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary')

      // Top products sheet
      const productsData = salesData.topProducts.map((p) => ({
        Product: p.name,
        'Units Sold': p.unitsSold,
        Revenue: p.revenue.toFixed(2),
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsData), 'Top Products')

      // Daily sales sheet
      const dailyData = salesData.dailySales.map((d) => ({
        Date: d.date,
        Transactions: d.transactions,
        Amount: d.amount.toFixed(2),
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyData), 'Daily Sales')

      XLSX.writeFile(wb, 'Sales_Report.xlsx')
    } else if (tab === 'inventory' && inventoryData) {
      const wb = XLSX.utils.book_new()
      const data = inventoryData.inventoryMovement.map((p) => ({
        Product: p.productName,
        SKU: p.sku,
        Category: p.category,
        'Current Stock': p.currentStock,
        'Min Threshold': p.minimumThreshold,
        Received: p.received,
        Sold: p.sold,
        'Net Change': p.netChange,
        Status: p.belowThreshold ? 'LOW' : 'OK',
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Inventory Movement')
      XLSX.writeFile(wb, 'Inventory_Report.xlsx')
    }
  }

  return (
    <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <div className="flex gap-2">
              <button
                onClick={exportPDF}
                className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
              >
                <FileDown className="h-4 w-4" /> Export PDF
              </button>
              <button
                onClick={exportExcel}
                className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
              >
                <FileSpreadsheet className="h-4 w-4" /> Export Excel
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg bg-gray-200 p-1">
            <button
              onClick={() => setTab('sales')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
                tab === 'sales' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sales Performance
            </button>
            <button
              onClick={() => setTab('inventory')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
                tab === 'inventory' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inventory Movement
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="mb-6 flex items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {(from || to) && (
              <button
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-gray-500">Loading report...</p>
          ) : tab === 'sales' ? (
            <SalesReportView data={salesData} />
          ) : (
            <InventoryReportView data={inventoryData} />
          )}
    </div>
  )
}

function SalesReportView({ data }: { data: SalesReport | null }) {
  if (!data) return null

  const { summary, topProducts, paymentBreakdown, dailySales } = data

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">${summary.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold">{summary.totalTransactions}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average Sale Value</p>
          <p className="text-2xl font-bold">${summary.averageSaleValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-lg bg-white shadow-sm">
          <div className="border-b p-4">
            <h3 className="font-semibold">Top 10 Products by Revenue</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium text-right">Units Sold</th>
                <th className="px-4 py-2 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-right">{p.unitsSold}</td>
                  <td className="px-4 py-2 text-right font-medium">${p.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                    No sales data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Breakdown */}
        <div className="rounded-lg bg-white shadow-sm">
          <div className="border-b p-4">
            <h3 className="font-semibold">Sales by Payment Method</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium text-right">Count</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(paymentBreakdown).map(([method, data]) => (
                <tr key={method} className="border-b">
                  <td className="px-4 py-2">{method}</td>
                  <td className="px-4 py-2 text-right">{data.count}</td>
                  <td className="px-4 py-2 text-right font-medium">${data.amount.toFixed(2)}</td>
                </tr>
              ))}
              {Object.keys(paymentBreakdown).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                    No sales data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Sales */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b p-4">
          <h3 className="font-semibold">Daily Sales</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium text-right">Transactions</th>
              <th className="px-4 py-2 font-medium text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {dailySales.map((day) => (
              <tr key={day.date} className="border-b">
                <td className="px-4 py-2">{day.date}</td>
                <td className="px-4 py-2 text-right">{day.transactions}</td>
                <td className="px-4 py-2 text-right font-medium">${day.amount.toFixed(2)}</td>
              </tr>
            ))}
            {dailySales.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                  No sales in selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InventoryReportView({ data }: { data: InventoryReport | null }) {
  if (!data) return null

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="border-b p-4">
        <h3 className="font-semibold">Inventory Movement</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium text-right">Current Stock</th>
              <th className="px-4 py-2 font-medium text-right">Min Threshold</th>
              <th className="px-4 py-2 font-medium text-right">Received</th>
              <th className="px-4 py-2 font-medium text-right">Sold</th>
              <th className="px-4 py-2 font-medium text-right">Net Change</th>
              <th className="px-4 py-2 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.inventoryMovement.map((item, idx) => (
              <tr key={idx} className={`border-b ${item.belowThreshold ? 'bg-yellow-50' : ''}`}>
                <td className="px-4 py-2 font-medium">{item.productName}</td>
                <td className="px-4 py-2 text-gray-500">{item.sku}</td>
                <td className="px-4 py-2">{item.category}</td>
                <td
                  className={`px-4 py-2 text-right font-medium ${
                    item.currentStock === 0
                      ? 'text-red-600'
                      : item.belowThreshold
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {item.currentStock}
                </td>
                <td className="px-4 py-2 text-right">{item.minimumThreshold}</td>
                <td className="px-4 py-2 text-right text-green-600">+{item.received}</td>
                <td className="px-4 py-2 text-right text-red-600">-{item.sold}</td>
                <td
                  className={`px-4 py-2 text-right font-medium ${
                    item.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.netChange >= 0 ? '+' : ''}
                  {item.netChange}
                </td>
                <td className="px-4 py-2 text-center">
                  {item.belowThreshold ? (
                    <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      LOW
                    </span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

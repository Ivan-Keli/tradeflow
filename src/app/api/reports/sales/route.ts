import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: any = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    dateFilter.lte = toDate
  }

  const where: any = { status: 'COMPLETED' }
  if (from || to) where.createdAt = dateFilter

  // Get all sales in period
  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: true,
      processedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Summary
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalTransactions = sales.length
  const averageSaleValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

  // Top 10 products by revenue
  const productRevenue: Record<string, { name: string; unitsSold: number; revenue: number }> = {}
  for (const sale of sales) {
    for (const item of sale.items) {
      if (!productRevenue[item.productId]) {
        productRevenue[item.productId] = { name: item.productName, unitsSold: 0, revenue: 0 }
      }
      productRevenue[item.productId].unitsSold += item.quantity
      productRevenue[item.productId].revenue += item.unitPrice * item.quantity
    }
  }
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Payment method breakdown
  const paymentBreakdown: Record<string, { count: number; amount: number }> = {}
  for (const sale of sales) {
    if (!paymentBreakdown[sale.paymentMethod]) {
      paymentBreakdown[sale.paymentMethod] = { count: 0, amount: 0 }
    }
    paymentBreakdown[sale.paymentMethod].count++
    paymentBreakdown[sale.paymentMethod].amount += sale.totalAmount
  }

  // Daily totals
  const dailyTotals: Record<string, { transactions: number; amount: number }> = {}
  for (const sale of sales) {
    const date = new Date(sale.createdAt).toISOString().split('T')[0]
    if (!dailyTotals[date]) {
      dailyTotals[date] = { transactions: 0, amount: 0 }
    }
    dailyTotals[date].transactions++
    dailyTotals[date].amount += sale.totalAmount
  }
  const dailySales = Object.entries(dailyTotals)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({
    summary: { totalRevenue, totalTransactions, averageSaleValue },
    topProducts,
    paymentBreakdown,
    dailySales,
  })
}

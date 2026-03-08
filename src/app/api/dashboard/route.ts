import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [salesToday, lowStockItems, recentSales, totalProducts, totalSuppliers, outOfStockCount] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: today }, status: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.inventory.findMany({
        where: {
          OR: [
            { quantity: { lt: 10 } }, // We'll filter properly client-side since Prisma can't compare fields easily
          ],
        },
        include: { product: true },
      }),
      prisma.sale.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          processedBy: { select: { name: true } },
          items: true,
        },
      }),
      prisma.product.count(),
      prisma.supplier.count(),
      prisma.inventory.count({
        where: { quantity: 0 },
      }),
    ])

  // Filter low stock items properly (quantity < minimumThreshold and quantity > 0)
  const actualLowStock = lowStockItems.filter(
    (inv) => inv.quantity < inv.minimumThreshold && inv.quantity > 0
  )

  return NextResponse.json({
    kpis: {
      salesTodayAmount: salesToday._sum.totalAmount || 0,
      transactionsToday: salesToday._count,
      lowStockCount: actualLowStock.length,
      outOfStockCount,
      totalProducts,
      totalSuppliers,
    },
    recentSales,
    lowStockItems: actualLowStock,
  })
}

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

  // Current stock levels
  const products = await prisma.product.findMany({
    include: {
      category: true,
      inventory: true,
    },
    orderBy: { name: 'asc' },
  })

  // Deliveries in period (units received)
  const deliveryWhere: any = {}
  if (from || to) deliveryWhere.delivery = { dateReceived: dateFilter }

  const deliveryItems = await prisma.deliveryItem.findMany({
    where: deliveryWhere,
    include: { delivery: true },
  })

  // Sales in period (units sold)
  const saleWhere: any = {}
  if (from || to) saleWhere.sale = { createdAt: dateFilter, status: 'COMPLETED' }

  const saleItems = await prisma.saleItem.findMany({
    where: saleWhere,
    include: { sale: true },
  })

  // Build per-product movement
  const receivedByProduct: Record<string, number> = {}
  for (const item of deliveryItems) {
    receivedByProduct[item.productId] = (receivedByProduct[item.productId] || 0) + item.quantity
  }

  const soldByProduct: Record<string, number> = {}
  for (const item of saleItems) {
    soldByProduct[item.productId] = (soldByProduct[item.productId] || 0) + item.quantity
  }

  const inventoryMovement = products.map((product) => {
    const currentStock = product.inventory?.quantity ?? 0
    const threshold = product.inventory?.minimumThreshold ?? 10
    const received = receivedByProduct[product.id] || 0
    const sold = soldByProduct[product.id] || 0
    const netChange = received - sold

    return {
      productName: product.name,
      sku: product.sku || '',
      category: product.category.name,
      currentStock,
      minimumThreshold: threshold,
      received,
      sold,
      netChange,
      belowThreshold: currentStock < threshold,
    }
  })

  return NextResponse.json({ inventoryMovement })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  // Staff can only see their own sales
  const where: any = {}
  if (session.user.role === 'STAFF') {
    where.userId = session.user.id
  } else if (userId) {
    where.userId = userId
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      processedBy: { select: { name: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(sales)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { items, paymentMethod } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Verify all stock is available
      for (const item of items) {
        const inv = await tx.inventory.findUnique({
          where: { productId: item.productId },
        })
        if (!inv || inv.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}`)
        }
      }

      // 2. Calculate total
      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + item.unitPrice * item.quantity,
        0
      )

      // 3. Create the sale
      const newSale = await tx.sale.create({
        data: {
          userId: session.user.id,
          totalAmount,
          paymentMethod: paymentMethod || 'CASH',
          status: 'COMPLETED',
        },
      })

      // 4. Create sale items and decrement inventory
      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        })

        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        })
      }

      return tx.sale.findUnique({
        where: { id: newSale.id },
        include: { items: true, processedBy: { select: { name: true } } },
      })
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error: any) {
    const status = error.message?.includes('Insufficient stock') ? 409 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to process sale' },
      { status }
    )
  }
}

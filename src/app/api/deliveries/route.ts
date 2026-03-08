import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { supplierId, dateReceived, notes, items } = await req.json()

    const delivery = await prisma.$transaction(async (tx) => {
      const newDelivery = await tx.delivery.create({
        data: {
          supplierId,
          dateReceived: dateReceived ? new Date(dateReceived) : new Date(),
          notes,
        },
      })

      for (const item of items) {
        await tx.deliveryItem.create({
          data: {
            deliveryId: newDelivery.id,
            productId: item.productId,
            productName: item.productName,
            quantity: parseInt(item.quantity),
          },
        })

        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { increment: parseInt(item.quantity) } },
        })
      }

      return tx.delivery.findUnique({
        where: { id: newDelivery.id },
        include: { items: true },
      })
    })

    return NextResponse.json(delivery, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to log delivery' },
      { status: 500 }
    )
  }
}

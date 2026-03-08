import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { name, sku, categoryId, supplierId, price, minimumThreshold } = body

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name,
          sku,
          categoryId,
          supplierId,
          price: parseFloat(price),
        },
      })

      if (minimumThreshold !== undefined) {
        await tx.inventory.update({
          where: { productId: id },
          data: { minimumThreshold: parseInt(minimumThreshold) },
        })
      }

      return tx.product.findUnique({
        where: { id },
        include: { category: true, supplier: true, inventory: true },
      })
    })

    return NextResponse.json(product)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Check if product has sale items
    const saleItems = await prisma.saleItem.findFirst({
      where: { productId: id },
    })

    if (saleItems) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing sales records' },
        { status: 409 }
      )
    }

    // Delete inventory first, then product
    await prisma.$transaction(async (tx) => {
      await tx.inventory.deleteMany({ where: { productId: id } })
      await tx.deliveryItem.deleteMany({ where: { productId: id } })
      await tx.product.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'Product deleted' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}

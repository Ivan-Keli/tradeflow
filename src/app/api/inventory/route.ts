import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    include: {
      category: true,
      supplier: true,
      inventory: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, sku, categoryId, supplierId, price, quantity, minimumThreshold } = body

    // Use transaction to create product + inventory together
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          sku,
          categoryId,
          supplierId,
          price: parseFloat(price),
        },
      })

      await tx.inventory.create({
        data: {
          productId: newProduct.id,
          quantity: parseInt(quantity) || 0,
          minimumThreshold: parseInt(minimumThreshold) || 10,
        },
      })

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: { category: true, supplier: true, inventory: true },
      })
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}

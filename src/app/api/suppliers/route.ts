import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: { select: { products: true, deliveries: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(suppliers)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, contactInfo, address } = await req.json()

    const supplier = await prisma.supplier.create({
      data: { name, contactInfo, address },
      include: {
        _count: { select: { products: true, deliveries: true } },
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create supplier' },
      { status: 500 }
    )
  }
}

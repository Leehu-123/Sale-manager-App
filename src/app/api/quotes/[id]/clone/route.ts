import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const original = await prisma.quote.findUnique({
      where: { id, deletedAt: null },
      include: { items: true },
    })
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const count = await prisma.quote.count()
    const code = `BG-${String(count + 1).padStart(6, '0')}`

    const clone = await prisma.quote.create({
      data: {
        code,
        customerId: original.customerId,
        opportunityId: original.opportunityId,
        createdById: session.user.id,
        status: 'DRAFT',
        shippingCost: original.shippingCost,
        installationCost: original.installationCost,
        vatRate: original.vatRate,
        subtotal: original.subtotal,
        vatAmount: original.vatAmount,
        total: original.total,
        terms: original.terms,
        notes: original.notes,
        items: {
          create: original.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            specification: item.specification,
            thickness: item.thickness,
            length: item.length,
            width: item.width,
            area: item.area,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: { items: true },
    })

    await createAuditLog(session.user.id, 'CLONE', 'quote', clone.id, { fromQuoteId: id })
    return NextResponse.json(clone, { status: 201 })
  } catch (error) {
    console.error('Error cloning quote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const quote = await prisma.quote.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        opportunity: { select: { id: true, name: true, code: true } },
        items: { include: { product: true }, orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session.user.role === 'SALES' && quote.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const existing = await prisma.quote.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session.user.role === 'SALES' && existing.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { items, ...quoteData } = body

    let subtotal = 0
    const processedItems = (items || []).map((item: Record<string, unknown>, index: number) => {
      const length = item.length as number || 0
      const width = item.width as number || 0
      const area = length && width ? Math.round(length * width * 100) / 100 : (item.area as number || 0)
      const quantity = item.quantity as number || 1
      const unitPrice = item.unitPrice as number || 0
      const discount = item.discount as number || 0
      const baseAmount = (area || quantity) * unitPrice
      const total = baseAmount - (baseAmount * discount / 100)
      subtotal += total
      return {
        productId: item.productId || null,
        description: item.description || '',
        specification: item.specification || null,
        thickness: item.thickness || null,
        length: length || null,
        width: width || null,
        area: area || null,
        quantity,
        unitPrice,
        discount,
        total: Math.round(total),
        sortOrder: index,
      }
    })

    subtotal += (quoteData.shippingCost || 0) + (quoteData.installationCost || 0)
    const vatRate = quoteData.vatRate ?? existing.vatRate
    const vatAmount = Math.round(subtotal * vatRate / 100)
    const total = subtotal + vatAmount

    const quote = await prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } })
      return tx.quote.update({
        where: { id },
        data: {
          customerId: quoteData.customerId || existing.customerId,
          opportunityId: quoteData.opportunityId ?? existing.opportunityId,
          status: quoteData.status || existing.status,
          expiryDate: quoteData.expiryDate ? new Date(quoteData.expiryDate) : existing.expiryDate,
          shippingCost: quoteData.shippingCost ?? existing.shippingCost,
          installationCost: quoteData.installationCost ?? existing.installationCost,
          vatRate,
          subtotal,
          vatAmount,
          total,
          terms: quoteData.terms ?? existing.terms,
          notes: quoteData.notes ?? existing.notes,
          items: { create: processedItems },
        },
        include: { customer: true, items: true },
      })
    })

    await createAuditLog(session.user.id, 'UPDATE', 'quote', id, { status: quoteData.status })
    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'SALES') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    await prisma.quote.update({ where: { id }, data: { deletedAt: new Date() } })
    await createAuditLog(session.user.id, 'DELETE', 'quote', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

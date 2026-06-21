import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId } = session.user
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const customerId = searchParams.get('customerId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where: Record<string, unknown> = { deletedAt: null }
    if (role === 'SALES') where.createdById = userId
    if (status) where.status = status
    if (customerId) where.customerId = customerId
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { customer: { name: { contains: search } } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.quote.findMany({
        where: where as never,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true, code: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quote.count({ where: where as never }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { items, ...quoteData } = body

    // Auto-generate code
    const count = await prisma.quote.count()
    const code = `BG-${String(count + 1).padStart(6, '0')}`

    // Calculate totals
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
    const vatRate = quoteData.vatRate ?? 10
    const vatAmount = Math.round(subtotal * vatRate / 100)
    const total = subtotal + vatAmount

    const quote = await prisma.quote.create({
      data: {
        code,
        customerId: quoteData.customerId,
        opportunityId: quoteData.opportunityId || null,
        createdById: session.user.id,
        status: quoteData.status || 'DRAFT',
        expiryDate: quoteData.expiryDate ? new Date(quoteData.expiryDate) : null,
        shippingCost: quoteData.shippingCost || 0,
        installationCost: quoteData.installationCost || 0,
        vatRate,
        subtotal,
        vatAmount,
        total,
        terms: quoteData.terms || null,
        notes: quoteData.notes || null,
        items: { create: processedItems },
      },
      include: {
        customer: { select: { name: true } },
        items: true,
      },
    })

    await createAuditLog(session.user.id, 'CREATE', 'quote', quote.id, { code })
    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

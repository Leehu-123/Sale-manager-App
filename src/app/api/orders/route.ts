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
  const paymentStatus = searchParams.get('paymentStatus') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where: Record<string, unknown> = { deletedAt: null }
    if (role === 'SALES') where.assignedToId = userId
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { customer: { name: { contains: search } } },
        { projectName: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where: where as never,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, name: true } },
          quote: { select: { id: true, code: true } },
          _count: { select: { items: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: where as never }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { items: bodyItems, quoteId, ...orderData } = body

    const count = await prisma.order.count()
    const code = `DH-${String(count + 1).padStart(6, '0')}`

    let itemsToCreate = bodyItems || []

    // If from quote, copy items
    if (quoteId && !bodyItems?.length) {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true },
      })
      if (quote) {
        itemsToCreate = quote.items.map((item) => ({
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
        }))
      }
    }

    // Calculate totals
    let subtotal = 0
    const processedItems = itemsToCreate.map((item: Record<string, unknown>, index: number) => {
      const total = item.total as number || 0
      subtotal += total
      return { ...item, sortOrder: item.sortOrder ?? index }
    })

    const discount = orderData.discount || 0
    const vatRate = orderData.vatRate ?? 10
    const afterDiscount = subtotal - discount
    const vatAmount = Math.round(afterDiscount * vatRate / 100)
    const total = afterDiscount + vatAmount

    const order = await prisma.order.create({
      data: {
        code,
        customerId: orderData.customerId,
        opportunityId: orderData.opportunityId || null,
        quoteId: quoteId || null,
        assignedToId: orderData.assignedToId || session.user.id,
        projectName: orderData.projectName || null,
        status: 'NEW',
        paymentStatus: 'UNPAID',
        subtotal,
        discount,
        vatRate,
        vatAmount,
        total,
        paidAmount: 0,
        remainingAmount: total,
        signedDate: orderData.signedDate ? new Date(orderData.signedDate) : null,
        expectedDeliveryDate: orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate) : null,
        notes: orderData.notes || null,
        items: { create: processedItems },
      },
      include: { customer: true, items: true },
    })

    await createAuditLog(session.user.id, 'CREATE', 'order', order.id, { code })
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

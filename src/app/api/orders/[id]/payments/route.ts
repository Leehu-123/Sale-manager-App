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
    const payments = await prisma.orderPayment.findMany({
      where: { orderId: id },
      include: { createdBy: { select: { name: true } } },
      orderBy: { paymentDate: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const payment = await prisma.orderPayment.create({
      data: {
        orderId: id,
        amount: body.amount,
        paymentDate: new Date(body.paymentDate),
        method: body.method || null,
        reference: body.reference || null,
        notes: body.notes || null,
        createdById: session.user.id,
      },
    })

    // Update order payment totals
    const allPayments = await prisma.orderPayment.findMany({ where: { orderId: id } })
    const paidAmount = allPayments.reduce((sum, p) => sum + p.amount, 0)
    const remainingAmount = order.total - paidAmount

    let paymentStatus: 'UNPAID' | 'DEPOSITED' | 'PARTIAL' | 'FULLY_PAID' = 'UNPAID'
    if (paidAmount >= order.total) paymentStatus = 'FULLY_PAID'
    else if (paidAmount > order.total * 0.5) paymentStatus = 'PARTIAL'
    else if (paidAmount > 0) paymentStatus = 'DEPOSITED'

    await prisma.order.update({
      where: { id },
      data: { paidAmount, remainingAmount: Math.max(0, remainingAmount), paymentStatus },
    })

    await createAuditLog(session.user.id, 'PAYMENT', 'order', id, { amount: body.amount, paidAmount })
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error adding payment:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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
    const order = await prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        quote: { select: { id: true, code: true } },
        opportunity: { select: { id: true, name: true, code: true } },
        items: { include: { product: true }, orderBy: { sortOrder: 'asc' } },
        payments: { include: { createdBy: { select: { name: true } } }, orderBy: { paymentDate: 'desc' } },
      },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session.user.role === 'SALES' && order.assignedToId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session.user.role === 'SALES' && existing.assignedToId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        paymentStatus: body.paymentStatus ?? existing.paymentStatus,
        projectName: body.projectName ?? existing.projectName,
        expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : existing.expectedDeliveryDate,
        notes: body.notes ?? existing.notes,
      },
      include: { customer: true, items: true, payments: true },
    })

    await createAuditLog(session.user.id, 'UPDATE', 'order', id, { status: body.status })
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

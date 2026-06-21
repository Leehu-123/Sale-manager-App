import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { customerSchema } from '@/lib/validations'
import { isSales, isAdminOrManager, checkOwnership, createAuditLog } from '@/lib/authorization'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user
    const { id } = await context.params

    // Check ownership for SALES
    if (isSales(role)) {
      const hasAccess = await checkOwnership(role, userId, 'customer', id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, phone: true } },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { id: true, name: true } } },
        },
        opportunities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        quotes: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          where: { status: { not: 'DONE' } },
          orderBy: { dueDate: 'asc' },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user
    const { id } = await context.params

    // Check ownership for SALES
    if (isSales(role)) {
      const hasAccess = await checkOwnership(role, userId, 'customer', id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = customerSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check duplicate phone (exclude current)
    if (data.phone) {
      const dup = await prisma.customer.findFirst({
        where: { phone: data.phone, deletedAt: null, id: { not: id } },
      })
      if (dup) {
        return NextResponse.json(
          { error: 'Số điện thoại đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Check duplicate email (exclude current)
    if (data.email && data.email !== '') {
      const dup = await prisma.customer.findFirst({
        where: { email: data.email, deletedAt: null, id: { not: id } },
      })
      if (dup) {
        return NextResponse.json(
          { error: 'Email đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // SALES users cannot reassign
    if (isSales(role)) {
      delete data.assignedToId
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        email: data.email === '' ? null : data.email,
        nextFollowUpDate: data.nextFollowUpDate !== undefined
          ? (data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null)
          : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    })

    await createAuditLog(userId, 'UPDATE', 'Customer', id, {
      changes: data,
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user
    const { id } = await context.params

    if (!isAdminOrManager(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 })
    }

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await createAuditLog(userId, 'DELETE', 'Customer', id, {
      code: customer.code,
      name: customer.name,
    })

    return NextResponse.json({ message: 'Đã xóa khách hàng' })
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

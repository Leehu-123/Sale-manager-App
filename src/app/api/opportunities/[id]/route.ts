import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { opportunitySchema } from '@/lib/validations'
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

    if (isSales(role)) {
      const hasAccess = await checkOwnership(role, userId, 'opportunity', id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const opportunity = await prisma.opportunity.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, code: true, phone: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        quotes: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Không tìm thấy cơ hội' }, { status: 404 })
    }

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('GET /api/opportunities/[id] error:', error)
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

    if (isSales(role)) {
      const hasAccess = await checkOwnership(role, userId, 'opportunity', id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const existing = await prisma.opportunity.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy cơ hội' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = opportunitySchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // If changing stage to LOST, require lossReason
    if (data.stage === 'LOST' && !data.lossReason && !existing.lossReason) {
      return NextResponse.json(
        { error: 'Vui lòng nhập lý do thất bại khi chuyển trạng thái sang Chốt thất bại' },
        { status: 400 }
      )
    }

    // SALES cannot reassign
    if (isSales(role)) {
      delete data.assignedToId
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate !== undefined
          ? (data.expectedCloseDate ? new Date(data.expectedCloseDate) : null)
          : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })

    // Audit log for stage changes
    if (data.stage && data.stage !== existing.stage) {
      const action = data.stage === 'WON' ? 'OPPORTUNITY_WON' : 'STAGE_CHANGE'
      await createAuditLog(userId, action, 'Opportunity', id, {
        code: opportunity.code,
        from: existing.stage,
        to: data.stage,
      })
    } else {
      await createAuditLog(userId, 'UPDATE', 'Opportunity', id, {
        changes: data,
      })
    }

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('PUT /api/opportunities/[id] error:', error)
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

    const opportunity = await prisma.opportunity.findFirst({
      where: { id, deletedAt: null },
    })
    if (!opportunity) {
      return NextResponse.json({ error: 'Không tìm thấy cơ hội' }, { status: 404 })
    }

    await prisma.opportunity.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await createAuditLog(userId, 'DELETE', 'Opportunity', id, {
      code: opportunity.code,
      name: opportunity.name,
    })

    return NextResponse.json({ message: 'Đã xóa cơ hội' })
  } catch (error) {
    console.error('DELETE /api/opportunities/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

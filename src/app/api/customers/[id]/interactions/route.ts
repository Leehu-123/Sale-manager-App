import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { interactionSchema } from '@/lib/validations'
import { isSales, checkOwnership, createAuditLog } from '@/lib/authorization'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user
    const { id: customerId } = await context.params

    // Check customer ownership for SALES
    if (isSales(role)) {
      const hasAccess = await checkOwnership(role, userId, 'customer', customerId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const interactions = await prisma.customerInteraction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(interactions)
  } catch (error) {
    console.error('GET /api/customers/[id]/interactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user
    const { id: customerId } = await context.params

    // Check customer ownership for SALES
    if (isSales(role)) {
      const hasAccess = await checkOwnership(role, userId, 'customer', customerId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = interactionSchema.safeParse({ ...body, customerId })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const interaction = await prisma.customerInteraction.create({
      data: {
        customerId,
        userId,
        type: data.type,
        content: data.content,
        result: data.result,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    // Update customer's nextFollowUpDate if provided
    if (data.nextFollowUpDate) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { nextFollowUpDate: new Date(data.nextFollowUpDate) },
      })
    }

    await createAuditLog(userId, 'CREATE', 'CustomerInteraction', interaction.id, {
      customerId,
      type: data.type,
    })

    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    console.error('POST /api/customers/[id]/interactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

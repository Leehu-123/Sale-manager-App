import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { opportunitySchema } from '@/lib/validations'
import { isSales, buildOwnershipFilter, createAuditLog } from '@/lib/authorization'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const stage = searchParams.get('stage')
    const assignedToId = searchParams.get('assignedToId')
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    const ownerFilter = isSales(role)
      ? { assignedToId: userId }
      : assignedToId
        ? { assignedToId }
        : {}

    const where: Record<string, unknown> = {
      ...ownerFilter,
      deletedAt: null,
      ...(stage && { stage }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { projectName: { contains: search } },
          { customer: { name: { contains: search } } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.opportunity.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/opportunities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user

    const body = await req.json()
    const parsed = opportunitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Auto-generate code
    const count = await prisma.opportunity.count()
    const code = `CH-${String(count + 1).padStart(6, '0')}`

    const assignedToId = isSales(role) ? userId : (data.assignedToId || userId)

    const opportunity = await prisma.opportunity.create({
      data: {
        code,
        name: data.name,
        customerId: data.customerId,
        projectName: data.projectName,
        assignedToId,
        products: data.products || [],
        estimatedArea: data.estimatedArea,
        estimatedValue: data.estimatedValue || 0,
        probability: data.probability || 50,
        stage: data.stage || 'NEW_LEAD',
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        lossReason: data.lossReason,
        competitor: data.competitor,
        notes: data.notes,
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })

    await createAuditLog(userId, 'CREATE', 'Opportunity', opportunity.id, {
      code: opportunity.code,
      name: opportunity.name,
    })

    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error('POST /api/opportunities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

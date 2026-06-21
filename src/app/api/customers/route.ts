import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { customerSchema } from '@/lib/validations'
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
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const type = searchParams.get('type')
    const assignedToId = searchParams.get('assignedToId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const ownerFilter = isSales(role)
      ? { assignedToId: userId }
      : assignedToId
        ? { assignedToId }
        : {}

    const where: Record<string, unknown> = {
      ...ownerFilter,
      deletedAt: null,
      ...(status && { status }),
      ...(source && { source }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
          { contactPerson: { contains: search } },
          { projectName: { contains: search } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/customers error:', error)
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
    const parsed = customerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check duplicate phone
    if (data.phone) {
      const existingPhone = await prisma.customer.findFirst({
        where: { phone: data.phone, deletedAt: null },
      })
      if (existingPhone) {
        return NextResponse.json(
          { error: 'Số điện thoại đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Check duplicate email
    if (data.email && data.email !== '') {
      const existingEmail = await prisma.customer.findFirst({
        where: { email: data.email, deletedAt: null },
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Auto-generate code
    const count = await prisma.customer.count()
    const code = `KH-${String(count + 1).padStart(6, '0')}`

    // If SALES and no assignedToId, assign to self
    const assignedToId = isSales(role) ? userId : (data.assignedToId || userId)

    const customer = await prisma.customer.create({
      data: {
        code,
        type: data.type,
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email === '' ? null : data.email,
        address: data.address,
        province: data.province,
        projectName: data.projectName,
        source: data.source,
        status: data.status || 'NEW',
        productNeeds: data.productNeeds || [],
        estimatedArea: data.estimatedArea,
        estimatedBudget: data.estimatedBudget,
        notes: data.notes,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
        assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    })

    await createAuditLog(userId, 'CREATE', 'Customer', customer.id, {
      code: customer.code,
      name: customer.name,
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

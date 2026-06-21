import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId } = session.user
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const type = searchParams.get('type') || ''
  const priority = searchParams.get('priority') || ''
  const filter = searchParams.get('filter') || '' // today, overdue, week
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where: Record<string, unknown> = {}
    if (role === 'SALES') where.assignedToId = userId
    if (status) where.status = status
    if (type) where.type = type
    if (priority) where.priority = priority

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (filter === 'today') {
      where.dueDate = { gte: today, lt: tomorrow }
    } else if (filter === 'overdue') {
      where.dueDate = { lt: today }
      where.status = { not: 'DONE' }
    } else if (filter === 'week') {
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)
      where.dueDate = { gte: today, lt: weekEnd }
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where: where as never,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          opportunity: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where: where as never }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    // SALES can only assign to self
    if (session.user.role === 'SALES' && body.assignedToId !== session.user.id) {
      return NextResponse.json({ error: 'Sales chỉ có thể tạo task cho bản thân' }, { status: 403 })
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        customerId: body.customerId || null,
        opportunityId: body.opportunityId || null,
        assignedToId: body.assignedToId || session.user.id,
        createdById: session.user.id,
        type: body.type,
        dueDate: new Date(body.dueDate),
        priority: body.priority || 'MEDIUM',
        status: 'TODO',
        notes: body.notes || null,
      },
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

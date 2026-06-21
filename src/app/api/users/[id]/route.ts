import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'SALES' && session.user.id !== (await params).id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        status: true, teamId: true, createdAt: true, updatedAt: true,
        team: true,
        kpis: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
        _count: { select: { customers: true, opportunities: true, quotes: true, orders: true } },
      },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const isSelf = session.user.id === id
  if (session.user.role !== 'ADMIN' && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (body.name) data.name = body.name
    if (body.phone !== undefined) data.phone = body.phone
    if (body.teamId !== undefined) data.teamId = body.teamId

    // Only ADMIN can change role and status
    if (session.user.role === 'ADMIN') {
      if (body.role) data.role = body.role
      if (body.status) data.status = body.status
    }

    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: data as never,
      select: { id: true, email: true, name: true, role: true, status: true, teamId: true },
    })

    if (body.role || body.status) {
      await createAuditLog(session.user.id, 'UPDATE', 'user', id, { role: body.role, status: body.status })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

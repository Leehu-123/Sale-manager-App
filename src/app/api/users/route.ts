import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const teamId = searchParams.get('teamId') || ''
  const status = searchParams.get('status') || ''

  try {
    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (teamId) where.teamId = teamId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const users = await prisma.user.findMany({
      where: where as never,
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        status: true, teamId: true, createdAt: true,
        team: { select: { id: true, name: true } },
        _count: { select: { customers: true, opportunities: true, orders: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 400 })

    const hashedPassword = await bcrypt.hash(body.password || '123456', 10)

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        phone: body.phone || null,
        role: body.role || 'SALES',
        teamId: body.teamId || null,
        status: 'ACTIVE',
      },
      select: { id: true, email: true, name: true, role: true, teamId: true },
    })

    await createAuditLog(session.user.id, 'CREATE', 'user', user.id, { email: body.email, role: body.role })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

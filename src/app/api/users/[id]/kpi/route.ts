import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  try {
    const kpis = await prisma.kPI.findMany({
      where: { userId: id, ...(month ? { month } : {}), ...(year ? { year } : {}) },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
    return NextResponse.json(kpis)
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  try {
    const body = await req.json()
    const kpi = await prisma.kPI.upsert({
      where: { userId_month_year: { userId: id, month: body.month, year: body.year } },
      update: {
        targetRevenue: body.targetRevenue || 0,
        targetNewCustomers: body.targetNewCustomers || 0,
        targetInteractions: body.targetInteractions || 0,
      },
      create: {
        userId: id,
        month: body.month,
        year: body.year,
        targetRevenue: body.targetRevenue || 0,
        targetNewCustomers: body.targetNewCustomers || 0,
        targetInteractions: body.targetInteractions || 0,
      },
    })
    return NextResponse.json(kpi)
  } catch (error) {
    console.error('Error setting KPI:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

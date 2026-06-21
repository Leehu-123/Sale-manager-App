import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId } = session.user
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  try {
    const where: any = {}
    if (role === 'SALES') where.userId = userId
    if (status) where.status = status

    const trips = await prisma.businessTrip.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { reports: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(trips)
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const count = await prisma.businessTrip.count()
    const code = `CT-${String(count + 1).padStart(6, '0')}`

    const trip = await prisma.businessTrip.create({
      data: {
        code,
        userId: session.user.id,
        title: body.title,
        destination: body.destination,
        purpose: body.purpose || null,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        estimatedCost: body.estimatedCost || 0,
        estimatedTransportCost: body.estimatedTransportCost || 0,
        estimatedFoodCost: body.estimatedFoodCost || 0,
        estimatedAccommodationCost: body.estimatedAccommodationCost || 0,
        estimatedEntertainmentCost: body.estimatedEntertainmentCost || 0,
        entertainmentNotes: body.entertainmentNotes || null,
        status: 'PROPOSED',
        notes: body.notes || null,
      },
    })

    await createAuditLog(session.user.id, 'CREATE', 'trip', trip.id, { code })
    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

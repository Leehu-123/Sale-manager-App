import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const trip = await prisma.businessTrip.findUnique({ where: { id } })
    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session.user.role === 'SALES' && trip.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const imagesStr = body.images && body.images.length > 0 ? JSON.stringify(body.images) : null

    const report = await prisma.tripDailyReport.create({
      data: {
        tripId: id,
        date: new Date(body.date),
        location: body.location || null,
        content: body.content,
        results: body.results || null,
        newClients: parseInt(body.newClients) || 0,
        oldClients: parseInt(body.oldClients) || 0,
        images: imagesStr,
      },
    })

    await createAuditLog(session.user.id, 'CREATE', 'trip_report', report.id)
    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating trip report:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

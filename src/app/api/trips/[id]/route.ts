import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const trip = await prisma.businessTrip.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        reports: { orderBy: { date: 'desc' } },
      },
    })
    
    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session.user.role === 'SALES' && trip.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const existing = await prisma.businessTrip.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    // Only Admin/Manager can approve/reject. Sales can only edit if PROPOSED
    if (session.user.role === 'SALES' && existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    
    const trip = await prisma.businessTrip.update({
      where: { id },
      data: {
        status: body.status !== undefined ? body.status : existing.status,
        actualCost: body.actualCost !== undefined ? body.actualCost : existing.actualCost,
        summary: body.summary !== undefined ? body.summary : existing.summary,
        totalNewClients: body.totalNewClients !== undefined ? body.totalNewClients : existing.totalNewClients,
        totalOldClients: body.totalOldClients !== undefined ? body.totalOldClients : existing.totalOldClients,
      },
    })

    await createAuditLog(session.user.id, 'UPDATE', 'trip', id, { status: body.status })
    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'SALES') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    await prisma.businessTrip.delete({ where: { id } })
    await createAuditLog(session.user.id, 'DELETE', 'trip', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

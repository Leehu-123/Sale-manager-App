import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/authorization'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } }
    })

    if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (team._count.users > 0) {
      return NextResponse.json({ error: 'Cannot delete team because it has users. Please reassign them first.' }, { status: 400 })
    }

    await prisma.team.delete({ where: { id } })
    await createAuditLog(session.user.id, 'DELETE', 'team', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

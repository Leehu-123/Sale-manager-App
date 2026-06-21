import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Role = 'ADMIN' | 'MANAGER' | 'SALES'

export async function checkAuth() {
  const session = await getSession()
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null }
  }
  return { error: null, user: session.user }
}

export function checkRole(userRole: string, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole as Role)
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN'
}

export function isManager(role: string): boolean {
  return role === 'MANAGER'
}

export function isAdminOrManager(role: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function isSales(role: string): boolean {
  return role === 'SALES'
}

// Build a where clause that filters by assignedToId for SALES users
export function buildOwnershipFilter(userRole: string, userId: string, fieldName: string = 'assignedToId') {
  if (isSales(userRole)) {
    return { [fieldName]: userId }
  }
  return {}
}

// Check if a SALES user owns a specific record
export async function checkOwnership(
  userRole: string,
  userId: string,
  entity: string,
  entityId: string
): Promise<boolean> {
  if (isAdminOrManager(userRole)) return true

  // For SALES users, check ownership
  switch (entity) {
    case 'customer': {
      const customer = await prisma.customer.findFirst({
        where: { id: entityId, assignedToId: userId },
      })
      return !!customer
    }
    case 'opportunity': {
      const opp = await prisma.opportunity.findFirst({
        where: { id: entityId, assignedToId: userId },
      })
      return !!opp
    }
    case 'quote': {
      const quote = await prisma.quote.findFirst({
        where: { id: entityId, createdById: userId },
      })
      return !!quote
    }
    case 'order': {
      const order = await prisma.order.findFirst({
        where: { id: entityId, assignedToId: userId },
      })
      return !!order
    }
    case 'task': {
      const task = await prisma.task.findFirst({
        where: { id: entityId, assignedToId: userId },
      })
      return !!task
    }
    default:
      return false
  }
}

// Create audit log entry
export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

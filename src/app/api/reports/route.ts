import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId } = session.user
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'revenue'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const now = new Date()
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const ownerFilter = role === 'SALES' ? { assignedToId: userId } : {}
  const creatorFilter = role === 'SALES' ? { createdById: userId } : {}

  try {
    switch (type) {
      case 'revenue': {
        const orders = await prisma.order.findMany({
          where: { ...ownerFilter, deletedAt: null, createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
          select: { total: true, paidAmount: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })

        const monthlyData: Record<string, { revenue: number; paid: number }> = {}
        orders.forEach(o => {
          const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`
          if (!monthlyData[key]) monthlyData[key] = { revenue: 0, paid: 0 }
          monthlyData[key].revenue += o.total
          monthlyData[key].paid += o.paidAmount
        })

        return NextResponse.json({
          type: 'revenue',
          data: Object.entries(monthlyData).map(([month, values]) => ({ month, ...values })),
          total: orders.reduce((s, o) => s + o.total, 0),
          totalPaid: orders.reduce((s, o) => s + o.paidAmount, 0),
        })
      }

      case 'users': {
        if (role === 'SALES') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const users = await prisma.user.findMany({
          where: { role: 'SALES', status: 'ACTIVE' },
          select: {
            id: true, name: true,
            orders: {
              where: { deletedAt: null, createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
              select: { total: true, paidAmount: true },
            },
            customers: { where: { createdAt: { gte: start, lte: end }, deletedAt: null }, select: { id: true } },
            kpis: { where: { month: now.getMonth() + 1, year: now.getFullYear() } },
          },
        })

        return NextResponse.json({
          type: 'users',
          data: users.map(u => ({
            name: u.name,
            revenue: u.orders.reduce((s, o) => s + o.total, 0),
            paid: u.orders.reduce((s, o) => s + o.paidAmount, 0),
            newCustomers: u.customers.length,
            targetRevenue: u.kpis[0]?.targetRevenue || 0,
            targetNewCustomers: u.kpis[0]?.targetNewCustomers || 0,
          })),
        })
      }

      case 'products': {
        const orderItems = await prisma.orderItem.findMany({
          where: {
            order: { ...ownerFilter, deletedAt: null, createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
          },
          include: { product: { select: { name: true, group: true } } },
        })

        const productData: Record<string, { name: string; revenue: number; count: number }> = {}
        orderItems.forEach(item => {
          const name = item.product?.name || item.description
          if (!productData[name]) productData[name] = { name, revenue: 0, count: 0 }
          productData[name].revenue += item.total
          productData[name].count += item.quantity
        })

        return NextResponse.json({
          type: 'products',
          data: Object.values(productData).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        })
      }

      case 'pipeline': {
        const opportunities = await prisma.opportunity.groupBy({
          by: ['stage'],
          where: { ...ownerFilter, deletedAt: null },
          _count: true,
          _sum: { estimatedValue: true },
        })

        return NextResponse.json({
          type: 'pipeline',
          data: opportunities.map(o => ({
            stage: o.stage,
            count: o._count,
            value: o._sum.estimatedValue || 0,
          })),
        })
      }

      case 'sources': {
        const customers = await prisma.customer.groupBy({
          by: ['source'],
          where: { ...ownerFilter, deletedAt: null, createdAt: { gte: start, lte: end } },
          _count: true,
        })

        return NextResponse.json({
          type: 'sources',
          data: customers.map(c => ({ source: c.source, count: c._count })),
        })
      }

      case 'receivables': {
        const orders = await prisma.order.findMany({
          where: { ...ownerFilter, deletedAt: null, status: { not: 'CANCELLED' }, remainingAmount: { gt: 0 } },
          include: { customer: { select: { name: true, code: true } }, assignedTo: { select: { name: true } } },
          orderBy: { remainingAmount: 'desc' },
        })

        return NextResponse.json({
          type: 'receivables',
          data: orders.map(o => ({
            code: o.code,
            customer: o.customer.name,
            total: o.total,
            paid: o.paidAmount,
            remaining: o.remainingAmount,
            assignedTo: o.assignedTo.name,
          })),
          totalReceivable: orders.reduce((s, o) => s + o.remainingAmount, 0),
        })
      }

      case 'tasks': {
        const taskStats = await prisma.task.groupBy({
          by: ['status'],
          where: { ...(role === 'SALES' ? { assignedToId: userId } : {}) },
          _count: true,
        })

        return NextResponse.json({
          type: 'tasks',
          data: taskStats.map(t => ({ status: t.status, count: t._count })),
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

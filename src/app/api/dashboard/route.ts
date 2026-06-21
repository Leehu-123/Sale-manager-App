import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { isSales, isAdminOrManager } from '@/lib/authorization'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Build ownership filter
    const ownerFilter = isSales(role) ? { assignedToId: userId } : {}
    const quoteOwnerFilter = isSales(role) ? { createdById: userId } : {}

    // === Revenue (current month) ===
    const orderAgg = await prisma.order.aggregate({
      where: {
        ...ownerFilter,
        deletedAt: null,
        status: { not: 'CANCELLED' },
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { total: true, paidAmount: true },
    })
    const totalRevenue = orderAgg._sum.total || 0
    const paidRevenue = orderAgg._sum.paidAmount || 0
    const unpaidRevenue = totalRevenue - paidRevenue

    // === New customers this month ===
    const newCustomers = await prisma.customer.count({
      where: {
        ...ownerFilter,
        deletedAt: null,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    // === Active opportunities ===
    const activeOpportunities = await prisma.opportunity.count({
      where: {
        ...ownerFilter,
        deletedAt: null,
        stage: { notIn: ['WON', 'LOST'] },
      },
    })

    const pipelineAgg = await prisma.opportunity.aggregate({
      where: {
        ...ownerFilter,
        deletedAt: null,
        stage: { notIn: ['WON', 'LOST'] },
      },
      _sum: { estimatedValue: true },
    })
    const pipelineValue = pipelineAgg._sum.estimatedValue || 0

    // === Quotes ===
    const quoteSent = await prisma.quote.count({
      where: {
        ...quoteOwnerFilter,
        deletedAt: null,
        status: 'SENT',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    const quotesPending = await prisma.quote.count({
      where: {
        ...quoteOwnerFilter,
        deletedAt: null,
        status: 'UNDER_REVIEW',
      },
    })

    // === Close rate ===
    const wonCount = await prisma.opportunity.count({
      where: { ...ownerFilter, deletedAt: null, stage: 'WON' },
    })
    const lostCount = await prisma.opportunity.count({
      where: { ...ownerFilter, deletedAt: null, stage: 'LOST' },
    })
    const closeRate = wonCount + lostCount > 0
      ? Math.round((wonCount / (wonCount + lostCount)) * 100 * 100) / 100
      : 0

    // === Tasks ===
    const taskOwnerFilter = isSales(role) ? { assignedToId: userId } : {}

    const tasksDueToday = await prisma.task.count({
      where: {
        ...taskOwnerFilter,
        status: { not: 'DONE' },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
    })

    const tasksOverdue = await prisma.task.count({
      where: {
        ...taskOwnerFilter,
        status: { notIn: ['DONE'] },
        dueDate: { lt: todayStart },
      },
    })

    // === Customers needing follow up ===
    const customersNeedFollowUp = await prisma.customer.count({
      where: {
        ...ownerFilter,
        deletedAt: null,
        OR: [
          { status: 'FOLLOW_UP' },
          { nextFollowUpDate: { lte: todayEnd } },
        ],
      },
    })

    // === Revenue by month (last 6 months) ===
    const revenueByMonth: { month: string; revenue: number; paid: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      const agg = await prisma.order.aggregate({
        where: {
          ...ownerFilter,
          deletedAt: null,
          status: { not: 'CANCELLED' },
          createdAt: { gte: mStart, lte: mEnd },
        },
        _sum: { total: true, paidAmount: true },
      })
      revenueByMonth.push({
        month: `${mStart.getMonth() + 1}/${mStart.getFullYear()}`,
        revenue: agg._sum.total || 0,
        paid: agg._sum.paidAmount || 0,
      })
    }

    // === Pipeline by stage ===
    const pipelineByStage = await prisma.opportunity.groupBy({
      by: ['stage'],
      where: { ...ownerFilter, deletedAt: null },
      _count: { id: true },
      _sum: { estimatedValue: true },
    })
    const pipelineByStageFormatted = pipelineByStage.map((s) => ({
      stage: s.stage,
      count: s._count.id,
      value: s._sum.estimatedValue || 0,
    }))

    // === Top products (top 5 by order value) ===
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          ...ownerFilter,
          deletedAt: null,
          status: { not: 'CANCELLED' },
        },
        productId: { not: null },
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    })

    const productIds = topProductsRaw
      .map((p) => p.productId)
      .filter((id): id is string => id !== null)

    const products = productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : []

    const productMap = new Map(products.map((p) => [p.id, p.name]))
    const topProducts = topProductsRaw.map((p) => ({
      name: productMap.get(p.productId!) || 'Unknown',
      revenue: p._sum.total || 0,
      count: p._count.id,
    }))

    // === Revenue by user (ADMIN/MANAGER only) ===
    let revenueByUser: { name: string; revenue: number }[] = []
    if (isAdminOrManager(role)) {
      const userRevenueRaw = await prisma.order.groupBy({
        by: ['assignedToId'],
        where: {
          deletedAt: null,
          status: { not: 'CANCELLED' },
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { total: true },
      })

      const userIds = userRevenueRaw.map((u) => u.assignedToId)
      const users = userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          })
        : []

      const userMap = new Map(users.map((u) => [u.id, u.name]))
      revenueByUser = userRevenueRaw.map((u) => ({
        name: userMap.get(u.assignedToId) || 'Unknown',
        revenue: u._sum.total || 0,
      }))
    }

    return NextResponse.json({
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      newCustomers,
      activeOpportunities,
      pipelineValue,
      quoteSent,
      quotesPending,
      closeRate,
      tasksDueToday,
      tasksOverdue,
      customersNeedFollowUp,
      revenueByMonth,
      pipelineByStage: pipelineByStageFormatted,
      topProducts,
      revenueByUser,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

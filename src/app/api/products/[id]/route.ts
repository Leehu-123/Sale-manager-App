import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations'
import { isAdmin, isAdminOrManager, createAuditLog } from '@/lib/authorization'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await context.params

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { quoteItems: true, orderItems: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user
    const { id } = await context.params

    if (!isAdminOrManager(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = productSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check duplicate code (exclude current)
    if (data.code && data.code !== existing.code) {
      const dup = await prisma.product.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      })
      if (dup) {
        return NextResponse.json(
          { error: 'Mã sản phẩm đã tồn tại' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    })

    await createAuditLog(userId, 'UPDATE', 'Product', id, { changes: data })

    return NextResponse.json(product)
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user
    const { id } = await context.params

    if (!isAdmin(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    })
    if (!product) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 })
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await createAuditLog(userId, 'DELETE', 'Product', id, {
      code: product.code,
      name: product.name,
    })

    return NextResponse.json({ message: 'Đã xóa sản phẩm' })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

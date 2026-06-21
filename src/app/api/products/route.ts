import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations'
import { isAdminOrManager, createAuditLog } from '@/lib/authorization'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const group = searchParams.get('group')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(group && { group }),
      ...(isActive !== null && isActive !== undefined && isActive !== '' && {
        isActive: isActive === 'true',
      }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { role, id: userId } = session.user

    if (!isAdminOrManager(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check duplicate code
    const existing = await prisma.product.findFirst({
      where: { code: data.code, deletedAt: null },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Mã sản phẩm đã tồn tại' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        code: data.code,
        name: data.name,
        group: data.group,
        unit: data.unit || 'SQM',
        referencePrice: data.referencePrice || 0,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    })

    await createAuditLog(userId, 'CREATE', 'Product', product.id, {
      code: product.code,
      name: product.name,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/rbac';

// GET /api/customers
async function getHandler(req, session) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách hàng:', error);
    return NextResponse.json({ error: 'Không thể lấy danh sách khách hàng' }, { status: 500 });
  }
}

// POST /api/customers
async function postHandler(req, session) {
  try {
    const body = await req.json();
    const { name, email, phone, tier, creditLimit } = body;

    if (!name) {
      return NextResponse.json({ error: 'Tên khách hàng là bắt buộc' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        tier: tier || 'RETAIL',
        creditLimit: creditLimit || 0,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo khách hàng:', error);
    return NextResponse.json({ error: 'Không thể tạo khách hàng' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, 'customers', 'view');
export const POST = withAuth(postHandler, 'customers', 'create');

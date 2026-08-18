import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/rbac';

// GET /api/pricing
async function getHandler(req, session) {
  try {
    const pricing = await prisma.pricingConfig.findMany({
      orderBy: { productType: 'asc' },
    });
    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Lỗi khi lấy cấu hình giá:', error);
    return NextResponse.json({ error: 'Không thể lấy cấu hình giá' }, { status: 500 });
  }
}

// POST /api/pricing
async function postHandler(req, session) {
  try {
    const body = await req.json();
    const { productType, thickness, pricePerSqM, unit } = body;

    if (!productType || thickness === undefined || pricePerSqM === undefined) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (productType, thickness, pricePerSqM)' }, { status: 400 });
    }

    const pricing = await prisma.pricingConfig.create({
      data: {
        productType,
        thickness,
        pricePerSqM,
        unit: unit || 'm2',
      },
    });

    return NextResponse.json(pricing, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo cấu hình giá:', error);
    return NextResponse.json({ error: 'Không thể tạo cấu hình giá' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, 'pricing', 'view');
export const POST = withAuth(postHandler, 'pricing', 'create');

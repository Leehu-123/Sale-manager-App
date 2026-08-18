import { NextResponse } from 'next/server';
import { calculateGlassPrice } from '@/lib/cpq-engine';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/rbac';

// POST /api/specifications/calculate
async function postHandler(req, session) {
  try {
    const body = await req.json();
    const { spec, pricingConfigId, customerId } = body;

    if (!spec || !pricingConfigId) {
      return NextResponse.json({ error: 'Thiếu thông tin thông số kỹ thuật (spec) hoặc cấu hình giá' }, { status: 400 });
    }

    // Lấy thông tin cấu hình giá
    const pricingConfig = await prisma.pricingConfig.findUnique({
      where: { id: pricingConfigId }
    });

    if (!pricingConfig) {
      return NextResponse.json({ error: 'Không tìm thấy cấu hình giá' }, { status: 404 });
    }

    // Lấy thông tin khách hàng để xác định hạng (tier)
    let customerTier = 'RETAIL';
    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (customer) {
        customerTier = customer.tier;
      }
    }

    // Map PricingConfig to what CPQ engine expects
    const configForCpq = {
      basePrice: pricingConfig.pricePerSqM,
      baseWasteRatio: 0.1 // Mặc định 10%
    };

    const result = calculateGlassPrice(spec, configForCpq, customerTier);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lỗi khi tính giá kính:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi tính giá' }, { status: 500 });
  }
}

export const POST = withAuth(postHandler, 'specifications', 'view');

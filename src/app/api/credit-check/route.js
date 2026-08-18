import { NextResponse } from 'next/server';
import { checkCredit } from '@/lib/credit-check';
import { withAuth } from '@/lib/rbac';

// POST /api/credit-check
async function postHandler(req, session) {
  try {
    const body = await req.json();
    const { customerId, newAmount } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Thiếu ID khách hàng (customerId)' }, { status: 400 });
    }

    const result = await checkCredit(customerId, newAmount || 0);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lỗi khi kiểm tra tín dụng:', error);
    if (error.message === 'Không tìm thấy khách hàng') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi kiểm tra tín dụng' }, { status: 500 });
  }
}

// Bất kỳ ai có quyền xem thông tin khách hàng đều có thể check credit
export const POST = withAuth(postHandler, 'customers', 'view');

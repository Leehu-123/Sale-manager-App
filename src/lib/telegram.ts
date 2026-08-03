import { formatCurrency } from './utils';

/**
 * Fire-and-forget Telegram notification helper.
 * Calls the Next.js API route /api/telegram/notify to send messages.
 * Never throws or blocks the UI.
 */
async function notify(target: string, message: string) {
  try {
    await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, message }),
    });
  } catch (err) {
    console.error('Telegram notification failed (silent):', err);
  }
}

// ===== BÁO GIÁ (QUOTES) =====

/** Khi Sale gửi báo giá → thông báo cho Admin */
export function notifyAdminQuoteSent(data: {
  quoteCode: string;
  customerName: string;
  createdByName: string;
  total: number;
  quoteId: string;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const message = `📋 <b>BÁO GIÁ MỚI CẦN DUYỆT</b>

Mã BG: <b>${data.quoteCode}</b>
Khách hàng: ${data.customerName}
Người tạo: ${data.createdByName}
Tổng tiền: <b>${formatCurrency(data.total)}</b>

🔗 <a href="${baseUrl}/quotes/${data.quoteId}">Xem chi tiết</a>`;

  notify('admin', message);
}

/** Khi Admin duyệt báo giá → thông báo cho người tạo */
export function notifyUserQuoteApproved(data: {
  quoteCode: string;
  customerName: string;
  createdById: string;
  quoteId: string;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const message = `✅ <b>BÁO GIÁ ĐÃ ĐƯỢC DUYỆT</b>

Mã BG: <b>${data.quoteCode}</b>
Khách hàng: ${data.customerName}

Bạn có thể tiến hành tạo đơn hàng.
🔗 <a href="${baseUrl}/quotes/${data.quoteId}">Xem chi tiết</a>`;

  notify(`user:${data.createdById}`, message);
}

// ===== ĐỀ XUẤT CÔNG TÁC (TRIPS) =====

/** Khi Sale tạo đề xuất công tác → thông báo cho Admin + Kế toán */
export function notifyAdminTripProposed(data: {
  tripId: string;
  title: string;
  destination: string;
  createdByName: string;
  estimatedCost: number;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const message = `🚗 <b>ĐỀ XUẤT CÔNG TÁC MỚI</b>

Tiêu đề: <b>${data.title}</b>
Người đề xuất: ${data.createdByName}
Điểm đến: ${data.destination}
Dự toán: <b>${formatCurrency(data.estimatedCost)}</b>

⏳ Đang chờ Kế toán duyệt chi phí.
🔗 <a href="${baseUrl}/trips/${data.tripId}">Xem chi tiết</a>`;

  notify('admin', message);
  notify('accountant', message);
}

/** Khi Kế toán duyệt chi phí → thông báo cho Admin + người đề xuất */
export function notifyTripAccountantApproved(data: {
  title: string;
  tripId: string;
  userId: string;
  estimatedCost: number;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Thông báo cho Admin/Lãnh đạo
  const adminMsg = `✅ <b>KẾ TOÁN ĐÃ DUYỆT CHI PHÍ</b>

Tiêu đề: <b>${data.title}</b>
Dự toán: <b>${formatCurrency(data.estimatedCost)}</b>

⏳ Đang chờ Lãnh đạo phê duyệt.
🔗 <a href="${baseUrl}/trips/${data.tripId}">Xem & Phê duyệt</a>`;

  notify('admin', adminMsg);

  // Thông báo cho người đề xuất
  const userMsg = `✅ <b>KẾ TOÁN ĐÃ DUYỆT CHI PHÍ CÔNG TÁC</b>

Tiêu đề: <b>${data.title}</b>

Chi phí đề xuất đã được Kế toán xác nhận. Đang chờ Lãnh đạo phê duyệt.
🔗 <a href="${baseUrl}/trips/${data.tripId}">Xem chi tiết</a>`;

  notify(`user:${data.userId}`, userMsg);
}

/** Khi Lãnh đạo phê duyệt cuối → thông báo cho người đề xuất + Kế toán */
export function notifyUserTripApproved(data: {
  title: string;
  userId: string;
  tripId: string;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const message = `✅ <b>LÃNH ĐẠO ĐÃ PHÊ DUYỆT CÔNG TÁC</b>

Tiêu đề: <b>${data.title}</b>

Bạn có thể bắt đầu chuyến công tác.
🔗 <a href="${baseUrl}/trips/${data.tripId}">Xem chi tiết</a>`;

  notify(`user:${data.userId}`, message);
  notify('accountant', message);
}

/** Khi từ chối đề xuất → thông báo cho người đề xuất */
export function notifyUserTripRejected(data: {
  title: string;
  userId: string;
  tripId: string;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const message = `❌ <b>ĐỀ XUẤT CÔNG TÁC BỊ TỪ CHỐI</b>

Tiêu đề: <b>${data.title}</b>

Vui lòng liên hệ quản lý để biết thêm chi tiết.
🔗 <a href="${baseUrl}/trips/${data.tripId}">Xem chi tiết</a>`;

  notify(`user:${data.userId}`, message);
}

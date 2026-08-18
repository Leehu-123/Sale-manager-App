// ============================================================
// Webhook Dispatcher - Gửi thông báo webhook khi có sự kiện
// Tự động gửi POST request đến các URL đã cấu hình
// ============================================================

import prisma from '@/lib/prisma';

/**
 * Gửi webhook đến tất cả URL đã cấu hình cho một sự kiện
 * @param {string} eventName - Tên sự kiện (vd: 'deal.won', 'lead.created')
 * @param {object} payload - Dữ liệu gửi kèm webhook
 */
export async function triggerWebhook(eventName, payload) {
  try {
    // Tìm tất cả cấu hình webhook đang hoạt động cho sự kiện này
    const webhookConfigs = await prisma.webhookConfig.findMany({
      where: {
        event: eventName,
        isActive: true,
      },
    });

    if (webhookConfigs.length === 0) {
      console.log(`[Webhook] Không có cấu hình webhook nào cho sự kiện: ${eventName}`);
      return;
    }

    console.log(
      `[Webhook] Đang gửi ${webhookConfigs.length} webhook cho sự kiện: ${eventName}`
    );

    // Gửi webhook đến từng URL đã cấu hình
    const promises = webhookConfigs.map(async (config) => {
      try {
        // Tạo AbortController để thiết lập timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout 10 giây

        const response = await fetch(config.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': eventName,
          },
          body: JSON.stringify({
            event: eventName,
            timestamp: new Date().toISOString(),
            data: payload,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(
          `[Webhook] Gửi thành công đến ${config.targetUrl} - Status: ${response.status}`
        );
      } catch (error) {
        // Bắt lỗi nhưng không throw - webhook không nên làm gián đoạn luồng chính
        console.error(
          `[Webhook] Lỗi khi gửi đến ${config.targetUrl}: ${error.message}`
        );
      }
    });

    // Chạy song song tất cả webhook (không chờ kết quả)
    await Promise.allSettled(promises);

    console.log(`[Webhook] Hoàn tất gửi webhook cho sự kiện: ${eventName}`);
  } catch (error) {
    // Bắt lỗi query database - không throw để không ảnh hưởng luồng chính
    console.error(`[Webhook] Lỗi khi truy vấn cấu hình webhook: ${error.message}`);
  }
}

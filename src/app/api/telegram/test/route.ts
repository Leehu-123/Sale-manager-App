import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const settingsFile = path.join(dataDir, 'settings.json');

export async function POST(request: Request) {
  try {
    const { chatId, botToken: paramToken, text: customText } = await request.json();

    let botToken = paramToken;
    if (!botToken && fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      botToken = settings.telegram_bot_token;
    }

    if (!botToken) {
      return NextResponse.json({ error: 'Chưa cấu hình Bot Token trong Cài đặt' }, { status: 400 });
    }
    if (!chatId) {
      return NextResponse.json({ error: 'Chưa nhập Chat ID' }, { status: 400 });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: customText || '✅ <b>Kết nối thành công!</b>\n\nHệ thống DAFA Sales đã kết nối với Telegram của bạn.\nBạn sẽ nhận thông báo khi có báo giá hoặc đề xuất công tác cần xử lý.',
        parse_mode: 'HTML',
      }),
    });
    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json({ error: result.description || 'Lỗi gửi tin nhắn. Kiểm tra lại Chat ID.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram test error:', error);
    return NextResponse.json({ error: 'Không thể kết nối Telegram' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const settingsFile = path.join(dataDir, 'settings.json');
const telegramUsersFile = path.join(dataDir, 'telegram-users.json');

function getSettings() {
  try {
    if (fs.existsSync(settingsFile)) {
      return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    }
  } catch { /* ignore */ }
  return {};
}

function getTelegramUsers(): Record<string, string> {
  try {
    if (fs.existsSync(telegramUsersFile)) {
      return JSON.parse(fs.readFileSync(telegramUsersFile, 'utf8'));
    }
  } catch { /* ignore */ }
  return {};
}

async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  return response.json();
}

export async function POST(request: Request) {
  try {
    const { target, message } = await request.json();

    if (!target || !message) {
      return NextResponse.json({ error: 'Missing target or message' }, { status: 400 });
    }

    const settings = getSettings();
    const botToken = settings.telegram_bot_token;

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 });
    }

    let chatId: string | null = null;

    if (target === 'admin') {
      chatId = settings.telegram_admin_chat_id;
    } else if (target.startsWith('user:')) {
      const userId = target.replace('user:', '');
      const users = getTelegramUsers();
      chatId = users[userId] || null;
    } else {
      // Direct chat ID
      chatId = target;
    }

    if (!chatId) {
      // Silently skip - user hasn't configured their Telegram Chat ID
      return NextResponse.json({ skipped: true, reason: 'Chat ID not found for target' });
    }

    const result = await sendTelegramMessage(botToken, chatId, message);

    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      return NextResponse.json({ error: result.description }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram notify error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

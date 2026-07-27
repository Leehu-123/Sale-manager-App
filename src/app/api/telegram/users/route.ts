import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const telegramUsersFile = path.join(dataDir, 'telegram-users.json');

export async function GET() {
  try {
    if (!fs.existsSync(telegramUsersFile)) {
      return NextResponse.json({});
    }
    const data = fs.readFileSync(telegramUsersFile, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const { userId, chatId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let users: Record<string, string> = {};
    if (fs.existsSync(telegramUsersFile)) {
      users = JSON.parse(fs.readFileSync(telegramUsersFile, 'utf8'));
    }

    if (chatId) {
      users[userId] = String(chatId);
    } else {
      delete users[userId];
    }

    fs.writeFileSync(telegramUsersFile, JSON.stringify(users, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save telegram user:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

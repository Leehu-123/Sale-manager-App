// ============================================================
// API Route: NextAuth Handler
// Xử lý tất cả request liên quan đến xác thực (đăng nhập, đăng xuất, session)
// ============================================================

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

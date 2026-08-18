// ============================================================
// Prisma Client Singleton cho Next.js
// Trong development, Next.js hot-reload tạo nhiều instance PrismaClient
// gây cạn kết nối database. Dùng globalThis để tái sử dụng instance.
// ============================================================

import { PrismaClient } from '@prisma/client';

// Khai báo biến global để TypeScript/IDE không báo lỗi
const globalForPrisma = globalThis;

// Tái sử dụng PrismaClient nếu đã tồn tại trên global, nếu không thì tạo mới
const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Chỉ gán vào global trong môi trường development
// Trong production, mỗi serverless function tự quản lý instance riêng
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cho phép chạy API routes với Prisma
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

module.exports = nextConfig;

// ============================================================
// NextAuth Configuration - Cấu hình xác thực người dùng
// Sử dụng CredentialsProvider với email/password
// ============================================================

import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions = {
  // Nhà cung cấp xác thực
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Mật khẩu', type: 'password' },
      },

      /**
       * Xác thực người dùng bằng email và mật khẩu
       * So sánh mật khẩu với hash lưu trong database qua bcryptjs
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập email và mật khẩu');
        }

        // Tìm người dùng theo email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Email hoặc mật khẩu không đúng');
        }

        // So sánh mật khẩu với hash đã lưu
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Email hoặc mật khẩu không đúng');
        }

        // Trả về thông tin người dùng (không bao gồm mật khẩu)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  // Cấu hình callback để gắn thêm thông tin vào token và session
  callbacks: {
    /**
     * JWT Callback - Gắn id và role vào token
     * Được gọi mỗi khi token được tạo hoặc cập nhật
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    /**
     * Session Callback - Gắn id và role vào session
     * Được gọi mỗi khi session được truy cập
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  // Cấu hình trang đăng nhập tùy chỉnh
  pages: {
    signIn: '/login',
  },

  // Sử dụng JWT strategy cho session
  session: {
    strategy: 'jwt',
  },

  // Secret cho mã hóa JWT
  secret: process.env.NEXTAUTH_SECRET,
};

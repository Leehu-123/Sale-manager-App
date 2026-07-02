import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      teamId: string | null
      companyId: string
      accessToken: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    teamId: string | null
    companyId: string
    accessToken: string
    name?: string | null
    email?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    teamId: string | null
    companyId: string
    accessToken: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập email và mật khẩu')
        }

        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              identifier: credentials.email,
              password: credentials.password,
            }),
            headers: { 'Content-Type': 'application/json' },
          })

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.message || 'Email hoặc mật khẩu không đúng')
          }

          // Fetch user profile to get role/team
          const profileRes = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${data.data.accessToken}`
            }
          })
          
          if (!profileRes.ok) {
            throw new Error('Không thể lấy thông tin người dùng')
          }
          
          const profileData = await profileRes.json()
          const userProfile = profileData.data

          const rawRole = Array.isArray(userProfile.roles)
            ? userProfile.roles[0]
            : userProfile.roles?.[0]?.name

          const roleMap: Record<string, string> = {
            owner: 'ADMIN',
            admin: 'ADMIN',
            administrator: 'ADMIN',
            manager: 'MANAGER',
            sales: 'SALES',
            user: 'SALES',
          }

          const normalizedRole = roleMap[String(rawRole || '').toLowerCase()] || 'SALES'

          return {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.fullName,
            role: normalizedRole,
            teamId: userProfile.teamId || null,
            companyId: userProfile.companyId,
            accessToken: data.data.accessToken,
          }
        } catch (error: any) {
          throw new Error(error.message || 'Đăng nhập thất bại')
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.teamId = user.teamId
        token.companyId = user.companyId
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.teamId = (token.teamId as string) || null
        session.user.companyId = token.companyId as string
        session.user.accessToken = token.accessToken as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

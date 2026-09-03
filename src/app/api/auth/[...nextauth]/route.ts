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

          const allRoles: string[] = (
            Array.isArray(userProfile.roles)
              ? userProfile.roles
              : (userProfile.roles ? [userProfile.roles] : [])
          ).map((r: any) => String(typeof r === 'string' ? r : r?.name || '').toLowerCase()).filter(Boolean)

          const roleMap: Record<string, string> = {
            owner: 'ADMIN',
            admin: 'ADMIN',
            administrator: 'ADMIN',
            manager: 'MANAGER',
            sales: 'SALES',
            kinhdoanh: 'SALES',
            user: 'SALES',
            sale_admin: 'SALE_ADMIN',
            sale_lead: 'SALE_LEAD',
            ketoan: 'ACCOUNTANT',
            accountant: 'ACCOUNTANT',
          }

          // Order of preference for Sale App: admin > sale_admin > sale_lead > accountant > sales > others
          const priority = ['owner', 'admin', 'administrator', 'sale_admin', 'sale_lead', 'accountant', 'ketoan', 'sales', 'kinhdoanh', 'manager', 'user']
          const chosenRole = allRoles.find(r => priority.includes(r)) || allRoles[0] || ''
          const normalizedRole = roleMap[chosenRole] || chosenRole.toUpperCase()

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
      if (token.role) {
        const r = String(token.role).toLowerCase()
        if (r === 'kinhdoanh' || r === 'sales' || r === 'user') token.role = 'SALES'
        else if (r === 'admin' || r === 'owner' || r === 'administrator') token.role = 'ADMIN'
        else if (r === 'sale_admin') token.role = 'SALE_ADMIN'
        else if (r === 'sale_lead') token.role = 'SALE_LEAD'
        else if (r === 'accountant' || r === 'ketoan') token.role = 'ACCOUNTANT'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        let role = (token.role as string) || ''
        if (role) {
          const r = role.toLowerCase()
          if (r === 'kinhdoanh' || r === 'sales' || r === 'user') role = 'SALES'
          else if (r === 'admin' || r === 'owner' || r === 'administrator') role = 'ADMIN'
          else if (r === 'sale_admin') role = 'SALE_ADMIN'
          else if (r === 'sale_lead') role = 'SALE_LEAD'
          else if (r === 'accountant' || r === 'ketoan') role = 'ACCOUNTANT'
        }
        session.user.role = role
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

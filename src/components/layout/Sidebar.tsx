'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn, ROLE_LABELS, getInitials } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Package,
  FileText,
  ShoppingCart,
  CheckSquare,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Diamond,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', icon: LayoutDashboard, href: '/' },
  { label: 'Khách hàng', icon: Users, href: '/customers' },
  { label: 'Pipeline', icon: GitBranch, href: '/pipeline' },
  { label: 'Sản phẩm', icon: Package, href: '/products' },
  { label: 'Báo giá', icon: FileText, href: '/quotes' },
  { label: 'Đơn hàng', icon: ShoppingCart, href: '/orders' },
  { label: 'Công việc', icon: CheckSquare, href: '/tasks' },
  { label: 'Báo cáo', icon: BarChart3, href: '/reports' },
  { label: 'Nhân viên', icon: UserCog, href: '/users', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Cài đặt', icon: Settings, href: '/settings', roles: ['ADMIN'] },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const userRole = session?.user?.role || ''
  const userName = session?.user?.name || 'Người dùng'

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <aside
      className={cn(
        'h-screen flex flex-col relative z-30 transition-all duration-300 print:hidden',
        'bg-white border-r border-surface-200',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 border-b border-surface-100 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">DF</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-surface-900">DAFA</h1>
              <p className="text-[10px] text-surface-500 -mt-0.5">Sales Manager</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DF</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <button
                  onClick={() => router.push(item.href)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full',
                    active 
                      ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm' 
                      : 'text-surface-600 hover:bg-brand-50 hover:text-brand-600',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon size={20} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section removed as requested to avoid duplication with Topbar */}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-surface-200 rounded-full shadow-sm flex items-center justify-center text-surface-500 hover:bg-surface-50 hover:text-surface-900 transition-colors z-40"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}

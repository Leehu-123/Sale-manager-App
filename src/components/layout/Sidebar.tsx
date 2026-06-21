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
        'h-screen flex flex-col sidebar-transition relative z-30',
        'gradient-navy text-white',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/10',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706] shadow-lg">
          <Diamond size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-slide-in">
            <h1 className="text-lg font-bold tracking-wide">DAFA</h1>
            <p className="text-[10px] text-white/60 -mt-0.5 tracking-widest">KÍNH XÂY DỰNG</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredNav.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <button
                  onClick={() => router.push(item.href)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon size={20} className={cn(active && 'text-[#f59e0b]')} />
                  {!collapsed && <span>{item.label}</span>}
                  {active && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'justify-center'
        )}>
          <div className="w-9 h-9 rounded-full bg-[#3b82f6] flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(userName)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-[11px] text-white/50">{ROLE_LABELS[userRole] || userRole}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-[#1e3a5f] hover:bg-gray-100 transition-colors z-40"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}

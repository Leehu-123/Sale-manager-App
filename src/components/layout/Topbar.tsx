'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getInitials, ROLE_LABELS } from '@/lib/utils'
import {
  Bell,
  Search,
  ChevronRight,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Menu,
} from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/': 'Tổng quan',
  '/customers': 'Khách hàng',
  '/pipeline': 'Pipeline bán hàng',
  '/products': 'Sản phẩm & Dịch vụ',
  '/quotes': 'Báo giá',
  '/orders': 'Đơn hàng',
  '/tasks': 'Công việc',
  '/reports': 'Báo cáo',
  '/users': 'Quản lý nhân viên',
  '/settings': 'Cài đặt',
}

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [{ label: 'Trang chủ', href: '/' }]
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length > 0) {
    const mainPath = '/' + segments[0]
    crumbs.push({ label: pageTitles[mainPath] || segments[0], href: mainPath })
  }
  if (segments.length > 1) {
    crumbs.push({ label: 'Chi tiết' })
  }
  return crumbs
}

export function Topbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userName = session?.user?.name || 'Người dùng'
  const userEmail = session?.user?.email || ''
  const userRole = session?.user?.role || ''

  const title = pageTitles[pathname] || pageTitles['/' + pathname.split('/')[1]] || 'Dafa Sales'
  const breadcrumbs = getBreadcrumbs(pathname)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shrink-0 print:hidden">
      {/* Left: Title + breadcrumbs */}
      <div className="hidden lg:block">
        <h1 className="text-lg font-semibold text-surface-900">{title}</h1>
        <div className="flex items-center gap-1 text-xs text-surface-400 -mt-0.5">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={10} />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-brand-600 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-surface-500">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Mobile left side */}
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={() => window.dispatchEvent(new Event('toggle-mobile-sidebar'))} className="p-2 rounded-lg hover:bg-surface-200 transition-colors duration-200">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <span className="text-white font-bold text-xs">DF</span>
          </div>
          <span className="font-bold text-surface-900 text-sm">DAFA Sales</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search toggle */}
        {showSearch && (
          <div className="animate-slide-in hidden sm:block">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhanh..."
                className="pl-8 pr-3 py-1.5 text-sm border border-surface-300 rounded-lg w-56 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                autoFocus
                onBlur={() => setShowSearch(false)}
              />
            </div>
          </div>
        )}
        {!showSearch && (
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg hover:bg-surface-200 transition-colors duration-200 text-surface-400 hidden sm:block"
          >
            <Search size={18} />
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button 
            className="p-2 rounded-lg hover:bg-surface-200 transition-colors duration-200 text-surface-400 relative"
            onClick={() => {
              const el = document.getElementById('noti-dropdown')
              if (el) el.classList.toggle('hidden')
            }}
          >
            <Bell size={18} />
          </button>
          <div id="noti-dropdown" className="hidden absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-surface-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-surface-100">
              <p className="text-sm font-semibold text-surface-900">Thông báo</p>
            </div>
            <div className="px-4 py-6 text-center text-surface-500 text-sm">
              Không có thông báo mới
            </div>
          </div>
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-surface-50 rounded-lg px-3 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
              {getInitials(userName)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-surface-900">{userName}</p>
              <p className="text-[10px] text-surface-500">{ROLE_LABELS[userRole] || userRole}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-surface-400 hidden sm:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-surface-200 py-1 animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-surface-100">
                <p className="text-sm font-medium text-surface-900">{userName}</p>
                <p className="text-xs text-surface-500">{userEmail}</p>
                <span className="badge bg-brand-100 text-brand-700 mt-1">
                  {ROLE_LABELS[userRole] || userRole}
                </span>
              </div>
              <a href="/users/me" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                <User size={16} /> Hồ sơ cá nhân
              </a>
              <a href="/settings" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                <Settings size={16} /> Cài đặt
              </a>
              <div className="border-t border-surface-100" />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

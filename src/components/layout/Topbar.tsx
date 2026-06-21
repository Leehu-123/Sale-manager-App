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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Left: Title + breadcrumbs */}
      <div>
        <h1 className="text-lg font-semibold text-[#1e293b]">{title}</h1>
        <div className="flex items-center gap-1 text-xs text-gray-400 -mt-0.5">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={10} />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-[#3b82f6] transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-500">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search toggle */}
        {showSearch && (
          <div className="animate-slide-in">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhanh..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg w-56"
                autoFocus
                onBlur={() => setShowSearch(false)}
              />
            </div>
          </div>
        )}
        {!showSearch && (
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Search size={18} />
          </button>
        )}

        {/* Notifications */}
        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold">
              {getInitials(userName)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-700">{userName}</p>
              <p className="text-[10px] text-gray-400">{ROLE_LABELS[userRole] || userRole}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                <User size={16} /> Hồ sơ cá nhân
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                <Settings size={16} /> Cài đặt
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getInitials, ROLE_LABELS } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import {
  Bell,
  Search,
  ChevronRight,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Menu,
  CheckCheck,
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

interface AppNotification {
  id: string
  title: string
  message: string
  linkUrl?: string
  isRead: boolean
  createdAt: string
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const userName = session?.user?.name || 'Người dùng'
  const userEmail = session?.user?.email || ''
  const userRole = session?.user?.role || ''

  const title = pageTitles[pathname] || pageTitles['/' + pathname.split('/')[1]] || 'Dafa Sales'
  const breadcrumbs = getBreadcrumbs(pathname)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications?limit=20')
      const data = res?.data || res
      setNotifications(data?.notifications || [])
      setUnreadCount(data?.unreadCount || 0)
    } catch {
      // Ignore errors silently
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
      // Poll mỗi 60 giây
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [session, fetchNotifications])

  const handleNotifClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await apiClient.patch(`/notifications/${notif.id}/read`, {}).catch(() => {})
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setShowNotif(false)
    if (notif.linkUrl) {
      router.push(notif.linkUrl)
    }
  }

  const handleMarkAllRead = async () => {
    await apiClient.patch('/notifications/read-all', {}).catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
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
        <div className="relative" ref={notifRef}>
          <button
            className="p-2 rounded-lg hover:bg-surface-200 transition-colors duration-200 text-surface-400 relative"
            onClick={() => { setShowNotif(v => !v); if (!showNotif) fetchNotifications(); }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-surface-200 py-0 z-50 max-h-[480px] flex flex-col">
              <div className="px-4 py-2.5 border-b border-surface-100 flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-surface-900">Thông báo {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}</p>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                    <CheckCheck size={12} /> Đọc tất cả
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-surface-500 text-sm">Không có thông báo nào</div>
                ) : (
                  notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left px-4 py-3 border-b border-surface-50 hover:bg-surface-50 transition-colors flex gap-3 items-start ${!notif.isRead ? 'bg-brand-50' : ''}`}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-brand-500' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-surface-900' : 'text-surface-600'}`}>{notif.title}</p>
                        <p className="text-[11px] text-surface-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-surface-400 mt-1">{new Date(notif.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
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

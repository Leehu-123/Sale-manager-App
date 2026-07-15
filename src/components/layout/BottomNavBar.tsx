'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, GitBranch, Users, CheckSquare, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  { label: 'Trang chủ', icon: LayoutDashboard, href: '/' },
  { label: 'Pipeline', icon: GitBranch, href: '/pipeline' },
  { label: 'Khách hàng', icon: Users, href: '/customers' },
  { label: 'Công việc', icon: CheckSquare, href: '/tasks' },
]

export function BottomNavBar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleMenuClick = () => {
    window.dispatchEvent(new Event('toggle-mobile-sidebar'))
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 z-40 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                active ? 'text-brand-600' : 'text-surface-500 hover:text-surface-900'
              )}
            >
              <Icon size={22} className={cn(active && "fill-brand-100")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
        <button
          onClick={handleMenuClick}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-surface-500 hover:text-surface-900 transition-colors"
        >
          <Menu size={22} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  )
}

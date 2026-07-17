import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { BottomNavBar } from '@/components/layout/BottomNavBar'
import { PushNotificationManager } from '@/components/PushNotificationManager'

import { LocationTracker } from '@/components/LocationTracker'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:block print:overflow-visible print:bg-white">
      <div className="print:hidden"><Sidebar /></div>
      <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
        <div className="print:hidden"><Topbar /></div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 bg-surface-50 print:p-0 print:overflow-visible print:bg-white print:block">
          {children}
        </main>
      </div>
      <div className="print:hidden"><BottomNavBar /></div>
      <PushNotificationManager />
      <LocationTracker />
    </div>
  )
}


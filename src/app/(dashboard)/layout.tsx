import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { BottomNavBar } from '@/components/layout/BottomNavBar'
import { PushNotificationManager } from '@/components/PushNotificationManager'

import { LocationTracker } from '@/components/LocationTracker'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 bg-surface-50">
          {children}
        </main>
      </div>
      <BottomNavBar />
      <PushNotificationManager />
      <LocationTracker />
    </div>
  )
}


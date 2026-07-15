'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { Bell } from 'lucide-react'

const NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BEXPYUiWQQTtZ-GsLwTQ14byVl4eEWEtm5mOCKzXZkxLp_rTHtKRT7wL1W3Yp7BvldSkkzMa9KPyGl45REcZYpU'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationManager() {
  const { data: session } = useSession()
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [message, setMessage] = useState('')

  const role = session?.user?.role

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      })
      setSubscription(sub)
      // Gửi sub lên server
      await apiClient.post('/notifications/subscribe', sub)
      setMessage('Đăng ký nhận thông báo thành công!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error(error)
      setMessage('Lỗi khi đăng ký thông báo.')
    }
  }

  if (!isSupported || !session) {
    return null
  }

  // Chỉ hiện cho ADMIN/MANAGER nếu họ chưa subscribe
  if ((role !== 'ADMIN' && role !== 'MANAGER') || subscription) {
    return null
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 lg:bottom-10">
      <div className="bg-white rounded-lg shadow-xl border border-surface-200 p-4 max-w-sm flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-brand-50 p-2 rounded-full text-brand-600">
            <Bell size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900">Bật thông báo</h4>
            <p className="text-xs text-surface-500 mt-1">
              Nhận thông báo ngay lập tức khi có báo giá hoặc đề xuất công tác cần duyệt.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setSubscription({} as any)} // hide prompt
            className="px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors"
          >
            Để sau
          </button>
          <button
            onClick={subscribeToPush}
            className="px-3 py-1.5 text-xs font-medium bg-brand-500 text-white hover:bg-brand-600 rounded-md transition-colors"
          >
            Bật ngay
          </button>
        </div>
        {message && <p className="text-xs text-brand-600 text-center">{message}</p>}
      </div>
    </div>
  )
}

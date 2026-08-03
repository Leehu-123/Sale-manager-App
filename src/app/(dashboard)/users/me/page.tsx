'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Shield, Send, Save, CheckCircle, AlertCircle, Sparkles, Key, Building } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/utils'

export default function UserProfilePage() {
  const { data: session } = useSession()
  
  const [telegramChatId, setTelegramChatId] = useState('')
  const [loading, setLoading] = useState(true)
  const [telegramSaving, setTelegramSaving] = useState(false)
  const [telegramSaved, setTelegramSaved] = useState(false)
  const [telegramTesting, setTelegramTesting] = useState(false)
  const [telegramTestResult, setTelegramTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const userRole = session?.user?.role || ''
  const userName = session?.user?.name || 'Người dùng'
  const userEmail = session?.user?.email || ''

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/telegram/users')
        .then(res => res.json())
        .then(data => {
          const userId = (session?.user as any)?.id
          if (userId && data[userId]) {
            setTelegramChatId(data[userId])
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [session?.user?.id])

  const handleSaveTelegramChatId = async () => {
    const userId = (session?.user as any)?.id
    if (!userId) { alert('Không xác định được ID tài khoản'); return }
    setTelegramSaving(true)
    setTelegramSaved(false)
    try {
      const res = await fetch('/api/telegram/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, chatId: telegramChatId, role: userRole })
      })
      if (res.ok) {
        setTelegramSaved(true)
        setTimeout(() => setTelegramSaved(false), 3000)
      } else {
        alert('Lỗi lưu Chat ID Telegram')
      }
    } catch { alert('Có lỗi xảy ra khi kết nối server') }
    finally { setTelegramSaving(false) }
  }

  const handleTestTelegram = async () => {
    const chatIdToTest = telegramChatId.trim()
    if (!chatIdToTest) { alert('Vui lòng nhập Chat ID và bấm Lưu trước khi test'); return }
    setTelegramTesting(true)
    setTelegramTestResult(null)
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: chatIdToTest,
          text: `✅ <b>Kết nối Telegram thành công!</b>\n\nXin chào <b>${userName}</b>,\nTài khoản nhân viên của bạn trên hệ thống DAFA Sales đã được liên kết với Telegram.\nBạn sẽ lập tức nhận được thông báo về tình trạng duyệt Báo giá và Phiếu đề xuất công tác!`
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTelegramTestResult({ ok: true, msg: 'Đã gửi tin nhắn test! Vui lòng mở ứng dụng Telegram của bạn để kiểm tra.' })
      } else {
        setTelegramTestResult({ ok: false, msg: data.error || 'Lỗi gửi tin nhắn test' })
      }
    } catch { setTelegramTestResult({ ok: false, msg: 'Không thể kết nối đến máy chủ' }) }
    finally { setTelegramTesting(false) }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'SALE_ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SALE_LEAD': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      default: return 'bg-brand-100 text-blue-800 border-brand-200'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Hồ sơ cá nhân</h1>
        <p className="text-surface-500 text-sm mt-1">Quản lý thông tin tài khoản và kênh nhận thông báo Telegram</p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-surface-200">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 text-white flex items-center justify-center text-xl font-bold shadow-md">
            {userName.split(' ').map(n => n[0]).join('').slice(-2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900">{userName}</h2>
            <p className="text-surface-500 text-sm">{userEmail}</p>
            <div className="mt-2 inline-flex items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(userRole)} flex items-center gap-1.5`}>
                <Shield size={13} />
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-50 rounded-xl border border-surface-200/60">
            <div className="flex items-center gap-2 text-surface-500 text-xs font-medium mb-1">
              <User size={14} className="text-surface-600" /> HỌ VÀ TÊN
            </div>
            <p className="text-sm font-semibold text-surface-900">{userName}</p>
          </div>
          <div className="p-4 bg-surface-50 rounded-xl border border-surface-200/60">
            <div className="flex items-center gap-2 text-surface-500 text-xs font-medium mb-1">
              <Mail size={14} className="text-surface-600" /> ĐỊA CHỈ EMAIL
            </div>
            <p className="text-sm font-semibold text-surface-900">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Telegram Notification Setting for Employee */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-200 border-l-4 border-l-blue-600 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Send size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900">Nhận thông báo qua Telegram</h2>
            <p className="text-xs text-surface-500">
              Cấu hình kênh Telegram để nhận tin nhắn ngay lập tức khi báo giá hoặc đề xuất công tác của bạn được duyệt/từ chối.
            </p>
          </div>
        </div>

        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 text-sm space-y-2">
          <div className="font-semibold text-blue-900 flex items-center gap-1.5">
            <Sparkles size={16} className="text-blue-600" /> Hướng dẫn nhanh lấy Chat ID:
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-blue-800 text-xs sm:text-sm">
            <li>Mở ứng dụng Telegram trên điện thoại hoặc máy tính.</li>
            <li>Tìm kiếm và nhắn tin cho bot hỗ trợ lấy ID: <code className="bg-blue-100/80 font-mono px-1.5 py-0.5 rounded text-blue-900 font-bold">@userinfobot</code> (hoặc bấm Start).</li>
            <li>Bot sẽ lập tức trả về dãy số ID của bạn (ví dụ: <code className="font-mono bg-white px-1.5 py-0.5 rounded text-surface-900">6206441267</code>).</li>
            <li>Copy dãy số đó, dán vào ô bên dưới và bấm <b>Lưu Chat ID</b>.</li>
          </ol>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-sm font-semibold text-surface-800">
            Telegram Chat ID cá nhân của bạn
          </label>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              placeholder="Nhập Chat ID của bạn (ví dụ: 6206441267...)"
              className="w-full sm:w-auto flex-1 border border-surface-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleSaveTelegramChatId}
                disabled={telegramSaving}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Save size={16} /> {telegramSaving ? 'Đang lưu...' : 'Lưu Chat ID'}
              </button>
              <button
                onClick={handleTestTelegram}
                disabled={telegramTesting || !telegramChatId.trim()}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                title="Bắn tin nhắn test về Telegram của bạn"
              >
                <Send size={16} /> {telegramTesting ? 'Đang test...' : 'Test thông báo'}
              </button>
            </div>
          </div>

          {telegramSaved && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm animate-scale-in font-medium">
              <CheckCircle size={18} className="text-green-600" /> Đã lưu Chat ID Telegram cá nhân thành công!
            </div>
          )}

          {telegramTestResult && (
            <div className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm animate-scale-in font-medium ${telegramTestResult.ok ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {telegramTestResult.ok ? <CheckCircle size={18} className="text-green-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
              <span>{telegramTestResult.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useSession } from 'next-auth/react'
import { Save, Shield, Building2, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Telegram Chat ID state (per user)
  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramSaving, setTelegramSaving] = useState(false)
  const [telegramSaved, setTelegramSaved] = useState(false)
  const [telegramTesting, setTelegramTesting] = useState(false)
  const [telegramTestResult, setTelegramTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Admin Telegram Bot Config state
  const [adminSaving, setAdminSaving] = useState(false)
  const [adminSaved, setAdminSaved] = useState(false)
  const [adminTesting, setAdminTesting] = useState(false)
  const [adminTestResult, setAdminTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    // Load settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data || {}))
      .catch(console.error)
      .finally(() => setLoading(false))

    // Load user's Telegram Chat ID
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
    }
  }, [session?.user?.id])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const handleSaveTelegramChatId = async () => {
    const userId = (session?.user as any)?.id
    if (!userId) { alert('Không xác định được tài khoản'); return }
    setTelegramSaving(true)
    setTelegramSaved(false)
    try {
      await fetch('/api/telegram/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, chatId: telegramChatId })
      })
      setTelegramSaved(true)
      setTimeout(() => setTelegramSaved(false), 3000)
    } catch { alert('Có lỗi xảy ra') }
    finally { setTelegramSaving(false) }
  }

  const handleTestTelegram = async () => {
    const chatIdToTest = telegramChatId
    if (!chatIdToTest) { alert('Vui lòng nhập Chat ID trước'); return }
    setTelegramTesting(true)
    setTelegramTestResult(null)
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatIdToTest })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTelegramTestResult({ ok: true, msg: 'Gửi thành công! Kiểm tra Telegram của bạn.' })
      } else {
        setTelegramTestResult({ ok: false, msg: data.error || 'Lỗi gửi tin nhắn' })
      }
    } catch { setTelegramTestResult({ ok: false, msg: 'Không thể kết nối server' }) }
    finally { setTelegramTesting(false) }
  }

  const handleSaveAdminTelegram = async () => {
    setAdminSaving(true)
    setAdminSaved(false)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      setAdminSaved(true)
      setTimeout(() => setAdminSaved(false), 3000)
    } catch { alert('Có lỗi xảy ra khi lưu cấu hình Telegram') }
    finally { setAdminSaving(false) }
  }

  const handleTestAdminTelegram = async () => {
    const chatIdToTest = settings.telegram_admin_chat_id
    const botTokenToTest = settings.telegram_bot_token
    if (!chatIdToTest || !botTokenToTest) { alert('Vui lòng nhập đầy đủ Bot Token và Chat ID Admin'); return }
    setAdminTesting(true)
    setAdminTestResult(null)
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: chatIdToTest, 
          botToken: botTokenToTest,
          text: '✅ <b>Kết nối Admin thành công!</b>\n\nTài khoản Quản Trị DAFA Sales đã kết nối với Telegram Bot.\nBạn sẽ nhận được thông báo ngay khi có báo giá hoặc đề xuất công tác mới cần duyệt.'
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAdminTestResult({ ok: true, msg: 'Gửi tin nhắn test Admin thành công! Kiểm tra Telegram của Admin.' })
      } else {
        setAdminTestResult({ ok: false, msg: data.error || 'Lỗi gửi tin nhắn Admin' })
      }
    } catch { setAdminTestResult({ ok: false, msg: 'Không thể kết nối server' }) }
    finally { setAdminTesting(false) }
  }

  const canEditSettings = ['ADMIN', 'SALE_ADMIN'].includes(session?.user?.role || '');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Cài đặt hệ thống</h1>
          <p className="text-surface-500 text-sm mt-1">Quản lý thông tin công ty và cấu hình chung</p>
        </div>
        {canEditSettings && (
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        )}
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm animate-scale-in">
          ✓ Đã lưu thành công!
        </div>
      )}

      {!canEditSettings && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-amber-700 text-sm flex items-center gap-2">
          <Shield size={18} />
          Chỉ Admin và Sale Admin mới có quyền chỉnh sửa cài đặt hệ thống.
        </div>
      )}

      {/* Company Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={20} className="text-surface-900" />
          <h2 className="text-lg font-semibold text-surface-900">Thông tin công ty</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Tên công ty</label>
              <input value={settings.company_name || ''} onChange={e => setSettings({...settings, company_name: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Mã số thuế</label>
              <input value={settings.company_tax_id || ''} onChange={e => setSettings({...settings, company_tax_id: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Địa chỉ</label>
            <input value={settings.company_address || ''} onChange={e => setSettings({...settings, company_address: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Số điện thoại</label>
              <input value={settings.company_phone || ''} onChange={e => setSettings({...settings, company_phone: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
              <input value={settings.company_email || ''} onChange={e => setSettings({...settings, company_email: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Website</label>
            <input value={settings.company_website || ''} onChange={e => setSettings({...settings, company_website: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
          </div>
        </div>
      </div>

      {/* Quote Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-surface-900" />
          <h2 className="text-lg font-semibold text-surface-900">Cài đặt báo giá</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Thuế VAT mặc định (%)</label>
              <input type="number" value={settings.default_vat_rate || '10'} onChange={e => setSettings({...settings, default_vat_rate: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Thời hạn báo giá (ngày)</label>
              <input type="number" value={settings.default_quote_validity_days || '30'} onChange={e => setSettings({...settings, default_quote_validity_days: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Điều khoản báo giá mặc định</label>
            <textarea value={settings.default_quote_terms || ''} onChange={e => setSettings({...settings, default_quote_terms: e.target.value})} disabled={!canEditSettings} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" rows={5} />
          </div>
        </div>
      </div>

      {/* Telegram Bot Configuration - Admin Only */}
      {canEditSettings && (
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-4">
            <Send size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-surface-900">Cấu hình Telegram Bot</h2>
          </div>
          <p className="text-sm text-surface-500 mb-4">
            Cấu hình bot Telegram để gửi thông báo khi có báo giá hoặc đề xuất công tác cần duyệt.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Bot Token</label>
              <input
                type="password"
                value={settings.telegram_bot_token || ''}
                onChange={e => setSettings({...settings, telegram_bot_token: e.target.value})}
                className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="Nhập Bot Token từ @BotFather"
              />
              <p className="text-xs text-surface-400 mt-1">Tạo bot tại @BotFather trên Telegram để lấy token</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Chat ID nhận thông báo (Admin)</label>
              <input
                value={settings.telegram_admin_chat_id || ''}
                onChange={e => setSettings({...settings, telegram_admin_chat_id: e.target.value})}
                className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="Chat ID của tài khoản quản trị"
              />
              <p className="text-xs text-surface-400 mt-1">Chat ID này sẽ nhận thông báo khi có báo giá/đề xuất mới cần duyệt</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Chat ID nhận thông báo (Kế toán)</label>
              <input
                value={settings.telegram_accountant_chat_id || ''}
                onChange={e => setSettings({...settings, telegram_accountant_chat_id: e.target.value})}
                className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="Chat ID của tài khoản Kế toán"
              />
              <p className="text-xs text-surface-400 mt-1">Chat ID này sẽ nhận thông báo khi có đề xuất công tác mới cần duyệt chi phí</p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveAdminTelegram}
                disabled={adminSaving}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Save size={16} /> {adminSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={handleTestAdminTelegram}
                disabled={adminTesting || !settings.telegram_admin_chat_id || !settings.telegram_bot_token}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Send size={16} /> {adminTesting ? 'Đang test...' : 'Test'}
              </button>
            </div>

            {adminSaved && (
              <div className="flex items-center gap-1.5 mt-2 text-green-600 text-sm animate-scale-in">
                <CheckCircle size={15} /> Đã lưu Chat ID & Bot Token của Admin!
              </div>
            )}

            {adminTestResult && (
              <div className={`flex items-center gap-1.5 mt-2 text-sm animate-scale-in ${adminTestResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                {adminTestResult.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {adminTestResult.msg}
              </div>
            )}
          </div>
          <p className="text-xs text-surface-400 mt-4 bg-blue-50 p-3 rounded-lg">
            💡 <strong>Cách lấy Chat ID:</strong> Nhắn tin cho bot trên Telegram → truy cập{' '}
            <code className="bg-blue-100 px-1 rounded">https://api.telegram.org/bot{'<TOKEN>'}/getUpdates</code>{' '}
            → tìm giá trị <code className="bg-blue-100 px-1 rounded">"chat":{"{"}"id":...</code>
          </p>
        </div>
      )}

      {/* Account Info + Telegram Chat ID */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Thông tin tài khoản</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-surface-100">
            <span className="text-surface-500">Họ tên</span>
            <span className="font-medium">{session?.user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-100">
            <span className="text-surface-500">Email</span>
            <span className="font-medium">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-100">
            <span className="text-surface-500">Vai trò</span>
            <span className="font-medium">{session?.user?.role === 'ADMIN' ? 'Quản trị viên' : session?.user?.role === 'MANAGER' ? 'Quản lý' : session?.user?.role === 'SALE_ADMIN' ? 'Sale Admin' : session?.user?.role === 'SALE_LEAD' ? 'Sale Lead' : 'Nhân viên kinh doanh'}</span>
          </div>
        </div>

        {/* Telegram Chat ID - Self-service for all users */}
        <div className="mt-6 pt-4 border-t border-surface-200">
          <div className="flex items-center gap-2 mb-3">
            <Send size={18} className="text-blue-600" />
            <h3 className="font-semibold text-surface-900">Nhận thông báo qua Telegram</h3>
          </div>
          <p className="text-xs text-surface-500 mb-3">
            Nhập Chat ID Telegram của bạn để nhận thông báo khi báo giá/đề xuất được duyệt hoặc từ chối.
          </p>
          <div className="flex gap-2">
            <input
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              placeholder="Nhập Telegram Chat ID của bạn"
              className="flex-1 border border-surface-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={handleSaveTelegramChatId}
              disabled={telegramSaving}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save size={14} /> {telegramSaving ? '...' : 'Lưu'}
            </button>
            <button
              onClick={handleTestTelegram}
              disabled={telegramTesting || !telegramChatId}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send size={14} /> {telegramTesting ? '...' : 'Test'}
            </button>
          </div>

          {telegramSaved && (
            <div className="flex items-center gap-1.5 mt-2 text-green-600 text-sm animate-scale-in">
              <CheckCircle size={14} /> Đã lưu Chat ID!
            </div>
          )}

          {telegramTestResult && (
            <div className={`flex items-center gap-1.5 mt-2 text-sm animate-scale-in ${telegramTestResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {telegramTestResult.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {telegramTestResult.msg}
            </div>
          )}

          <div className="text-xs text-surface-400 mt-3 bg-surface-50 p-3 rounded-lg">
            💡 <strong>Cách lấy Chat ID:</strong> Mở Telegram → nhắn <code className="bg-surface-200 px-1 rounded">/start</code> cho bot{' '}
            → hỏi admin để được cung cấp Chat ID, hoặc nhắn cho{' '}
            <code className="bg-surface-200 px-1 rounded">@userinfobot</code> để lấy ID của bạn.
          </div>
        </div>
      </div>
    </div>
  )
}

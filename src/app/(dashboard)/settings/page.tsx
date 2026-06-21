'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Save, Shield, Building2, FileText } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Cài đặt hệ thống</h1>
          <p className="text-surface-500 text-sm mt-1">Quản lý thông tin công ty và cấu hình chung</p>
        </div>
        {isAdmin && (
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 gradient-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        )}
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm animate-scale-in">
          ✓ Đã lưu thành công!
        </div>
      )}

      {!isAdmin && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-amber-700 text-sm flex items-center gap-2">
          <Shield size={18} />
          Chỉ Admin mới có quyền chỉnh sửa cài đặt hệ thống.
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
              <input value={settings.company_name || ''} onChange={e => setSettings({...settings, company_name: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Mã số thuế</label>
              <input value={settings.company_tax_id || ''} onChange={e => setSettings({...settings, company_tax_id: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Địa chỉ</label>
            <input value={settings.company_address || ''} onChange={e => setSettings({...settings, company_address: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Số điện thoại</label>
              <input value={settings.company_phone || ''} onChange={e => setSettings({...settings, company_phone: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
              <input value={settings.company_email || ''} onChange={e => setSettings({...settings, company_email: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Website</label>
            <input value={settings.company_website || ''} onChange={e => setSettings({...settings, company_website: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
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
              <input type="number" value={settings.default_vat_rate || '10'} onChange={e => setSettings({...settings, default_vat_rate: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Thời hạn báo giá (ngày)</label>
              <input type="number" value={settings.default_quote_validity_days || '30'} onChange={e => setSettings({...settings, default_quote_validity_days: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Điều khoản báo giá mặc định</label>
            <textarea value={settings.default_quote_terms || ''} onChange={e => setSettings({...settings, default_quote_terms: e.target.value})} disabled={!isAdmin} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm disabled:bg-surface-50" rows={5} />
          </div>
        </div>
      </div>

      {/* Account Info */}
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
            <span className="font-medium">{session?.user?.role === 'ADMIN' ? 'Quản trị viên' : session?.user?.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên kinh doanh'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

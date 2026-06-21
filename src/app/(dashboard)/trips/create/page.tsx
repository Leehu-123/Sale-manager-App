'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, MapPin } from 'lucide-react'

export default function CreateTripPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', destination: '', purpose: '', startDate: '', endDate: '', estimatedCost: '', notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimatedCost: parseFloat(form.estimatedCost) || 0
        })
      })
      if (res.ok) {
        const trip = await res.json()
        router.push(`/trips/${trip.id}`)
      } else {
        alert('Có lỗi xảy ra khi tạo đề xuất')
      }
    } catch {
      alert('Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/trips')} className="p-2 hover:bg-surface-200 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Đề xuất công tác</h1>
          <p className="text-sm text-surface-500">Tạo kế hoạch đi thị trường mới</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Tên chuyến đi *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder="VD: Công tác khảo sát thị trường Đà Nẵng" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Điểm đến (Tỉnh/Thành phố) *</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input required value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-surface-300 rounded-lg text-sm" placeholder="VD: Đà Nẵng, Quảng Nam..." />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Ngày bắt đầu *</label>
              <input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Ngày kết thúc *</label>
              <input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Mục đích chuyến đi</label>
            <textarea value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Mục tiêu cần đạt được trong chuyến đi này..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Chi phí dự kiến (VNĐ)</label>
            <input type="number" value={form.estimatedCost} onChange={e => setForm({...form, estimatedCost: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder="0" min="0" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Ghi chú thêm</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" rows={2} />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-surface-100">
          <button type="submit" disabled={saving} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
            <Save size={18} /> {saving ? 'Đang gửi...' : 'Gửi đề xuất'}
          </button>
        </div>
      </form>
    </div>
  )
}

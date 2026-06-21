'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Map, Plus, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Trip {
  id: string; code: string; title: string; destination: string; status: string
  startDate: string; endDate: string; createdAt: string
  user: { name: string }
  _count: { reports: number }
}

const TRIP_STATUS_LABELS: Record<string, string> = {
  PROPOSED: 'Đề xuất',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang đi',
  COMPLETED: 'Hoàn thành',
}

const TRIP_STATUS_COLORS: Record<string, string> = {
  PROPOSED: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
}

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/trips?${params}`)
      const data = await res.json()
      setTrips(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Quản lý công tác</h1>
          <p className="text-surface-500 text-sm mt-1">Theo dõi lịch trình và kết quả đi thị trường</p>
        </div>
        <button 
          onClick={() => router.push('/trips/create')} 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 w-full sm:w-auto transition-colors"
        >
          <Plus size={16} /> Đề xuất công tác
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-surface-200 rounded-lg px-3 py-2 text-sm flex-1 sm:flex-none sm:w-48">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(TRIP_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                <th className="p-4 text-left font-medium text-surface-500 whitespace-nowrap">Mã CT</th>
                <th className="p-4 text-left font-medium text-surface-500 min-w-[200px]">Thông tin chuyến đi</th>
                <th className="p-4 text-left font-medium text-surface-500 whitespace-nowrap">Nhân viên</th>
                <th className="p-4 text-left font-medium text-surface-500 whitespace-nowrap">Thời gian</th>
                <th className="p-4 text-left font-medium text-surface-500 whitespace-nowrap">Trạng thái</th>
                <th className="p-4 text-center font-medium text-surface-500 whitespace-nowrap">Báo cáo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                [...Array(3)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-surface-100 rounded animate-pulse" /></td>)}</tr>)
              ) : trips.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-surface-400"><Map size={48} className="mx-auto mb-3 text-surface-300" /><p>Chưa có dữ liệu công tác</p></td></tr>
              ) : (
                trips.map(trip => (
                  <tr key={trip.id} onClick={() => router.push(`/trips/${trip.id}`)} className="cursor-pointer hover:bg-brand-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-surface-500">{trip.code}</td>
                    <td className="p-4">
                      <p className="font-semibold text-surface-900">{trip.title}</p>
                      <p className="text-xs text-surface-500 flex items-center gap-1 mt-1"><Map size={12}/> {trip.destination}</p>
                    </td>
                    <td className="p-4 font-medium text-surface-700">{trip.user.name}</td>
                    <td className="p-4 text-xs text-surface-600">
                      {formatDate(trip.startDate)}<br/>
                      <span className="text-surface-400">đến</span> {formatDate(trip.endDate)}
                    </td>
                    <td className="p-4"><span className={`badge ${TRIP_STATUS_COLORS[trip.status]}`}>{TRIP_STATUS_LABELS[trip.status]}</span></td>
                    <td className="p-4 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 text-surface-600 text-xs font-medium">{trip._count.reports}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

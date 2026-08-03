'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Search, Map, Plus, ChevronRight, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Trip {
  id: string; code: string; title: string; destination: string; status: string
  startDate: string; endDate: string; createdAt: string
  user: { name: string }
  _count: { reports: number }
}

const TRIP_STATUS_LABELS: Record<string, string> = {
  PROPOSED: 'Đề xuất',
  ACCOUNTANT_APPROVED: 'KT đã duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang đi',
  COMPLETED: 'Hoàn thành',
}

const TRIP_STATUS_COLORS: Record<string, string> = {
  PROPOSED: 'bg-amber-100 text-amber-800',
  ACCOUNTANT_APPROVED: 'bg-teal-100 text-teal-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
}

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')

  const { data: session } = useSession()
  const isAdmin = ['ADMIN', 'SALE_ADMIN'].includes(session?.user?.role || '')

  useEffect(() => {
    const extractArray = (res: any) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res.data && Array.isArray(res.data)) return res.data;
      if (res.items && Array.isArray(res.items)) return res.items;
      return [];
    };
    let url = '/users?limit=100'
    if (session?.user?.role === 'SALE_LEAD' && session?.user?.teamId) {
      url += `&teamId=${session.user.teamId}`
    }
    apiClient.get(url).then(d => {
      const allUsers = extractArray(d);
      const filteredUsers = allUsers.filter((u: any) => {
        if (!u.roles || u.roles.length === 0) return false;
        return u.roles.some((r: string) => {
          const lower = r.toLowerCase();
          return lower.includes('sale') || lower.includes('admin') || lower.includes('manager') || lower.includes('owner') || lower.includes('quản lý');
        });
      });
      setUsers(filteredUsers);
    }).catch(() => {})
  }, [session])

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      
      const userRole = session?.user?.role
      if (userRole === 'SALES') {
        params.set('userId', session?.user?.id || '')
      } else if (userRole === 'SALE_LEAD') {
        if (userIdFilter) {
          params.set('userId', userIdFilter)
        } else {
          params.set('teamId', session?.user?.teamId || '')
        }
      } else {
        if (userIdFilter) params.set('userId', userIdFilter)
      }

      const data = await apiClient.get(`/business-trips?${params}`)
      setTrips(Array.isArray(data) ? data : (data.data || []))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [statusFilter, userIdFilter, session])

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
        <select value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)} className="border border-surface-200 rounded-lg px-3 py-2 text-sm flex-1 sm:flex-none sm:w-48">
          <option value="">Tất cả nhân viên</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.name}</option>)}
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
                {isAdmin && <th className="p-4 text-right font-medium text-surface-500 whitespace-nowrap">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                [...Array(3)].map((_, i) => <tr key={i}>{[...Array(isAdmin ? 7 : 6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-surface-100 rounded animate-pulse" /></td>)}</tr>)
              ) : trips.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-surface-400"><Map size={48} className="mx-auto mb-3 text-surface-300" /><p>Chưa có dữ liệu công tác</p></td></tr>
              ) : (
                trips.map(trip => (
                  <tr key={trip.id} onClick={() => router.push(`/trips/${trip.id}`)} className="cursor-pointer hover:bg-brand-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-surface-500">{trip.code}</td>
                    <td className="p-4">
                      <p className="font-semibold text-surface-900">{trip.title}</p>
                      <p className="text-xs text-surface-500 flex items-center gap-1 mt-1"><Map size={12}/> {trip.destination}</p>
                    </td>
                    <td className="p-4 font-medium text-surface-700">{trip.user?.name || 'Unknown'}</td>
                    <td className="p-4 text-xs text-surface-600">
                      {formatDate(trip.startDate)}<br/>
                      <span className="text-surface-400">đến</span> {formatDate(trip.endDate)}
                    </td>
                    <td className="p-4"><span className={`badge ${TRIP_STATUS_COLORS[trip.status]}`}>{TRIP_STATUS_LABELS[trip.status]}</span></td>
                    <td className="p-4 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 text-surface-600 text-xs font-medium">{trip._count?.reports || 0}</span></td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(confirm(`Bạn có chắc chắn muốn xóa phiếu công tác "${trip.title}" (${trip.code})?`)) {
                              apiClient.delete(`/business-trips/${trip.id}/hard`)
                                .then(() => fetchTrips())
                                .catch((err) => {
                                  const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa phiếu công tác';
                                  alert(Array.isArray(msg) ? msg.join(', ') : msg);
                                });
                            } 
                          }} 
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors inline-flex items-center justify-center" 
                          title="Xóa phiếu công tác"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
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

'use client'

import { useEffect, useState, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, MapPin, Calendar, DollarSign, Upload, CheckCircle, XCircle, Plus, X, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notifyUserTripApproved, notifyUserTripRejected } from '@/lib/telegram'
import { Modal } from '@/components/ui/Modal'

interface TripDailyReport {
  id: string; date: string; location?: string; content: string; results?: string
  newClients: number; oldClients: number; images?: string; createdAt: string
}

interface TripDetail {
  id: string; code: string; title: string; destination: string; purpose?: string
  startDate: string; endDate: string; status: string; 
  estimatedCost: number; estimatedTransportCost: number; estimatedFoodCost: number;
  estimatedAccommodationCost: number; estimatedEntertainmentCost: number; entertainmentNotes?: string;
  actualCost: number; actualTransportCost: number; actualFoodCost: number;
  actualAccommodationCost: number; actualEntertainmentCost: number;
  notes?: string; summary?: string; totalNewClients: number; totalOldClients: number
  userId: string; user: { name: string; email: string }
  reports: TripDailyReport[]
}

const TRIP_STATUS_LABELS: Record<string, string> = {
  PROPOSED: 'Đề xuất', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang đi', COMPLETED: 'Hoàn thành',
}

const TRIP_STATUS_COLORS: Record<string, string> = {
  PROPOSED: 'bg-amber-100 text-amber-800', APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800', IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
}

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'SALES'

  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Modals state
  const [showReportModal, setShowReportModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Report Form state
  const [reportForm, setReportForm] = useState({ date: new Date().toISOString().split('T')[0], content: '', results: '', newClients: '', oldClients: '' })
  const [location, setLocation] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lightbox state
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // Finish Form state
  const [finishForm, setFinishForm] = useState({ 
    actualTransportCost: '', actualFoodCost: '', actualAccommodationCost: '', actualEntertainmentCost: '', summary: '' 
  })

  const fetchTrip = async () => {
    try {
      const res = await apiClient.get(`/business-trips/${params.id}`)
      if (res) {
        // If wrapped in {data: ...}, use res.data, else use res directly
        setTrip(res.data || res)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTrip() }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    try {
      let endpoint = '';
      if (newStatus === 'APPROVED') endpoint = 'approve';
      else if (newStatus === 'REJECTED') endpoint = 'reject';
      else if (newStatus === 'IN_PROGRESS') endpoint = 'start';
      else if (newStatus === 'COMPLETED') endpoint = 'complete';

      if (endpoint) {
        await apiClient.post(`/business-trips/${params.id}/${endpoint}`, {});
      } else {
        await apiClient.put(`/business-trips/${params.id}`, { status: newStatus });
      }

      // Telegram notifications
      if (newStatus === 'APPROVED' && trip) {
        notifyUserTripApproved({
          title: trip.title,
          userId: trip.userId,
          tripId: trip.id,
        });
      }
      if (newStatus === 'REJECTED' && trip) {
        notifyUserTripRejected({
          title: trip.title,
          userId: trip.userId,
          tripId: trip.id,
        });
      }

      fetchTrip()
    } catch { alert('Lỗi cập nhật trạng thái') }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ GPS')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation(`https://maps.google.com/?q=${latitude},${longitude}`)
      },
      () => {
        alert('Không thể lấy vị trí. Hãy kiểm tra quyền truy cập vị trí của thiết bị.')
      }
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      // Get session token for auth
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json().catch(() => ({}))
      const headers: Record<string, string> = {}
      if (sessionData?.user?.accessToken) {
        headers['Authorization'] = `Bearer ${sessionData.user.accessToken}`
      }
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        const imageUrl = data.data ? data.data.url : data.url
        if (imageUrl) {
          setImages(prev => [...prev, imageUrl])
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        alert('Lỗi tải ảnh: ' + (errData.message || `HTTP ${res.status}`))
      }
    } catch (err: any) { alert('Lỗi tải ảnh: ' + (err.message || 'Không thể kết nối server')) }
    finally {
      setUploading(false)
      // Reset input value after processing so the same file can be selected again
      if (e.target) e.target.value = ''
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await apiClient.post(`/business-trips/${params.id}/reports`, {
        ...reportForm,
        newClients: parseInt(reportForm.newClients) || 0,
        oldClients: parseInt(reportForm.oldClients) || 0,
        location,
        images: images.length > 0 ? JSON.stringify(images) : undefined,
      })
      if (res) {
        setShowReportModal(false)
        setReportForm({ date: new Date().toISOString().split('T')[0], content: '', results: '', newClients: '', oldClients: '' })
        setLocation('')
        setImages([])
        // If status is APPROVED, change to IN_PROGRESS
        if (trip?.status === 'APPROVED') {
          await handleStatusChange('IN_PROGRESS')
        } else {
          fetchTrip()
        }
      }
    } catch { alert('Lỗi') }
    finally { setSaving(false) }
  }

  const handleFinishTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Calculate totals
      const safeReports = trip?.reports || []
      const totalNew = safeReports.reduce((s, r) => s + r.newClients, 0) || 0
      const totalOld = safeReports.reduce((s, r) => s + r.oldClients, 0) || 0

      const transport = parseFloat(finishForm.actualTransportCost) || 0
      const food = parseFloat(finishForm.actualFoodCost) || 0
      const accom = parseFloat(finishForm.actualAccommodationCost) || 0
      const enter = parseFloat(finishForm.actualEntertainmentCost) || 0
      const totalCost = transport + food + accom + enter

      const res = await apiClient.put(`/business-trips/${params.id}`, {
        actualTransportCost: transport,
        actualFoodCost: food,
        actualAccommodationCost: accom,
        actualEntertainmentCost: enter,
        actualCost: totalCost,
        summary: finishForm.summary,
        totalNewClients: totalNew,
        totalOldClients: totalOld,
      })
      if (res) {
        await apiClient.post(`/business-trips/${params.id}/complete`, {})
        setShowFinishModal(false)
        fetchTrip()
      }
    } catch { alert('Lỗi') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="spinner" /></div>
  if (!trip) return <div className="text-center py-12 text-surface-500">Không tìm thấy dữ liệu</div>

  const isOwner = session?.user?.id === trip.userId
  const canApprove = ['ADMIN', 'SALE_ADMIN', 'SALE_LEAD'].includes(userRole || '')
  const isAdmin = ['ADMIN', 'SALE_ADMIN'].includes(userRole || '')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/trips')} className="p-2 hover:bg-surface-200 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-surface-900">{trip.title}</h1>
              <span className={`badge ${TRIP_STATUS_COLORS[trip.status]}`}>{TRIP_STATUS_LABELS[trip.status]}</span>
            </div>
            <p className="text-sm text-surface-500">Người đi: <span className="font-medium text-surface-700">{trip.user?.name || 'Không xác định'}</span> · Mã CT: {trip.code}</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {trip.status === 'PROPOSED' && canApprove && (
            <>
              <button onClick={() => handleStatusChange('REJECTED')} className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Từ chối</button>
              <button onClick={() => handleStatusChange('APPROVED')} className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Phê duyệt</button>
            </>
          )}
          {(trip.status === 'APPROVED' || trip.status === 'IN_PROGRESS') && isOwner && (
            <button onClick={() => setShowReportModal(true)} className="flex-1 sm:flex-none px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
              <MapPin size={16} /> Báo cáo ngày (Check-in)
            </button>
          )}
          {trip.status === 'IN_PROGRESS' && isOwner && (
            <button onClick={() => setShowFinishModal(true)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
              <CheckCircle size={16} /> Kết thúc công tác
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => {
                if(confirm(`Bạn có chắc chắn muốn xóa phiếu công tác "${trip.title}" (${trip.code})?`)) {
                  apiClient.delete(`/business-trips/${trip.id}/hard`)
                    .then(() => router.push('/trips'))
                    .catch((err) => {
                      const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa phiếu công tác';
                      alert(Array.isArray(msg) ? msg.join(', ') : msg);
                    });
                }
              }} 
              className="flex-1 sm:flex-none px-4 py-2 border border-red-300 text-red-600 bg-red-50/50 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              title="Xóa phiếu công tác này"
            >
              <Trash2 size={16} /> Xóa phiếu
            </button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div><p className="text-sm text-surface-500 mb-1">Điểm đến</p><p className="font-medium flex items-center gap-1"><MapPin size={16} className="text-brand-500"/> {trip.destination}</p></div>
          <div><p className="text-sm text-surface-500 mb-1">Thời gian</p><p className="font-medium flex items-center gap-1"><Calendar size={16} className="text-brand-500"/> {formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p></div>
          <div><p className="text-sm text-surface-500 mb-1">Mục đích</p><p className="text-sm">{trip.purpose || '-'}</p></div>
          <div>
            <p className="text-sm text-surface-500 mb-2">Chi tiết dự toán (Tổng: {formatCurrency(trip.estimatedCost)})</p>
            <div className="text-xs space-y-1 bg-surface-50 p-3 rounded-lg border border-surface-100">
              <div className="flex justify-between"><span>Xăng xe:</span><span className="font-medium">{formatCurrency(trip.estimatedTransportCost)}</span></div>
              <div className="flex justify-between"><span>Ăn uống:</span><span className="font-medium">{formatCurrency(trip.estimatedFoodCost)}</span></div>
              <div className="flex justify-between"><span>Phòng nghỉ:</span><span className="font-medium">{formatCurrency(trip.estimatedAccommodationCost)}</span></div>
              <div className="flex justify-between">
                <span>Tiếp khách: {trip.entertainmentNotes && <span className="text-surface-400">({trip.entertainmentNotes})</span>}</span>
                <span className="font-medium">{formatCurrency(trip.estimatedEntertainmentCost)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-surface-500 mb-2">Chi phí thực tế (Tổng: {trip.actualCost ? formatCurrency(trip.actualCost) : 'Chưa chốt'})</p>
            {trip.status === 'COMPLETED' ? (
              <div className="text-xs space-y-1 bg-green-50 p-3 rounded-lg border border-green-100 text-green-800">
                <div className="flex justify-between"><span>Xăng xe:</span><span className="font-medium">{formatCurrency(trip.actualTransportCost)}</span></div>
                <div className="flex justify-between"><span>Ăn uống:</span><span className="font-medium">{formatCurrency(trip.actualFoodCost)}</span></div>
                <div className="flex justify-between"><span>Phòng nghỉ:</span><span className="font-medium">{formatCurrency(trip.actualAccommodationCost)}</span></div>
                <div className="flex justify-between"><span>Tiếp khách:</span><span className="font-medium">{formatCurrency(trip.actualEntertainmentCost)}</span></div>
              </div>
            ) : (
              <p className="text-xs text-surface-400 italic">Chi phí thực tế sẽ được cập nhật khi kết thúc chuyến đi.</p>
            )}
          </div>
          <div><p className="text-sm text-surface-500 mb-1">Tổng kết</p><p className="text-sm">{trip.summary || '-'}</p></div>
          {trip.status === 'COMPLETED' && (
            <div className="flex gap-4">
              <div className="bg-brand-50 px-3 py-2 rounded-lg text-sm"><span className="font-bold text-brand-700">{trip.totalNewClients}</span> KH mới</div>
              <div className="bg-indigo-50 px-3 py-2 rounded-lg text-sm"><span className="font-bold text-indigo-700">{trip.totalOldClients}</span> KH cũ</div>
            </div>
          )}
        </div>
      </div>

      {/* Reports Timeline */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">Nhật ký công tác</h3>
        </div>
        <div className="p-4 sm:p-6 space-y-8">
          {(!trip.reports || trip.reports.length === 0) ? (
            <div className="text-center py-8 text-surface-400">Chưa có báo cáo ngày nào</div>
          ) : (
            <div className="relative border-l-2 border-surface-200 ml-3 md:ml-4 space-y-8">
              {(trip.reports || []).map(report => {
                const imagesArr = report.images ? JSON.parse(report.images) : []
                return (
                  <div key={report.id} className="relative pl-6 sm:pl-8">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brand-500 border-4 border-white" />
                    <div className="bg-surface-50 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-brand-700">{formatDate(report.date)}</span>
                        {report.location && (
                          <a href={report.location} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                            <MapPin size={12} /> Xem định vị
                          </a>
                        )}
                      </div>
                      <div><p className="text-sm font-medium text-surface-900">Nội dung thực hiện:</p><p className="text-sm text-surface-600 mt-1 whitespace-pre-wrap">{report.content}</p></div>
                      {report.results && <div><p className="text-sm font-medium text-surface-900">Kết quả:</p><p className="text-sm text-surface-600 mt-1 whitespace-pre-wrap">{report.results}</p></div>}
                      <div className="flex gap-4">
                        <p className="text-xs text-surface-500">KH mới: <span className="font-semibold">{report.newClients}</span></p>
                        <p className="text-xs text-surface-500">KH cũ chăm sóc: <span className="font-semibold">{report.oldClients}</span></p>
                      </div>
                      {imagesArr.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(Array.isArray(imagesArr) ? imagesArr : []).map((img: any, idx: number) => {
                            if (!img || typeof img !== 'string') return null;
                            const fullSrc = img.startsWith('/') && !img.startsWith('/api/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}${img}` : img;
                            return (
                              <img key={idx} src={fullSrc} alt="Báo cáo" className="h-20 w-20 object-cover rounded-lg border border-surface-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxImg(fullSrc)} />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Báo cáo ngày">
        <form onSubmit={handleSubmitReport} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Ngày *</label>
              <input type="date" required value={reportForm.date} onChange={e => setReportForm({...reportForm, date: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Vị trí GPS (Check-in)</label>
              <div className="flex gap-2">
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Tọa độ/Link Maps..." className="flex-1 border border-surface-300 rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={handleGetLocation} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center" title="Lấy vị trí hiện tại">
                  <MapPin size={16} />
                </button>
              </div>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Nội dung công việc *</label><textarea required value={reportForm.content} onChange={e => setReportForm({...reportForm, content: e.target.value})} rows={3} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder="Ghi chú chi tiết hoạt động trong ngày..."/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Kết quả đạt được</label><textarea value={reportForm.results} onChange={e => setReportForm({...reportForm, results: e.target.value})} rows={2} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Số KH mới</label><input type="number" min="0" value={reportForm.newClients} onChange={e => setReportForm({...reportForm, newClients: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Số KH cũ</label><input type="number" min="0" value={reportForm.oldClients} onChange={e => setReportForm({...reportForm, oldClients: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Hình ảnh đính kèm</label>
            <div className="flex flex-wrap gap-2">
              {images.map((img, idx) => {
                if (!img || typeof img !== 'string') return null;
                return (
                <div key={idx} className="relative group">
                  <img src={img.startsWith('/') && !img.startsWith('/api/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}${img}` : img} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-surface-200" />
                  <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle size={14}/></button>
                </div>
                )
              })}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`h-16 w-16 border-2 border-dashed border-surface-300 rounded-lg flex flex-col items-center justify-center text-surface-400 hover:border-brand-500 hover:text-brand-500 transition-colors bg-surface-50 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {uploading ? <div className="spinner w-4 h-4 border-2" /> : <Plus size={20} />}
              </button>
              <input ref={fileInputRef} type="file" onChange={handleImageUpload} accept="image/*" className="hidden" disabled={uploading} />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-surface-100">
            <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2 bg-surface-100 text-surface-700 rounded-lg font-medium hover:bg-surface-200">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu báo cáo'}</button>
          </div>
        </form>
      </Modal>

      {/* Finish Trip Modal */}
      <Modal isOpen={showFinishModal} onClose={() => setShowFinishModal(false)} title="Kết thúc chuyến công tác">
        <form onSubmit={handleFinishTrip} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            Hệ thống sẽ tổng hợp số liệu từ các báo cáo ngày. Bạn vui lòng chốt chi phí thực tế và đánh giá tổng kết chuyến đi.
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">CP xăng xe thực tế</label><input type="number" min="0" value={finishForm.actualTransportCost} onChange={e => setFinishForm({...finishForm, actualTransportCost: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder={trip.estimatedTransportCost?.toString() || '0'} /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">CP ăn uống thực tế</label><input type="number" min="0" value={finishForm.actualFoodCost} onChange={e => setFinishForm({...finishForm, actualFoodCost: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder={trip.estimatedFoodCost?.toString() || '0'} /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">CP phòng nghỉ thực tế</label><input type="number" min="0" value={finishForm.actualAccommodationCost} onChange={e => setFinishForm({...finishForm, actualAccommodationCost: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder={trip.estimatedAccommodationCost?.toString() || '0'} /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">CP tiếp khách thực tế</label><input type="number" min="0" value={finishForm.actualEntertainmentCost} onChange={e => setFinishForm({...finishForm, actualEntertainmentCost: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder={trip.estimatedEntertainmentCost?.toString() || '0'} /></div>
          </div>

          <div><label className="block text-sm font-medium text-surface-700 mb-1">Đánh giá chung</label><textarea value={finishForm.summary} onChange={e => setFinishForm({...finishForm, summary: e.target.value})} rows={4} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder="Đánh giá hiệu quả so với mục tiêu đề ra..." /></div>
          <div className="flex gap-3 pt-4 border-t border-surface-100">
            <button type="button" onClick={() => setShowFinishModal(false)} className="flex-1 px-4 py-2 bg-surface-100 text-surface-700 rounded-lg font-medium hover:bg-surface-200">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Hoàn thành'}</button>
          </div>
        </form>
      </Modal>

      {/* Image Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightboxImg(null)}>
          <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-10">
            <X size={24} />
          </button>
          <img src={lightboxImg} alt="Xem chi tiết" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

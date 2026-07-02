'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileText, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface Quote {
  id: string; code: string; status: string; total: number; subtotal: number; vatAmount: number
  createdAt: string; expiryDate?: string
  customer: { id: string; name: string; code: string }
  createdBy: { id: string; name: string }
  opportunity?: { id: string; name: string; code: string }
  _count: { items: number }
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-surface-100 text-surface-800', SENT: 'bg-brand-100 text-blue-800',
  UNDER_REVIEW: 'bg-brand-100 text-amber-800', APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800', EXPIRED: 'bg-surface-100 text-surface-500',
}

export default function QuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assignedToIdFilter, setAssignedToIdFilter] = useState('')
  const [users, setUsers] = useState<Array<{id: string; name: string}>>([])

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (assignedToIdFilter) params.set('createdById', assignedToIdFilter)
    try {
      const data = await apiClient.get(`/quotes?${params}`)
      setQuotes(data.data || [])
      setTotal(data.meta?.totalItems || 0)
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [page, search, statusFilter, assignedToIdFilter])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])
  useEffect(() => {
    apiClient.get('/users?limit=200').then(d => setUsers(d.data || [])).catch(() => {})
  }, [])

  const handleClone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const clone = await apiClient.post(`/quotes/${id}/clone`, {})
      router.push(`/quotes/${clone.data.id}`)
    } catch { alert('Có lỗi xảy ra') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Báo giá</h1>
          <p className="text-surface-500 text-sm mt-1">Quản lý báo giá kính xây dựng</p>
        </div>
        <button onClick={() => router.push('/quotes/create')} className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Tạo báo giá
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm báo giá..." className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm" />
        </div>
        <select value={assignedToIdFilter} onChange={e => { setAssignedToIdFilter(e.target.value); setPage(1) }} className="border border-surface-200 rounded-lg px-3 py-2 text-sm min-w-[140px]">
          <option value="">Tất cả nhân viên</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border border-surface-200 rounded-lg px-3 py-2 text-sm min-w-[140px]">
          <option value="">Trạng thái</option>
          {Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Mã BG</th><th>Khách hàng</th><th>Hạng mục</th><th>Tổng trước VAT</th>
              <th>VAT</th><th>Tổng sau VAT</th><th>Trạng thái</th><th>Ngày tạo</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}>{[...Array(9)].map((_, j) => <td key={j}><div className="h-4 bg-surface-100 rounded animate-pulse" /></td>)}</tr>)
            ) : quotes.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-surface-400">
                <FileText size={48} className="mx-auto mb-3 text-surface-300" /><p>Chưa có báo giá</p>
              </td></tr>
            ) : (
              quotes.map(quote => (
                <tr key={quote.id} onClick={() => router.push(`/quotes/${quote.id}`)} className="cursor-pointer hover:bg-brand-50/50">
                  <td className="font-mono text-xs">{quote.code}</td>
                  <td className="font-medium">{quote.customer.name}</td>
                  <td className="text-center">{quote._count.items}</td>
                  <td>{formatCurrency(quote.subtotal)}</td>
                  <td>{formatCurrency(quote.vatAmount)}</td>
                  <td className="font-semibold">{formatCurrency(quote.total)}</td>
                  <td><span className={`badge ${STATUS_COLORS[quote.status]}`}>{QUOTE_STATUS_LABELS[quote.status]}</span></td>
                  <td className="text-sm text-surface-500">{formatDate(quote.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => handleClone(quote.id, e)} className="p-1.5 hover:bg-surface-100 rounded" title="Clone báo giá">
                        <Copy size={14} className="text-surface-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/quotes/${quote.id}?edit=true`) }} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded" title="Sửa báo giá">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if(confirm('Bạn có chắc muốn xóa báo giá này?')) apiClient.delete(`/quotes/${quote.id}`).then(fetchQuotes) }} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Xóa báo giá">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-surface-500">{total} báo giá</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded hover:bg-surface-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
              <span className="px-3 py-2 text-sm">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded hover:bg-surface-100 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

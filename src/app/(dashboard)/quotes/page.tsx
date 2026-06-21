'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileText, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS } from '@/lib/utils'

interface Quote {
  id: string; code: string; status: string; total: number; subtotal: number; vatAmount: number
  createdAt: string; expiryDate?: string
  customer: { id: string; name: string; code: string }
  createdBy: { id: string; name: string }
  opportunity?: { id: string; name: string; code: string }
  _count: { items: number }
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800', SENT: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800', APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800', EXPIRED: 'bg-gray-100 text-gray-500',
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

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/quotes?${params}`)
      const data = await res.json()
      setQuotes(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  const handleClone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/quotes/${id}/clone`, { method: 'POST' })
      if (res.ok) {
        const clone = await res.json()
        router.push(`/quotes/${clone.id}`)
      }
    } catch { alert('Có lỗi xảy ra') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Báo giá</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý báo giá kính xây dựng</p>
        </div>
        <button onClick={() => router.push('/quotes/create')} className="flex items-center gap-2 px-4 py-2.5 gradient-blue text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Tạo báo giá
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm báo giá..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
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
              [...Array(5)].map((_, i) => <tr key={i}>{[...Array(9)].map((_, j) => <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
            ) : quotes.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                <FileText size={48} className="mx-auto mb-3 text-gray-300" /><p>Chưa có báo giá</p>
              </td></tr>
            ) : (
              quotes.map(quote => (
                <tr key={quote.id} onClick={() => router.push(`/quotes/${quote.id}`)} className="cursor-pointer hover:bg-blue-50/50">
                  <td className="font-mono text-xs">{quote.code}</td>
                  <td className="font-medium">{quote.customer.name}</td>
                  <td className="text-center">{quote._count.items}</td>
                  <td>{formatCurrency(quote.subtotal)}</td>
                  <td>{formatCurrency(quote.vatAmount)}</td>
                  <td className="font-semibold">{formatCurrency(quote.total)}</td>
                  <td><span className={`badge ${STATUS_COLORS[quote.status]}`}>{QUOTE_STATUS_LABELS[quote.status]}</span></td>
                  <td className="text-sm text-gray-500">{formatDate(quote.createdAt)}</td>
                  <td>
                    <button onClick={(e) => handleClone(quote.id, e)} className="p-1.5 hover:bg-gray-100 rounded" title="Clone báo giá">
                      <Copy size={14} className="text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">{total} báo giá</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
              <span className="px-3 py-2 text-sm">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

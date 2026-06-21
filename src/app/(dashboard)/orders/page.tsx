'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/utils'

interface Order {
  id: string; code: string; status: string; paymentStatus: string; total: number
  paidAmount: number; remainingAmount: number; projectName?: string; createdAt: string
  customer: { id: string; name: string }
  assignedTo: { name: string }
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-brand-100 text-blue-800', IN_PRODUCTION: 'bg-brand-100 text-amber-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800', COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (paymentFilter) params.set('paymentStatus', paymentFilter)
    try {
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [page, search, statusFilter, paymentFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Đơn hàng</h1>
          <p className="text-surface-500 text-sm mt-1">Quản lý đơn hàng và công nợ</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đơn hàng', value: total, color: 'text-brand-600 bg-brand-50' },
          { label: 'Đang thi công', value: orders.filter(o => o.status === 'IN_PROGRESS').length, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Đã hoàn thành', value: orders.filter(o => o.status === 'COMPLETED').length, color: 'text-green-600 bg-green-50' },
          { label: 'Tổng doanh thu', value: formatCurrency(orders.reduce((s, o) => s + o.total, 0)), color: 'text-brand-600 bg-brand-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-surface-500">{s.label}</p>
            <p className="text-xl font-bold text-surface-900 mt-1">{typeof s.value === 'number' ? s.value : s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm đơn hàng..." className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border border-surface-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Trạng thái ĐH</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1) }} className="border border-surface-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Thanh toán</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr><th>Mã ĐH</th><th>Khách hàng</th><th>Công trình</th><th>Tổng</th><th>Đã TT</th><th>Còn lại</th><th>TT Đơn</th><th>Thanh toán</th><th>Ngày tạo</th></tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}>{[...Array(9)].map((_, j) => <td key={j}><div className="h-4 bg-surface-100 rounded animate-pulse" /></td>)}</tr>)
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-surface-400"><ShoppingCart size={48} className="mx-auto mb-3 text-surface-300" /><p>Chưa có đơn hàng</p></td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} onClick={() => router.push(`/orders/${order.id}`)} className="cursor-pointer hover:bg-brand-50/50">
                  <td className="font-mono text-xs">{order.code}</td>
                  <td className="font-medium">{order.customer.name}</td>
                  <td className="text-sm">{order.projectName || '-'}</td>
                  <td className="font-semibold">{formatCurrency(order.total)}</td>
                  <td className="text-green-600">{formatCurrency(order.paidAmount)}</td>
                  <td className="text-red-600">{formatCurrency(order.remainingAmount)}</td>
                  <td><span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span></td>
                  <td><span className={`badge ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span></td>
                  <td className="text-sm text-surface-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-surface-500">{total} đơn hàng</p>
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

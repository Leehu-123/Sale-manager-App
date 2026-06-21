'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Users, UserPlus, Phone, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS, CUSTOMER_TYPE_LABELS,
  CUSTOMER_SOURCE_LABELS, formatDate
} from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

interface Customer {
  id: string; code: string; name: string; type: string; phone?: string; email?: string
  source: string; status: string; assignedTo?: { name: string }; createdAt: string
  contactPerson?: string; address?: string; province?: string; projectName?: string
  productNeeds?: string[]; estimatedArea?: number; estimatedBudget?: number
  notes?: string; nextFollowUpDate?: string
}

interface UserOption { id: string; name: string }

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    type: 'INDIVIDUAL', name: '', contactPerson: '', phone: '', email: '',
    address: '', province: '', projectName: '', source: 'WEBSITE',
    status: 'NEW', productNeeds: [] as string[], estimatedArea: '',
    estimatedBudget: '', notes: '', assignedToId: '',
  })

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (sourceFilter) params.set('source', sourceFilter)
    if (typeFilter) params.set('type', typeFilter)

    try {
      const res = await fetch(`/api/customers?${params}`)
      const data = await res.json()
      setCustomers(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [page, search, statusFilter, sourceFilter, typeFilter])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimatedArea: form.estimatedArea ? parseFloat(form.estimatedArea) : null,
          estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : null,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setForm({ type: 'INDIVIDUAL', name: '', contactPerson: '', phone: '', email: '', address: '', province: '', projectName: '', source: 'WEBSITE', status: 'NEW', productNeeds: [], estimatedArea: '', estimatedBudget: '', notes: '', assignedToId: '' })
        fetchCustomers()
      } else {
        const err = await res.json()
        alert(err.error || 'Có lỗi xảy ra')
      }
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const productOptions = ['Kính cường lực', 'Kính hộp', 'Kính dán an toàn', 'Vách kính', 'Cửa kính', 'Lan can kính', 'Cabin tắm kính', 'Mặt dựng kính', 'Khác']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Khách hàng</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý thông tin khách hàng và lịch sử chăm sóc</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 gradient-blue text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
          <Plus size={16} /> Thêm khách hàng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khách hàng', value: total, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Mới trong tháng', value: customers.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length, icon: UserPlus, color: 'text-green-600 bg-green-50' },
          { label: 'Đang tư vấn', value: customers.filter(c => c.status === 'CONSULTING').length, icon: Phone, color: 'text-amber-600 bg-amber-50' },
          { label: 'Cần chăm sóc', value: customers.filter(c => c.status === 'FOLLOW_UP').length, icon: Filter, color: 'text-red-600 bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${stat.color}`}><stat.icon size={18} /></div>
              <div>
                <p className="text-xl font-bold text-[#1e293b]">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm tên, SĐT, email, mã KH..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[140px]">
            <option value="">Trạng thái</option>
            {Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[120px]">
            <option value="">Nguồn</option>
            {Object.entries(CUSTOMER_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[140px]">
            <option value="">Loại KH</option>
            {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Mã KH</th>
                <th className="text-left">Tên khách hàng</th>
                <th className="text-left">Loại</th>
                <th className="text-left">SĐT</th>
                <th className="text-left">Nguồn</th>
                <th className="text-left">Nhân viên</th>
                <th className="text-left">Trạng thái</th>
                <th className="text-left">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Chưa có khách hàng</p>
                  <p className="text-sm mt-1">Nhấn &quot;Thêm khách hàng&quot; để bắt đầu</p>
                </td></tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer hover:bg-blue-50/50 transition-colors">
                    <td className="font-mono text-xs text-gray-500">{customer.code}</td>
                    <td>
                      <div className="font-medium text-[#1e293b]">{customer.name}</div>
                      {customer.contactPerson && <div className="text-xs text-gray-400">{customer.contactPerson}</div>}
                    </td>
                    <td className="text-sm">{CUSTOMER_TYPE_LABELS[customer.type] || customer.type}</td>
                    <td className="text-sm">{customer.phone || '-'}</td>
                    <td className="text-sm">{CUSTOMER_SOURCE_LABELS[customer.source] || customer.source}</td>
                    <td className="text-sm">{customer.assignedTo?.name || '-'}</td>
                    <td><span className={`badge ${CUSTOMER_STATUS_COLORS[customer.status] || 'bg-gray-100 text-gray-800'}`}>{CUSTOMER_STATUS_LABELS[customer.status] || customer.status}</span></td>
                    <td className="text-sm text-gray-500">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Hiển thị {customers.length} / {total} khách hàng</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1
                return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm ${page === p ? 'bg-[#1e3a5f] text-white' : 'hover:bg-gray-100'}`}>{p}</button>
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm khách hàng mới" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại khách hàng *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn khách *</label>
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(CUSTOMER_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng / Công ty *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Nhập tên khách hàng" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
              <input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành</label>
              <input value={form.province} onChange={e => setForm({...form, province: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Công trình / Dự án</label>
            <input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhu cầu sản phẩm</label>
            <div className="flex flex-wrap gap-2">
              {productOptions.map(p => (
                <button key={p} type="button" onClick={() => {
                  const needs = form.productNeeds.includes(p) ? form.productNeeds.filter(n => n !== p) : [...form.productNeeds, p]
                  setForm({...form, productNeeds: needs})
                }} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.productNeeds.includes(p) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích dự kiến (m²)</label>
              <input value={form.estimatedArea} onChange={e => setForm({...form, estimatedArea: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách dự kiến (VNĐ)</label>
              <input value={form.estimatedBudget} onChange={e => setForm({...form, estimatedBudget: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="number" />
            </div>
          </div>
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên phụ trách</label>
              <select value={form.assignedToId} onChange={e => setForm({...form, assignedToId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Tự động (người tạo)</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 gradient-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Thêm khách hàng'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

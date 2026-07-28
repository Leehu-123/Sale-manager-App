'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Plus, Search, Filter, Users, UserPlus, Phone, ChevronLeft, ChevronRight, MapPin, Navigation } from 'lucide-react'
import {
  CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS, CUSTOMER_TYPE_LABELS,
  CUSTOMER_SOURCE_LABELS, formatDate, extractArray
} from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { apiClient } from '@/lib/api-client'

interface Customer {
  id: string; code: string; name: string; type: string; phone?: string; email?: string
  source: string; status: string; assignedTo?: { id: string; name: string }; createdAt: string
  contactPerson?: string; address?: string; province?: string; projectName?: string
  productNeeds?: string[]; estimatedArea?: number; estimatedBudget?: number
  notes?: string; nextFollowUpDate?: string
  description?: string; latitude?: number; longitude?: number
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
  const [editId, setEditId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserOption[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    type: 'INDIVIDUAL', name: '', contactPerson: '', phone: '', email: '',
    address: '', province: '', projectName: '', source: 'WEBSITE',
    status: 'NEW', productNeeds: [] as string[], estimatedArea: '',
    estimatedBudget: '', notes: '', assignedToId: '',
    description: '', latitude: '' as string | number, longitude: '' as string | number,
  })
  const [gettingLocation, setGettingLocation] = useState(false)

  const [assignedToIdFilter, setAssignedToIdFilter] = useState('')

  const { data: session } = useSession()

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (sourceFilter) params.set('source', sourceFilter)
    if (typeFilter) params.set('type', typeFilter)
    
    // Role based filtering
    const userRole = session?.user?.role
    if (userRole === 'SALES') {
      params.set('assignedToId', session?.user?.id || '')
    } else if (userRole === 'SALE_LEAD') {
      if (assignedToIdFilter) {
        params.set('assignedToId', assignedToIdFilter)
      } else {
        params.set('teamId', session?.user?.teamId || '')
      }
    } else {
      if (assignedToIdFilter) params.set('assignedToId', assignedToIdFilter)
    }

    try {
      const data = await apiClient.get(`/customers?${params}`)
      setCustomers(extractArray(data))
      setTotal(data.meta?.total || data.meta?.totalItems || 0)
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [page, search, statusFilter, sourceFilter, typeFilter, assignedToIdFilter, session])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])
  useEffect(() => {
    let url = '/users?limit=100'
    if (session?.user?.role === 'SALE_LEAD' && session?.user?.teamId) {
      url += `&teamId=${session.user.teamId}`
    }
    apiClient.get(url).then(d => {
      const list = Array.isArray(d.data) ? d.data : [];
      const salesAndManagers = list.filter((u: any) => {
        if (!u.roles || u.roles.length === 0) return false;
        return u.roles.some((r: string) => {
          const lower = r.toLowerCase();
          return lower.includes('sale') || lower.includes('admin') || lower.includes('manager') || lower.includes('owner') || lower.includes('quản lý');
        });
      });
      let parsedUsers = salesAndManagers.map((u: any) => ({ id: u.id, name: u.fullName || u.name }));
      if (parsedUsers.length === 0 && session?.user?.role === 'SALES' && session?.user?.id) {
        parsedUsers = [{ id: session.user.id, name: session.user.name || 'Tôi' }];
      }
      setUsers(parsedUsers);
    }).catch(() => {
      if (session?.user?.role === 'SALES' && session?.user?.id) {
        setUsers([{ id: session.user.id, name: session.user.name || 'Tôi' }]);
      }
    })
  }, [session])

  const resetForm = () => {
    setEditId(null);
    setForm({ type: 'INDIVIDUAL', name: '', contactPerson: '', phone: '', email: '', address: '', province: '', projectName: '', source: 'WEBSITE', status: 'NEW', productNeeds: [], estimatedArea: '', estimatedBudget: '', notes: '', assignedToId: session?.user?.id || '', description: '', latitude: '', longitude: '' })
  }

  const handleEditClick = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditId(c.id);
      let needs = [];
      if (Array.isArray(c.productNeeds)) {
        needs = c.productNeeds;
      } else if (typeof c.productNeeds === 'string') {
        try {
          needs = JSON.parse(c.productNeeds);
          if (!Array.isArray(needs)) needs = (c.productNeeds as any).split(',').map((s: string) => s.trim()).filter(Boolean);
        } catch {
          needs = (c.productNeeds as any).split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      setForm({
        type: c.type || 'INDIVIDUAL',
        name: c.name || '',
        contactPerson: c.contactPerson || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        province: c.province || '',
        projectName: c.projectName || '',
        source: c.source || 'WEBSITE',
        status: c.status || 'NEW',
        productNeeds: needs,
        estimatedArea: c.estimatedArea ? String(c.estimatedArea) : '',
        estimatedBudget: c.estimatedBudget ? String(c.estimatedBudget) : '',
        notes: c.notes || '',
        assignedToId: c.assignedTo?.id || '',
        description: (c as any).description || '',
        latitude: (c as any).latitude || '',
        longitude: (c as any).longitude || '',
      });
    setShowAddModal(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        ...form,
        estimatedArea: form.estimatedArea ? parseFloat(form.estimatedArea as string) : undefined,
        estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget as string) : undefined,
        assignedToId: form.assignedToId || session?.user?.id || undefined,
        latitude: form.latitude ? parseFloat(String(form.latitude)) : undefined,
        longitude: form.longitude ? parseFloat(String(form.longitude)) : undefined,
        description: form.description || undefined,
      };
      
      // Clean up empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });
      // But ensure name is present
      payload.name = form.name;
      
      if (editId) {
        await apiClient.put(`/customers/${editId}`, payload);
      } else {
        await apiClient.post('/customers', payload);
      }
      
      setShowAddModal(false)
      resetForm()
      fetchCustomers()
    } catch (err: any) { 
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    finally { setSaving(false) }
  }

  const productOptions = ['Kính cường lực', 'Kính hộp', 'Kính dán an toàn', 'Vách kính', 'Cửa kính', 'Lan can kính', 'Cabin tắm kính', 'Mặt dựng kính', 'Khác']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Khách hàng</h1>
          <p className="text-surface-500 text-sm mt-1">Quản lý thông tin khách hàng và lịch sử chăm sóc</p>
        </div>
        <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
          <Plus size={16} /> Thêm khách hàng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khách hàng', value: total, icon: Users, color: 'text-brand-600 bg-brand-50' },
          { label: 'Mới trong tháng', value: customers.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length, icon: UserPlus, color: 'text-green-600 bg-green-50' },
          { label: 'Đang tư vấn', value: customers.filter(c => c.status === 'CONSULTING').length, icon: Phone, color: 'text-brand-600 bg-brand-50' },
          { label: 'Cần chăm sóc', value: customers.filter(c => c.status === 'FOLLOW_UP').length, icon: Filter, color: 'text-red-600 bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${stat.color}`}><stat.icon size={18} /></div>
              <div>
                <p className="text-xl font-bold text-surface-900">{stat.value}</p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm tên, SĐT, email, mã KH..." className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm" />
          </div>
          <select value={assignedToIdFilter} onChange={e => { setAssignedToIdFilter(e.target.value); setPage(1) }} className="border border-surface-200 rounded-lg px-3 py-2 text-sm min-w-[140px]">
            <option value="">Tất cả nhân viên</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border border-surface-200 rounded-lg px-3 py-2 text-sm min-w-[140px]">
            <option value="">Trạng thái</option>
            {Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1) }} className="border border-surface-200 rounded-lg px-3 py-2 text-sm min-w-[120px]">
            <option value="">Nguồn</option>
            {Object.entries(CUSTOMER_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="border border-surface-200 rounded-lg px-3 py-2 text-sm min-w-[140px]">
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
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j}><div className="h-4 bg-surface-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-surface-400">
                  <Users size={48} className="mx-auto mb-3 text-surface-300" />
                  <p className="font-medium">Chưa có khách hàng</p>
                  <p className="text-sm mt-1">Nhấn &quot;Thêm khách hàng&quot; để bắt đầu</p>
                </td></tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer hover:bg-brand-50/50 transition-colors group">
                    <td className="font-mono text-xs text-surface-500">{customer.code}</td>
                    <td>
                      <div className="font-medium text-surface-900">{customer.name}</div>
                      {customer.contactPerson && <div className="text-xs text-surface-400">{customer.contactPerson}</div>}
                    </td>
                    <td className="text-sm">{CUSTOMER_TYPE_LABELS[customer.type] || customer.type}</td>
                    <td className="text-sm">{customer.phone || '-'}</td>
                    <td className="text-sm">{CUSTOMER_SOURCE_LABELS[customer.source] || customer.source}</td>
                    <td className="text-sm">{customer.assignedTo?.name || '-'}</td>
                    <td><span className={`badge ${CUSTOMER_STATUS_COLORS[customer.status] || 'bg-surface-100 text-surface-800'}`}>{CUSTOMER_STATUS_LABELS[customer.status] || customer.status}</span></td>
                    <td className="text-sm text-surface-500">{formatDate(customer.createdAt)}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2 transition-opacity">
                        <button 
                          onClick={(e) => handleEditClick(customer, e)}
                          className="p-1.5 text-brand-600 hover:bg-brand-50 rounded" title="Sửa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        {session?.user?.role !== 'SALES' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); if(confirm('Bạn có chắc muốn xóa?')) apiClient.delete(`/customers/${customer.id}`).then(fetchCustomers) }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
            <p className="text-sm text-surface-500">Hiển thị {customers.length} / {total} khách hàng</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1
                return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm ${page === p ? 'bg-brand-700 text-white' : 'hover:bg-surface-100'}`}>{p}</button>
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editId ? "Sửa thông tin khách hàng" : "Thêm khách hàng mới"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Trạng thái *</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Loại khách hàng *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Nguồn khách *</label>
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(CUSTOMER_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Tên khách hàng / Công ty *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder="Nhập tên khách hàng" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Người liên hệ</label>
              <input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Số điện thoại *</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Tỉnh/Thành</label>
              <input value={form.province} onChange={e => setForm({...form, province: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Địa chỉ</label>
            <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          {/* Vị trí GPS */}
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-surface-700 flex items-center gap-1.5">
                <MapPin size={15} className="text-blue-600" /> Vị trí trên bản đồ
              </label>
              <button
                type="button"
                disabled={gettingLocation}
                onClick={() => {
                  if (!('geolocation' in navigator)) { alert('Trình duyệt không hỗ trợ định vị'); return }
                  setGettingLocation(true)
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setForm(f => ({...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
                      setGettingLocation(false)
                    },
                    (err) => { alert('Không thể lấy vị trí: ' + err.message); setGettingLocation(false) },
                    { enableHighAccuracy: true, timeout: 10000 }
                  )
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Navigation size={13} /> {gettingLocation ? 'Đang lấy...' : 'Lấy vị trí hiện tại'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-surface-500 mb-1">Vĩ độ (Latitude)</label>
                <input value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm font-mono bg-white" placeholder="VD: 16.0471" />
              </div>
              <div>
                <label className="block text-xs text-surface-500 mb-1">Kinh độ (Longitude)</label>
                <input value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm font-mono bg-white" placeholder="VD: 108.2068" />
              </div>
            </div>
            {form.latitude && form.longitude && (
              <a href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <MapPin size={12} /> Xem trên Google Maps
              </a>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Công trình / Dự án</label>
            <input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Nhu cầu sản phẩm</label>
            <div className="flex flex-wrap gap-2">
              {productOptions.map(p => (
                <button key={p} type="button" onClick={() => {
                  const needs = form.productNeeds.includes(p) ? form.productNeeds.filter(n => n !== p) : [...form.productNeeds, p]
                  setForm({...form, productNeeds: needs})
                }} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.productNeeds.includes(p) ? 'bg-brand-100 text-brand-700 border-brand-300' : 'bg-surface-50 text-surface-600 border-surface-200 hover:bg-surface-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Diện tích dự kiến (m²)</label>
              <input value={form.estimatedArea} onChange={e => setForm({...form, estimatedArea: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Ngân sách dự kiến (VNĐ)</label>
              <input value={form.estimatedBudget} onChange={e => setForm({...form, estimatedBudget: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" type="number" />
            </div>
          </div>
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Nhân viên phụ trách</label>
              <select value={form.assignedToId} onChange={e => setForm({...form, assignedToId: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Tự động (người tạo)</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          {/* Mô tả khách hàng */}
          <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
            <label className="block text-sm font-medium text-surface-700 mb-1">📋 Mô tả khách hàng</label>
            <p className="text-xs text-surface-400 mb-2">Ghi chú thói quen mua hàng, người ra quyết định, quy trình nội bộ của đại lý... để sale tiếp nhận có thể tham khảo.</p>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white" rows={4} placeholder="VD: Đại lý lớn, mua hàng theo quý. Người quyết định: Anh Hùng (GĐ). Thích sản phẩm kính cường lực 10mm, yêu cầu giao hàng nhanh..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Ghi chú nhanh</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="flex gap-3 pt-2 pb-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 btn-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Thêm khách hàng'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

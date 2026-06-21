'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, Plus, Send } from 'lucide-react'
import { formatDate, formatDateTime, formatCurrency, CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS, CUSTOMER_TYPE_LABELS, CUSTOMER_SOURCE_LABELS, INTERACTION_TYPE_LABELS, OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS, QUOTE_STATUS_LABELS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

interface CustomerDetail {
  id: string; code: string; name: string; type: string; contactPerson?: string
  phone?: string; email?: string; address?: string; province?: string
  projectName?: string; source: string; status: string; productNeeds: string[]
  estimatedArea?: number; estimatedBudget?: number; notes?: string
  nextFollowUpDate?: string; createdAt: string; updatedAt: string
  assignedTo?: { id: string; name: string }
  interactions: Array<{ id: string; type: string; content: string; result?: string; createdAt: string; user: { name: string }; nextFollowUpDate?: string }>
  opportunities: Array<{ id: string; code: string; name: string; stage: string; estimatedValue: number }>
  quotes: Array<{ id: string; code: string; status: string; total: number; createdAt: string }>
  orders: Array<{ id: string; code: string; status: string; paymentStatus: string; total: number; paidAmount: number }>
  tasks: Array<{ id: string; title: string; type: string; status: string; priority: string; dueDate: string }>
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [showInteractionModal, setShowInteractionModal] = useState(false)
  const [interactionForm, setInteractionForm] = useState({ type: 'CALL', content: '', result: '', nextFollowUpDate: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then(r => r.json())
      .then(setCustomer)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${params.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...interactionForm, customerId: params.id }),
      })
      if (res.ok) {
        setShowInteractionModal(false)
        setInteractionForm({ type: 'CALL', content: '', result: '', nextFollowUpDate: '' })
        // Refresh data
        const data = await fetch(`/api/customers/${params.id}`).then(r => r.json())
        setCustomer(data)
      }
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  if (!customer) return <div className="text-center py-12 text-gray-500">Không tìm thấy khách hàng</div>

  const tabs = [
    { key: 'info', label: 'Thông tin' },
    { key: 'interactions', label: `Lịch sử chăm sóc (${customer.interactions?.length || 0})` },
    { key: 'opportunities', label: `Cơ hội (${customer.opportunities?.length || 0})` },
    { key: 'quotes', label: `Báo giá (${customer.quotes?.length || 0})` },
    { key: 'orders', label: `Đơn hàng (${customer.orders?.length || 0})` },
    { key: 'tasks', label: `Công việc (${customer.tasks?.length || 0})` },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/customers')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1e293b]">{customer.name}</h1>
            <span className={`badge ${CUSTOMER_STATUS_COLORS[customer.status]}`}>{CUSTOMER_STATUS_LABELS[customer.status]}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{customer.code} · {CUSTOMER_TYPE_LABELS[customer.type]} · {CUSTOMER_SOURCE_LABELS[customer.source]}</p>
        </div>
        <button onClick={() => setShowInteractionModal(true)} className="flex items-center gap-2 px-4 py-2 gradient-blue text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Ghi chăm sóc
        </button>
      </div>

      {/* Contact Info Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-gray-400" /><span>{customer.phone}</span></div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-gray-400" /><span>{customer.email}</span></div>
          )}
          {customer.address && (
            <div className="flex items-center gap-2 text-sm"><MapPin size={14} className="text-gray-400" /><span>{customer.address}{customer.province ? `, ${customer.province}` : ''}</span></div>
          )}
          {customer.projectName && (
            <div className="flex items-center gap-2 text-sm"><Building2 size={14} className="text-gray-400" /><span>{customer.projectName}</span></div>
          )}
          {customer.assignedTo && (
            <div className="flex items-center gap-2 text-sm"><span className="text-gray-400">NV:</span><span className="font-medium">{customer.assignedTo.name}</span></div>
          )}
          {customer.nextFollowUpDate && (
            <div className="flex items-center gap-2 text-sm"><Calendar size={14} className="text-gray-400" /><span>Chăm sóc: {formatDate(customer.nextFollowUpDate)}</span></div>
          )}
        </div>
        {customer.productNeeds?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {customer.productNeeds.map(p => <span key={p} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{p}</span>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'info' && (
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Người liên hệ:</span> <span className="font-medium">{customer.contactPerson || '-'}</span></div>
              <div><span className="text-gray-500">Diện tích dự kiến:</span> <span className="font-medium">{customer.estimatedArea ? `${customer.estimatedArea} m²` : '-'}</span></div>
              <div><span className="text-gray-500">Ngân sách:</span> <span className="font-medium">{customer.estimatedBudget ? formatCurrency(customer.estimatedBudget) : '-'}</span></div>
              <div><span className="text-gray-500">Ngày tạo:</span> <span className="font-medium">{formatDate(customer.createdAt)}</span></div>
            </div>
            {customer.notes && <div className="pt-4 border-t"><p className="text-sm text-gray-500">Ghi chú:</p><p className="text-sm mt-1">{customer.notes}</p></div>}
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-4">
            {customer.interactions?.length > 0 ? customer.interactions.map(interaction => (
              <div key={interaction.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-400 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge bg-blue-100 text-blue-800">{INTERACTION_TYPE_LABELS[interaction.type]}</span>
                      <span className="text-xs text-gray-400">{interaction.user.name}</span>
                    </div>
                    <p className="text-sm text-[#1e293b]">{interaction.content}</p>
                    {interaction.result && <p className="text-sm text-gray-500 mt-1">Kết quả: {interaction.result}</p>}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(interaction.createdAt)}</span>
                </div>
              </div>
            )) : <div className="bg-white rounded-xl p-8 text-center text-gray-400"><Send size={40} className="mx-auto mb-2" /><p>Chưa có lịch sử chăm sóc</p></div>}
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full data-table">
              <thead><tr><th>Mã</th><th>Tên cơ hội</th><th>Giai đoạn</th><th>Giá trị</th></tr></thead>
              <tbody>
                {customer.opportunities?.length > 0 ? customer.opportunities.map(opp => (
                  <tr key={opp.id} onClick={() => router.push(`/pipeline`)} className="cursor-pointer">
                    <td className="font-mono text-xs">{opp.code}</td>
                    <td>{opp.name}</td>
                    <td><span className={`badge ${OPPORTUNITY_STAGE_COLORS[opp.stage]}`}>{OPPORTUNITY_STAGE_LABELS[opp.stage]}</span></td>
                    <td>{formatCurrency(opp.estimatedValue)}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có cơ hội</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full data-table">
              <thead><tr><th>Mã BG</th><th>Trạng thái</th><th>Tổng tiền</th><th>Ngày tạo</th></tr></thead>
              <tbody>
                {customer.quotes?.length > 0 ? customer.quotes.map(q => (
                  <tr key={q.id} onClick={() => router.push(`/quotes/${q.id}`)} className="cursor-pointer">
                    <td className="font-mono text-xs">{q.code}</td>
                    <td><span className="badge bg-purple-100 text-purple-800">{QUOTE_STATUS_LABELS[q.status]}</span></td>
                    <td>{formatCurrency(q.total)}</td>
                    <td>{formatDate(q.createdAt)}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có báo giá</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full data-table">
              <thead><tr><th>Mã ĐH</th><th>Trạng thái</th><th>Thanh toán</th><th>Tổng</th><th>Đã TT</th></tr></thead>
              <tbody>
                {customer.orders?.length > 0 ? customer.orders.map(o => (
                  <tr key={o.id} onClick={() => router.push(`/orders/${o.id}`)} className="cursor-pointer">
                    <td className="font-mono text-xs">{o.code}</td>
                    <td><span className="badge bg-blue-100 text-blue-800">{ORDER_STATUS_LABELS[o.status]}</span></td>
                    <td><span className={`badge ${PAYMENT_STATUS_COLORS[o.paymentStatus]}`}>{PAYMENT_STATUS_LABELS[o.paymentStatus]}</span></td>
                    <td>{formatCurrency(o.total)}</td>
                    <td>{formatCurrency(o.paidAmount)}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có đơn hàng</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {customer.tasks?.length > 0 ? customer.tasks.map(t => (
              <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <span className={`badge ${TASK_PRIORITY_COLORS[t.priority]}`}>{TASK_PRIORITY_LABELS[t.priority]}</span>
                  <span className="text-sm font-medium">{t.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatDate(t.dueDate)}</span>
                  <span className={`badge ${t.status === 'DONE' ? 'bg-green-100 text-green-800' : t.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {TASK_STATUS_LABELS[t.status]}
                  </span>
                </div>
              </div>
            )) : <div className="bg-white rounded-xl p-8 text-center text-gray-400">Chưa có công việc</div>}
          </div>
        )}
      </div>

      {/* Add Interaction Modal */}
      <Modal isOpen={showInteractionModal} onClose={() => setShowInteractionModal(false)} title="Ghi lịch sử chăm sóc">
        <form onSubmit={handleAddInteraction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức *</label>
            <select value={interactionForm.type} onChange={e => setInteractionForm({...interactionForm, type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {Object.entries(INTERACTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung trao đổi *</label>
            <textarea value={interactionForm.content} onChange={e => setInteractionForm({...interactionForm, content: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Mô tả nội dung cuộc trao đổi..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả</label>
            <input value={interactionForm.result} onChange={e => setInteractionForm({...interactionForm, result: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Kết quả cuộc trao đổi" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn chăm sóc tiếp</label>
            <input type="date" value={interactionForm.nextFollowUpDate} onChange={e => setInteractionForm({...interactionForm, nextFollowUpDate: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowInteractionModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 gradient-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

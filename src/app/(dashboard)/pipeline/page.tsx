'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, LayoutGrid, List, ChevronRight } from 'lucide-react'
import { formatCurrency, OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

interface Opportunity {
  id: string; code: string; name: string; stage: string; estimatedValue: number
  probability: number; expectedCloseDate?: string; projectName?: string
  customer: { id: string; name: string; code: string }
  assignedTo: { id: string; name: string }
}

const STAGES = ['NEW_LEAD', 'CONTACTED', 'SURVEYED', 'CONSULTING', 'QUOTE_SENT', 'NEGOTIATING', 'CONTRACT_PENDING', 'WON', 'LOST']

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLossModal, setShowLossModal] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [lossReason, setLossReason] = useState('')
  const [pendingStageChange, setPendingStageChange] = useState<{ id: string; stage: string } | null>(null)
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', customerId: '', projectName: '', estimatedValue: '',
    probability: '50', products: [] as string[], notes: '',
  })

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '200' })
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/opportunities?${params}`)
      const data = await res.json()
      setOpportunities(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { fetchOpportunities() }, [fetchOpportunities])
  useEffect(() => {
    fetch('/api/customers?limit=200').then(r => r.json()).then(d => setCustomers(d.data || [])).catch(() => {})
  }, [])

  const handleStageChange = async (id: string, newStage: string) => {
    if (newStage === 'LOST') {
      setPendingStageChange({ id, stage: newStage })
      setShowLossModal(true)
      return
    }

    try {
      await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      fetchOpportunities()
    } catch { alert('Có lỗi xảy ra') }
  }

  const handleLossSubmit = async () => {
    if (!pendingStageChange || !lossReason.trim()) return
    try {
      await fetch(`/api/opportunities/${pendingStageChange.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'LOST', lossReason }),
      })
      setShowLossModal(false)
      setLossReason('')
      setPendingStageChange(null)
      fetchOpportunities()
    } catch { alert('Có lỗi xảy ra') }
  }

  const handleAddOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimatedValue: parseFloat(form.estimatedValue) || 0,
          probability: parseInt(form.probability) || 50,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setForm({ name: '', customerId: '', projectName: '', estimatedValue: '', probability: '50', products: [], notes: '' })
        fetchOpportunities()
      }
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const getStageOpps = (stage: string) => opportunities.filter(o => o.stage === stage)
  const getStageValue = (stage: string) => getStageOpps(stage).reduce((s, o) => s + o.estimatedValue, 0)

  const totalPipelineValue = opportunities.filter(o => !['WON', 'LOST'].includes(o.stage)).reduce((s, o) => s + o.estimatedValue, 0)
  const weightedValue = opportunities.filter(o => !['WON', 'LOST'].includes(o.stage)).reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Pipeline bán hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng: {formatCurrency(totalPipelineValue)} · Dự kiến: {formatCurrency(weightedValue)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}><List size={16} /></button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 gradient-blue text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Thêm cơ hội
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm cơ hội..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {STAGES.map(stage => (
            <div key={stage} className="flex-shrink-0 w-72">
              <div className={`rounded-t-xl px-3 py-2 ${OPPORTUNITY_STAGE_COLORS[stage]?.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{OPPORTUNITY_STAGE_LABELS[stage]}</span>
                  <span className="text-xs font-medium bg-white/50 px-2 py-0.5 rounded-full">{getStageOpps(stage).length}</span>
                </div>
                <p className="text-xs mt-0.5 opacity-75">{formatCurrency(getStageValue(stage))}</p>
              </div>
              <div
                className="bg-gray-50 rounded-b-xl p-2 kanban-column space-y-2 min-h-[200px] border border-gray-100"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  if (draggedId) handleStageChange(draggedId, stage)
                  setDraggedId(null)
                }}
              >
                {loading ? (
                  [...Array(2)].map((_, i) => <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />)
                ) : (
                  getStageOpps(stage).map(opp => (
                    <div
                      key={opp.id}
                      draggable
                      onDragStart={() => setDraggedId(opp.id)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:border-blue-200"
                    >
                      <p className="text-sm font-medium text-[#1e293b] truncate">{opp.name}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{opp.customer.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-[#1e3a5f]">{formatCurrency(opp.estimatedValue)}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{opp.probability}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{opp.assignedTo?.name}</span>
                        <span className="text-xs text-gray-400">{opp.code}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Mã</th><th>Tên cơ hội</th><th>Khách hàng</th><th>Giai đoạn</th>
                <th>Giá trị</th><th>Xác suất</th><th>Nhân viên</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map(opp => (
                <tr key={opp.id} className="hover:bg-blue-50/50">
                  <td className="font-mono text-xs">{opp.code}</td>
                  <td className="font-medium">{opp.name}</td>
                  <td>{opp.customer.name}</td>
                  <td>
                    <select value={opp.stage} onChange={e => handleStageChange(opp.id, e.target.value)} className="text-xs border rounded px-2 py-1">
                      {STAGES.map(s => <option key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="font-semibold">{formatCurrency(opp.estimatedValue)}</td>
                  <td>{opp.probability}%</td>
                  <td>{opp.assignedTo?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Opportunity Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm cơ hội bán hàng" size="lg">
        <form onSubmit={handleAddOpportunity} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên cơ hội *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="VD: Cung cấp kính cường lực cho tòa nhà ABC" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng *</label>
            <select value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Chọn khách hàng</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị dự kiến (VNĐ)</label>
              <input value={form.estimatedValue} onChange={e => setForm({...form, estimatedValue: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác suất chốt (%)</label>
              <input value={form.probability} onChange={e => setForm({...form, probability: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="number" min="0" max="100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Công trình / Dự án</label>
            <input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 gradient-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Thêm cơ hội'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Loss Reason Modal */}
      <Modal isOpen={showLossModal} onClose={() => { setShowLossModal(false); setPendingStageChange(null) }} title="Lý do thất bại">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Vui lòng nhập lý do chốt thất bại:</p>
          <textarea value={lossReason} onChange={e => setLossReason(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="VD: Khách chọn đối thủ giá rẻ hơn..." />
          <div className="flex gap-3">
            <button onClick={() => { setShowLossModal(false); setPendingStageChange(null) }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Hủy</button>
            <button onClick={handleLossSubmit} disabled={!lossReason.trim()} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              Xác nhận thất bại
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

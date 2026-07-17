'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, LayoutGrid, List, ChevronRight } from 'lucide-react'
import { formatCurrency, OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { apiClient } from '@/lib/api-client'

interface Opportunity {
  id: string; code: string; name: string; stage: string; estimatedValue: number
  probability: number; expectedCloseDate?: string; projectName?: string
  customer: { id: string; name: string; code: string }
  assignedTo: { id: string; name: string }
  products?: string
  notes?: string
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productsList, setProductsList] = useState<Array<{ id: string; name: string; code: string }>>([])

  const defaultForm = {
    name: '', customerId: '', assignedToId: '', projectName: '', estimatedValue: '',
    probability: '50', products: [] as Array<{ productId: string, quantity: number }>, notes: '', stage: 'NEW_LEAD', lossReason: ''
  }
  const [form, setForm] = useState(defaultForm)

  const [assignedToId, setAssignedToId] = useState('')
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])

  const extractArray = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.items && Array.isArray(res.items)) return res.items;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.items && Array.isArray(res.data.items)) return res.data.items;
    return [];
  };

  const { data: session } = useSession()

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (search) params.set('search', search)
    
    // Role based filtering
    const userRole = session?.user?.role
    if (userRole === 'SALES') {
      params.set('assignedToId', session?.user?.id || '')
    } else if (userRole === 'SALE_LEAD') {
      if (assignedToId) {
        params.set('assignedToId', assignedToId)
      } else {
        params.set('teamId', session?.user?.teamId || '')
      }
    } else {
      if (assignedToId) params.set('assignedToId', assignedToId)
    }

    try {
      const data = await apiClient.get(`/opportunities?${params}`)
      setOpportunities(extractArray(data))
    } catch (err: any) { 
      console.error(err)
      alert('Lỗi khi tải dữ liệu: ' + (err.message || JSON.stringify(err)))
    }
    finally { setLoading(false) }
  }, [search, assignedToId, session])

  useEffect(() => { fetchOpportunities() }, [fetchOpportunities])
  useEffect(() => {
    apiClient.get('/products?page=1&limit=100').then(d => {
      setProductsList(extractArray(d));
    }).catch(() => {})
    apiClient.get('/customers?page=1&limit=100').then(d => {
      setCustomers(extractArray(d));
    }).catch(() => {})
    let url = '/users?page=1&limit=100'
    if (session?.user?.role === 'SALE_LEAD' && session?.user?.teamId) {
      url += `&teamId=${session.user.teamId}`
    }
    apiClient.get(url).then(d => {
      const list = extractArray(d);
      const salesAndManagers = list.filter((u: any) => {
        if (!u.roles || u.roles.length === 0) return false;
        return u.roles.some((r: string) => {
          const lower = r.toLowerCase();
          return lower.includes('sale') || lower.includes('admin') || lower.includes('manager') || lower.includes('owner') || lower.includes('quản lý');
        });
      });
      setUsers(salesAndManagers.map((u: any) => ({ id: u.id, name: u.fullName || u.name })));
    }).catch(() => {})
  }, [session])

  const handleStageChange = async (id: string, newStage: string) => {
    if (newStage === 'LOST') {
      setPendingStageChange({ id, stage: newStage })
      setShowLossModal(true)
      return
    }

    try {
      await apiClient.put(`/opportunities/${id}`, { stage: newStage })
      fetchOpportunities()
    } catch { alert('Có lỗi xảy ra') }
  }

  const handleLossSubmit = async () => {
    if (!pendingStageChange || !lossReason.trim()) return
    try {
      await apiClient.put(`/opportunities/${pendingStageChange.id}`, { stage: 'LOST', lossReason })
      setShowLossModal(false)
      setLossReason('')
      setPendingStageChange(null)
      fetchOpportunities()
    } catch { alert('Có lỗi xảy ra') }
  }

  const openEditModal = (opp: Opportunity) => {
    let parsedProducts = []
    if (opp.products) {
      try { parsedProducts = JSON.parse(opp.products) } catch (e) {}
    }

    setForm({
      name: opp.name,
      customerId: opp.customer?.id || '',
      assignedToId: opp.assignedTo?.id || '',
      projectName: opp.projectName || '',
      estimatedValue: opp.estimatedValue.toString(),
      probability: opp.probability.toString(),
      products: parsedProducts,
      notes: opp.notes || '',
      stage: opp.stage || 'NEW_LEAD',
      lossReason: ''
    })
    setEditingId(opp.id)
    setShowAddModal(true)
  }

  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        name: form.name,
        customerId: form.customerId,
        assignedToId: form.assignedToId,
        probability: parseInt(form.probability) || 50,
        stage: form.stage
      }
      if (form.projectName) payload.projectName = form.projectName;
      if (form.estimatedValue) payload.estimatedValue = parseFloat(form.estimatedValue);
      if (form.notes) payload.notes = form.notes;
      if (form.stage === 'LOST' && form.lossReason) payload.lossReason = form.lossReason;
      
      payload.products = JSON.stringify(form.products)

      if (editingId) {
        await apiClient.put(`/opportunities/${editingId}`, payload)
      } else {
        await apiClient.post('/opportunities', payload)
      }
      setShowAddModal(false)
      setForm(defaultForm)
      setEditingId(null)
      fetchOpportunities()
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
          <h1 className="text-2xl font-bold text-surface-900">Pipeline bán hàng</h1>
          <p className="text-sm text-surface-500 mt-1">
            Tổng: {formatCurrency(totalPipelineValue)} · Dự kiến: {formatCurrency(weightedValue)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}><List size={16} /></button>
          </div>
          <button onClick={() => { setEditingId(null); setForm(defaultForm); setShowAddModal(true) }} className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Thêm cơ hội
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm cơ hội..." className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm" />
        </div>
        <div className="w-full md:w-64">
          <select 
            value={assignedToId} 
            onChange={e => setAssignedToId(e.target.value)}
            className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả nhân viên</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 snap-x" style={{ height: 'calc(100vh - 240px)' }}>
          {STAGES.map(stage => (
            <div key={stage} className="flex-shrink-0 w-72 snap-start flex flex-col h-full">
              <div className={`rounded-t-xl px-3 py-2 flex-shrink-0 ${OPPORTUNITY_STAGE_COLORS[stage]?.replace('text-', 'bg-').split(' ')[0] || 'bg-surface-100'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{OPPORTUNITY_STAGE_LABELS[stage]}</span>
                  <span className="text-xs font-medium bg-white/50 px-2 py-0.5 rounded-full">{getStageOpps(stage).length}</span>
                </div>
                <p className="text-xs mt-0.5 opacity-75">{formatCurrency(getStageValue(stage))}</p>
              </div>
              <div
                className="bg-surface-50 rounded-b-xl p-2 kanban-column space-y-2 min-h-[200px] border border-surface-100"
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
                      onClick={() => openEditModal(opp)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-surface-100 hover:shadow-md transition-all cursor-pointer active:cursor-grabbing hover:border-brand-200"
                    >
                      <p className="text-sm font-medium text-surface-900 truncate">{opp.name}</p>
                      <p className="text-xs text-surface-500 mt-1 truncate">{opp.customer.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-surface-900">{formatCurrency(opp.estimatedValue)}</span>
                        <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{opp.probability}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-surface-400">{opp.assignedTo?.name}</span>
                        <span className="text-xs text-surface-400">{opp.code}</span>
                      </div>
                      {opp.products && (() => {
                        try {
                          const p = JSON.parse(opp.products)
                          if (!p || p.length === 0) return null;
                          return (
                            <div className="mt-2 text-xs font-medium text-brand-600 bg-brand-50 p-1.5 rounded truncate">
                              🛒 {p.length} SP quan tâm (VD: {productsList.find(x => x.id === p[0].productId)?.code || 'SP'})
                            </div>
                          )
                        } catch { return null }
                      })()}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full data-table min-w-[800px]">
            <thead>
              <tr>
                <th>Mã</th><th>Tên cơ hội</th><th>Khách hàng</th><th>Giai đoạn</th>
                <th>Giá trị</th><th>Xác suất</th><th>Nhân viên</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map(opp => (
                <tr key={opp.id} className="hover:bg-brand-50/50">
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

      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title={editingId ? "Cập nhật cơ hội" : "Thêm cơ hội bán hàng"} 
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-surface-300 rounded-lg text-sm">Hủy</button>
            <button type="submit" form="opp-form" disabled={saving} className="flex-1 py-2 btn-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </>
        }
      >
        <form id="opp-form" onSubmit={handleSaveOpportunity} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Tên cơ hội *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder="VD: Cung cấp kính cường lực cho tòa nhà ABC" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Khách hàng *</label>
            <select value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Chọn khách hàng</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Người phụ trách *</label>
            <select value={form.assignedToId} onChange={e => setForm({...form, assignedToId: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Chọn nhân viên</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          {editingId && (
            <div className="grid grid-cols-2 gap-4 border-b border-surface-200 pb-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Giai đoạn</label>
                <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                  {STAGES.map(s => <option key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              {form.stage === 'LOST' && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Lý do thất bại</label>
                  <input value={form.lossReason} onChange={e => setForm({...form, lossReason: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" placeholder="VD: Khách chê giá cao..." required />
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Giá trị dự kiến (VNĐ)</label>
              <input value={form.estimatedValue} onChange={e => setForm({...form, estimatedValue: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Xác suất chốt (%)</label>
              <input value={form.probability} onChange={e => setForm({...form, probability: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" type="number" min="0" max="100" />
            </div>
          </div>
          
          <div className="border border-surface-200 rounded-lg p-3 bg-surface-50 space-y-3 mt-4 mb-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-surface-700">Sản phẩm khách hàng quan tâm</label>
              <button 
                type="button" 
                onClick={() => setForm({...form, products: [...form.products, { productId: '', quantity: 1 }]})}
                className="text-xs bg-white border border-surface-300 px-2 py-1 rounded text-brand-600 hover:bg-brand-50"
              >
                + Thêm SP
              </button>
            </div>
            {form.products.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select 
                  value={item.productId} 
                  onChange={e => {
                    const newP = [...form.products];
                    newP[idx].productId = e.target.value;
                    setForm({...form, products: newP})
                  }} 
                  className="flex-1 border border-surface-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Chọn sản phẩm</option>
                  {productsList.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                </select>
                <input 
                  type="number" min="1" placeholder="SL" value={item.quantity} 
                  onChange={e => {
                    const newP = [...form.products];
                    newP[idx].quantity = parseInt(e.target.value) || 1;
                    setForm({...form, products: newP})
                  }}
                  className="w-20 border border-surface-300 rounded px-2 py-1.5 text-sm"
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const newP = form.products.filter((_, i) => i !== idx);
                    setForm({...form, products: newP});
                  }}
                  className="text-red-500 hover:text-red-700 p-1 font-bold"
                >✕</button>
              </div>
            ))}
            {form.products.length === 0 && <p className="text-xs text-surface-500 italic">Chưa có sản phẩm nào. Bấm "+ Thêm SP" để thêm.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Công trình / Dự án</label>
            <input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={showLossModal} 
        onClose={() => { setShowLossModal(false); setPendingStageChange(null) }} 
        title="Lý do thất bại"
        footer={
          <>
            <button onClick={() => { setShowLossModal(false); setPendingStageChange(null) }} className="flex-1 py-2 border border-surface-300 rounded-lg text-sm">Hủy</button>
            <button onClick={handleLossSubmit} disabled={!lossReason.trim()} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              Xác nhận thất bại
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-500">Vui lòng nhập lý do chốt thất bại:</p>
          <textarea value={lossReason} onChange={e => setLossReason(e.target.value)} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="VD: Khách chọn đối thủ giá rẻ hơn..." />
        </div>
      </Modal>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Plus, CheckCircle, Clock, AlertTriangle, Search } from 'lucide-react'
import { formatDate, TASK_TYPE_LABELS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useSession } from 'next-auth/react'

interface Task {
  id: string; title: string; type: string; priority: string; status: string
  dueDate: string; completedAt?: string; notes?: string
  customer?: { id: string; name: string }
  assignedTo: { id: string; name: string }
}

export default function TasksPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])

  const [form, setForm] = useState({
    title: '', customerId: '', type: 'CALL', dueDate: '', priority: 'MEDIUM',
    assignedToId: '', notes: '',
  })

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (filter) params.set('filter', filter)
    if (typeFilter) params.set('type', typeFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (assignedToFilter) params.set('assignedToId', assignedToFilter)
    try {
      const data = await apiClient.get(`/tasks?${params}`)
      setTasks(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [filter, typeFilter, priorityFilter, assignedToFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => {
    apiClient.get('/customers?limit=200').then(d => setCustomers(d.data || [])).catch(() => {})
    apiClient.get('/users').then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const handleComplete = async (id: string) => {
    try {
      await apiClient.put(`/tasks/${id}`, { status: 'DONE' })
      fetchTasks()
    } catch { alert('Có lỗi xảy ra') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.post('/tasks', { ...form, customerId: form.customerId || undefined, assignedToId: form.assignedToId || session?.user?.id })
      setShowModal(false)
      setForm({ title: '', customerId: '', type: 'CALL', dueDate: '', priority: 'MEDIUM', assignedToId: '', notes: '' })
      fetchTasks()
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const isOverdue = (task: Task) => new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  const isToday = (date: string) => new Date(date).toDateString() === new Date().toDateString()

  const tabs = [
    { key: '', label: 'Tất cả', count: tasks.length },
    { key: 'today', label: 'Hôm nay', icon: Clock },
    { key: 'overdue', label: 'Quá hạn', icon: AlertTriangle },
    { key: 'week', label: 'Tuần này' },
  ]

  const filteredTasks = tasks.filter(t => {
    if (search) return t.title.toLowerCase().includes(search.toLowerCase())
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Công việc</h1>
          <p className="text-surface-500 text-sm mt-1">Quản lý task và lịch chăm sóc khách hàng</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Tạo task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key ? 'btn-primary text-white' : 'bg-white text-surface-600 hover:bg-surface-50 shadow-sm'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm task..." className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm" />
        </div>
        <select value={assignedToFilter} onChange={e => setAssignedToFilter(e.target.value)} className="border border-surface-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả nhân viên</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-surface-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Loại</option>
          {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border border-surface-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Ưu tiên</option>
          {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-surface-400">
            <CheckCircle size={48} className="mx-auto mb-3 text-surface-300" />
            <p className="font-medium">Không có task nào</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${isOverdue(task) ? 'border-l-4 border-red-400' : isToday(task.dueDate) ? 'border-l-4 border-amber-400' : 'border-l-4 border-surface-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleComplete(task.id)} disabled={task.status === 'DONE'} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-surface-300 hover:border-green-400'}`}>
                    {task.status === 'DONE' && <CheckCircle size={12} className="text-white" />}
                  </button>
                  <div>
                    <p className={`font-medium ${task.status === 'DONE' ? 'line-through text-surface-400' : 'text-surface-900'}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge bg-surface-100 text-surface-700">{TASK_TYPE_LABELS[task.type]}</span>
                      {task.customer && <span className="text-xs text-surface-500">{task.customer.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${TASK_PRIORITY_COLORS[task.priority]}`}>{TASK_PRIORITY_LABELS[task.priority]}</span>
                  <span className={`text-xs ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-surface-500'}`}>{formatDate(task.dueDate)}</span>
                  <span className={`badge ${TASK_STATUS_COLORS[task.status]}`}>{TASK_STATUS_LABELS[task.status]}</span>
                  <span className="text-xs text-surface-400">{task.assignedTo.name}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo công việc mới">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Tiêu đề *</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Loại *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Ưu tiên</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Khách hàng</label>
            <select value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Không liên kết</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Hạn xử lý *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Người phụ trách</label>
              <select value={form.assignedToId} onChange={e => setForm({...form, assignedToId: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Bản thân</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-surface-300 rounded-lg text-sm hover:bg-surface-50">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 btn-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Đang tạo...' : 'Tạo task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

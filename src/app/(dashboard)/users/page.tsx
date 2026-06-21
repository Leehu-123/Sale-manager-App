'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, UserCog, Shield, Users as UsersIcon } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface User {
  id: string; email: string; name: string; phone?: string; role: string
  status: string; teamId?: string; createdAt: string
  team?: { id: string; name: string }
  _count: { customers: number; opportunities: number; orders: number }
}

interface Team { id: string; name: string; _count: { users: number } }

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Admin', MANAGER: 'Quản lý', SALES: 'Nhân viên' }
const ROLE_COLORS: Record<string, string> = { ADMIN: 'bg-red-100 text-red-800', MANAGER: 'bg-purple-100 text-purple-800', SALES: 'bg-blue-100 text-blue-800' }
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Hoạt động', ON_LEAVE: 'Nghỉ phép', INACTIVE: 'Ngừng HĐ' }
const STATUS_COLORS: Record<string, string> = { ACTIVE: 'bg-green-100 text-green-800', ON_LEAVE: 'bg-amber-100 text-amber-800', INACTIVE: 'bg-gray-100 text-gray-500' }

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)

  const [form, setForm] = useState({ name: '', email: '', password: '123456', phone: '', role: 'SALES', teamId: '', status: 'ACTIVE' })
  const [teamForm, setTeamForm] = useState({ name: '', description: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (teamFilter) params.set('teamId', teamFilter)

      const [usersRes, teamsRes] = await Promise.all([
        fetch(`/api/users?${params}`).then(r => r.json()),
        fetch('/api/teams').then(r => r.json()),
      ])
      setUsers(Array.isArray(usersRes) ? usersRes : [])
      setTeams(Array.isArray(teamsRes) ? teamsRes : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [search, roleFilter, teamFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const isEdit = !!editUser
    const url = isEdit ? `/api/users/${editUser.id}` : '/api/users'
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const body = isEdit ? { name: form.name, phone: form.phone, role: form.role, teamId: form.teamId || null, status: form.status, ...(form.password ? { password: form.password } : {}) } : form
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setShowModal(false)
        setEditUser(null)
        setForm({ name: '', email: '', password: '123456', phone: '', role: 'SALES', teamId: '', status: 'ACTIVE' })
        fetchData()
      } else { const err = await res.json(); alert(err.error || 'Có lỗi xảy ra') }
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(teamForm) })
      if (res.ok) { setShowTeamModal(false); setTeamForm({ name: '', description: '' }); fetchData() }
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const handleEdit = (user: User) => {
    setEditUser(user)
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', role: user.role, teamId: user.teamId || '', status: user.status })
    setShowModal(true)
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  if (!isAdmin && session?.user?.role !== 'MANAGER') {
    return <div className="text-center py-12 text-gray-500"><Shield size={48} className="mx-auto mb-3 text-gray-300" /><p className="font-medium">Bạn không có quyền truy cập trang này</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Quản lý nhân sự</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý đội ngũ kinh doanh và phân quyền</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowTeamModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              <UsersIcon size={16} /> Thêm team
            </button>
            <button onClick={() => { setEditUser(null); setForm({ name: '', email: '', password: '123456', phone: '', role: 'SALES', teamId: '', status: 'ACTIVE' }); setShowModal(true) }} className="flex items-center gap-2 px-4 py-2.5 gradient-blue text-white rounded-lg text-sm font-medium">
              <Plus size={16} /> Thêm nhân viên
            </button>
          </div>
        )}
      </div>

      {/* Teams Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1e293b]">{team.name}</h3>
              <span className="text-sm text-gray-500">{team._count.users} thành viên</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {users.filter(u => u.teamId === team.id).map(u => (
                <span key={u.id} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">{u.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân viên..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Vai trò</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả team</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr><th>Tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Team</th><th>Trạng thái</th><th>KH</th><th>Cơ hội</th><th>ĐH</th><th>Ngày tạo</th></tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}>{[...Array(10)].map((_, j) => <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
            ) : users.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-gray-400"><UserCog size={48} className="mx-auto mb-3 text-gray-300" /><p>Chưa có nhân viên</p></td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} onClick={() => isAdmin ? handleEdit(user) : null} className={isAdmin ? 'cursor-pointer hover:bg-blue-50/50' : ''}>
                  <td className="font-medium">{user.name}</td>
                  <td className="text-sm">{user.email}</td>
                  <td className="text-sm">{user.phone || '-'}</td>
                  <td><span className={`badge ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span></td>
                  <td className="text-sm">{user.team?.name || '-'}</td>
                  <td><span className={`badge ${STATUS_COLORS[user.status]}`}>{STATUS_LABELS[user.status]}</span></td>
                  <td className="text-center">{user._count.customers}</td>
                  <td className="text-center">{user._count.opportunities}</td>
                  <td className="text-center">{user._count.orders}</td>
                  <td className="text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditUser(null) }} title={editUser ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          {!editUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{editUser ? 'Đổi mật khẩu' : 'Mật khẩu *'}</label>
              <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editUser} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={editUser ? 'Để trống nếu không đổi' : '123456'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <select value={form.teamId} onChange={e => setForm({...form, teamId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Chọn team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {editUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditUser(null) }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 gradient-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu...' : editUser ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Team Modal */}
      <Modal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} title="Thêm team mới">
        <form onSubmit={handleTeamSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên team *</label>
            <input value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="VD: Team Khu vực Đà Nẵng" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea value={teamForm.description} onChange={e => setTeamForm({...teamForm, description: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowTeamModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 gradient-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Đang tạo...' : 'Tạo team'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

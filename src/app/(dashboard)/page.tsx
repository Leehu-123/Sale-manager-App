'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  TrendingUp, DollarSign, AlertCircle, UserPlus,
  Target, Briefcase, FileText, CheckCircle,
  Clock, AlertTriangle, Phone
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency, formatNumber, OPPORTUNITY_STAGE_LABELS } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface DashboardData {
  totalRevenue: number
  paidRevenue: number
  unpaidRevenue: number
  newCustomers: number
  activeOpportunities: number
  pipelineValue: number
  quoteSent: number
  quotesPending: number
  closeRate: number
  tasksDueToday: number
  tasksOverdue: number
  customersNeedFollowUp: number
  revenueByMonth: Array<{ month: string; revenue: number; paid: number }>
  pipelineByStage: Array<{ stage: string; count: number; value: number }>
  topProducts: Array<{ name: string; revenue: number; count: number }>
  revenueByUser: Array<{ name: string; revenue: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316', '#6366f1']

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-xl" />
          <div className="h-80 bg-white rounded-xl" />
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Doanh thu tháng này', value: formatCurrency(data?.totalRevenue || 0), icon: TrendingUp, gradient: 'bg-gradient-to-br from-brand-500 to-brand-700' },
    { label: 'Đã thanh toán', value: formatCurrency(data?.paidRevenue || 0), icon: DollarSign, gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700' },
    { label: 'Công nợ còn lại', value: formatCurrency(data?.unpaidRevenue || 0), icon: AlertCircle, gradient: 'bg-gradient-to-br from-red-500 to-red-700' },
    { label: 'Khách hàng mới', value: formatNumber(data?.newCustomers || 0), icon: UserPlus, gradient: 'bg-gradient-to-br from-purple-500 to-purple-700' },
    { label: 'Cơ hội đang xử lý', value: formatNumber(data?.activeOpportunities || 0), icon: Target, gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700' },
    { label: 'Giá trị Pipeline', value: formatCurrency(data?.pipelineValue || 0), icon: Briefcase, gradient: 'bg-gradient-to-br from-brand-400 to-brand-600' },
    { label: 'Báo giá đã gửi', value: formatNumber(data?.quoteSent || 0), icon: FileText, gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700' },
    { label: 'Tỷ lệ chốt đơn', value: `${(data?.closeRate || 0).toFixed(1)}%`, icon: CheckCircle, gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
  ]

  const pipelineData = (data?.pipelineByStage || []).map(item => ({
    ...item,
    stageName: OPPORTUNITY_STAGE_LABELS[item.stage] || item.stage,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Tổng quan</h1>
        <p className="text-surface-500 text-sm mt-1">
          Xin chào, {session?.user?.name}! Đây là tổng quan hoạt động kinh doanh.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`${stat.gradient} rounded-xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-fade-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-orange-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Clock size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{data?.tasksDueToday || 0}</p>
            <p className="text-sm text-surface-500">Task cần làm hôm nay</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{data?.tasksOverdue || 0}</p>
            <p className="text-sm text-surface-500">Task quá hạn</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-brand-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-brand-100 rounded-lg">
            <Phone size={20} className="text-brand-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-600">{data?.customersNeedFollowUp || 0}</p>
            <p className="text-sm text-surface-500">Khách cần chăm sóc lại</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-surface-900 mb-4">Doanh thu theo tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.revenueByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doanh thu" />
              <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} name="Đã thanh toán" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-surface-900 mb-4">Pipeline theo giai đoạn</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="stageName" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Giá trị" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products & Revenue by User */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-surface-900 mb-4">Top sản phẩm bán chạy</h3>
          {(data?.topProducts?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.topProducts}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {data?.topProducts?.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-surface-400">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {session?.user?.role !== 'SALES' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-surface-900 mb-4">Doanh thu theo nhân viên</h3>
            {(data?.revenueByUser?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.revenueByUser}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-surface-400">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

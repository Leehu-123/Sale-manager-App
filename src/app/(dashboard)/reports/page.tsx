'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { formatCurrency, OPPORTUNITY_STAGE_LABELS, CUSTOMER_SOURCE_LABELS } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']

type ReportData = Record<string, unknown> | null

export default function ReportsPage() {
  const { data: session } = useSession()
  const [activeReport, setActiveReport] = useState('revenue')
  const [data, setData] = useState<ReportData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?type=${activeReport}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeReport])

  const reportTabs = [
    { key: 'revenue', label: 'Doanh thu' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'sources', label: 'Nguồn KH' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'receivables', label: 'Công nợ' },
    ...(session?.user?.role !== 'SALES' ? [{ key: 'users', label: 'Nhân viên' }] : []),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b]">Báo cáo & Thống kê</h1>
        <p className="text-gray-500 text-sm mt-1">Phân tích hiệu suất kinh doanh</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {reportTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveReport(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeReport === tab.key ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]"><div className="spinner" /></div>
        ) : !data ? (
          <div className="text-center py-12 text-gray-400">Không có dữ liệu</div>
        ) : (
          <>
            {activeReport === 'revenue' && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
                    <p className="text-sm text-white/70">Tổng doanh thu</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency((data as { total: number }).total || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white">
                    <p className="text-sm text-white/70">Đã thu</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency((data as { totalPaid: number }).totalPaid || 0)}</p>
                  </div>
                </div>
                <h3 className="font-semibold mb-4">Doanh thu theo tháng</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={((data as { data: Array<{ month: string; revenue: number; paid: number }> }).data || [])}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doanh thu" />
                    <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} name="Đã thu" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeReport === 'pipeline' && (
              <div>
                <h3 className="font-semibold mb-4">Phân bổ Pipeline theo giai đoạn</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={((data as { data: Array<{ stage: string; count: number; value: number }> }).data || []).map(d => ({ ...d, stageName: OPPORTUNITY_STAGE_LABELS[d.stage] || d.stage }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="stageName" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Số lượng" />
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={((data as { data: Array<{ stage: string; value: number }> }).data || []).map(d => ({ ...d, name: OPPORTUNITY_STAGE_LABELS[d.stage] }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {((data as { data: unknown[] }).data || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeReport === 'sources' && (
              <div>
                <h3 className="font-semibold mb-4">Nguồn khách hàng</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={((data as { data: Array<{ source: string; count: number }> }).data || []).map(d => ({ ...d, name: CUSTOMER_SOURCE_LABELS[d.source] || d.source }))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={150} label={({ name, count }: { name: string; count: number }) => `${name}: ${count}`}>
                      {((data as { data: unknown[] }).data || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeReport === 'products' && (
              <div>
                <h3 className="font-semibold mb-4">Top 10 sản phẩm bán chạy</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={(data as { data: Array<{ name: string; revenue: number }> }).data || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={200} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeReport === 'receivables' && (
              <div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-700">Tổng công nợ: <span className="font-bold text-lg">{formatCurrency((data as { totalReceivable: number }).totalReceivable || 0)}</span></p>
                </div>
                <table className="w-full data-table">
                  <thead><tr><th>Mã ĐH</th><th>Khách hàng</th><th>Tổng</th><th>Đã TT</th><th>Còn lại</th><th>NV phụ trách</th></tr></thead>
                  <tbody>
                    {((data as { data: Array<{ code: string; customer: string; total: number; paid: number; remaining: number; assignedTo: string }> }).data || []).map((item, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs">{item.code}</td>
                        <td className="font-medium">{item.customer}</td>
                        <td>{formatCurrency(item.total)}</td>
                        <td className="text-green-600">{formatCurrency(item.paid)}</td>
                        <td className="text-red-600 font-semibold">{formatCurrency(item.remaining)}</td>
                        <td>{item.assignedTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeReport === 'users' && (
              <div>
                <h3 className="font-semibold mb-4">Hiệu suất nhân viên</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={(data as { data: Array<{ name: string; revenue: number; newCustomers: number }> }).data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

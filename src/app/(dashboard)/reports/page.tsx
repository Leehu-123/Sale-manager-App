'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useSession } from 'next-auth/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Download } from 'lucide-react'
import { formatCurrency, OPPORTUNITY_STAGE_LABELS, CUSTOMER_SOURCE_LABELS } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']

type ReportData = Record<string, unknown> | null

export default function ReportsPage() {
  const { data: session } = useSession()
  const [activeReport, setActiveReport] = useState('revenue')
  const [data, setData] = useState<ReportData>(null)
  const [loading, setLoading] = useState(true)
  const [userIdFilter, setUserIdFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    let url = '/users?limit=100'
    if (session?.user?.role === 'SALE_LEAD' && session?.user?.teamId) {
      url += `&teamId=${session.user.teamId}`
    }
    apiClient.get(url).then(d => {
      let list = Array.isArray(d) ? d : (d?.data || []);
      list = list.filter((u: any) => {
        if (!u.roles || u.roles.length === 0) return false;
        return u.roles.some((r: string) => {
          const lower = r.toLowerCase();
          return lower.includes('sale') || lower.includes('admin') || lower.includes('manager') || lower.includes('owner') || lower.includes('quản lý');
        });
      });
      setUsers(list);
    }).catch(() => {})
  }, [session])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ type: activeReport })
    if (userIdFilter) params.set('userId', userIdFilter)
    if (monthFilter) {
      const [year, month] = monthFilter.split('-')
      params.set('startDate', `${year}-${month}-01`)
      params.set('endDate', new Date(Number(year), Number(month), 0).toISOString().split('T')[0])
    }
    apiClient.get(`/reports?${params}`)
      .then(data => setData(data?.data || data || {}))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeReport, userIdFilter, monthFilter])

  const reportTabs = [
    { key: 'revenue', label: 'Doanh thu' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'sources', label: 'Nguồn KH' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'receivables', label: 'Công nợ' },
    ...(session?.user?.role !== 'SALES' ? [{ key: 'users', label: 'Nhân viên' }] : []),
  ]

  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = '\uFEFF'; // BOM cho Excel để đọc tiếng Việt
    let filename = `bao-cao.csv`;

    if (activeReport === 'receivables') {
      filename = `bao-cao-cong-no-${new Date().toISOString().split('T')[0]}.csv`;
      csvContent += 'Mã ĐH,Khách hàng,Tổng (VNĐ),Đã thanh toán (VNĐ),Còn lại (VNĐ),Nhân viên phụ trách\n';
      const items = ((data as { data: Array<{ code: string; customer: string; total: number; paid: number; remaining: number; assignedTo: string }> }).data || []);
      items.forEach(item => {
        csvContent += `"${item.code}","${item.customer}","${item.total}","${item.paid}","${item.remaining}","${item.assignedTo}"\n`;
      });
    } else if (activeReport === 'users') {
      filename = `hieu-suat-nhan-vien-${new Date().toISOString().split('T')[0]}.csv`;
      csvContent += 'Nhân viên,Doanh thu (VNĐ),Khách hàng mới\n';
      const items = ((data as { data: Array<{ name: string; revenue: number; newCustomers: number }> }).data || []);
      items.forEach(item => {
        csvContent += `"${item.name}","${item.revenue}","${item.newCustomers}"\n`;
      });
    } else if (activeReport === 'revenue') {
      filename = `doanh-thu-${new Date().toISOString().split('T')[0]}.csv`;
      csvContent += 'Tháng,Doanh thu (VNĐ),Đã thu (VNĐ)\n';
      const items = ((data as { data: Array<{ month: string; revenue: number; paid: number }> }).data || []);
      items.forEach(item => {
        csvContent += `"${item.month}","${item.revenue}","${item.paid}"\n`;
      });
    } else {
      alert('Chưa hỗ trợ xuất Excel cho loại báo cáo này. Vui lòng chọn Công nợ, Nhân viên hoặc Doanh thu.');
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Báo cáo & Thống kê</h1>
          <p className="text-surface-500 text-sm mt-1">Phân tích hiệu suất kinh doanh</p>
        </div>
        <div className="flex gap-3">
          {session?.user?.role !== 'SALES' && (
            <select value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)} className="border border-surface-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]">
              <option value="">Tất cả nhân viên</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName || u.name}</option>)}
            </select>
          )}
          <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="border border-surface-300 rounded-lg px-3 py-2 text-sm bg-white" />
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {reportTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveReport(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeReport === tab.key ? 'bg-brand-700 text-white' : 'bg-white text-surface-600 hover:bg-surface-50 shadow-sm'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]"><div className="spinner" /></div>
        ) : !data ? (
          <div className="text-center py-12 text-surface-400">Không có dữ liệu</div>
        ) : (
          <>
            {activeReport === 'revenue' && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl p-4 text-white">
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
                    <Tooltip formatter={(v: any) => formatCurrency(v as number)} />
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
                      <Pie data={((data as { data: Array<{ stage: string; value: number }> }).data || []).map(d => ({ ...d, name: OPPORTUNITY_STAGE_LABELS[d.stage] }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }: any) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}>
                        {((data as { data: unknown[] }).data || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {((data as any)?.productsData?.length > 0) && (
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4 text-surface-800">Nhu cầu hàng hóa theo cơ hội (Pipeline)</h3>
                    <div className="bg-white rounded-xl overflow-hidden border border-surface-200 shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-50 border-b border-surface-200 text-surface-600">
                          <tr>
                            <th className="py-3 px-4 font-medium whitespace-nowrap">Mã hàng</th>
                            <th className="py-3 px-4 font-medium w-full">Tên sản phẩm</th>
                            <th className="py-3 px-4 font-medium text-right whitespace-nowrap">Tổng SL quan tâm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200">
                          {((data as any).productsData).map((p: any) => (
                            <tr key={p.code} className="hover:bg-surface-50 transition-colors">
                              <td className="py-3 px-4 font-mono font-medium text-brand-600">{p.code}</td>
                              <td className="py-3 px-4">{p.name}</td>
                              <td className="py-3 px-4 text-right font-semibold text-surface-900">{p.quantity.toLocaleString('vi-VN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeReport === 'sources' && (
              <div>
                <h3 className="font-semibold mb-4">Nguồn khách hàng</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={((data as { data: Array<{ source: string; count: number }> }).data || []).map(d => ({ ...d, name: CUSTOMER_SOURCE_LABELS[d.source] || d.source }))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={150} label={({ name, count }: any) => `${name || ''}: ${count || 0}`}>
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
                    <Tooltip formatter={(v: any) => formatCurrency(v as number)} />
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
                    <Tooltip formatter={(v: any) => formatCurrency(v as number)} />
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

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

interface OrderDetail {
  id: string; code: string; status: string; paymentStatus: string; total: number
  paidAmount: number; remainingAmount: number; subtotal: number; discount: number
  vatRate: number; vatAmount: number; projectName?: string; notes?: string
  signedDate?: string; expectedDeliveryDate?: string; createdAt: string
  customer: { name: string; code: string; phone?: string; email?: string }
  assignedTo: { name: string }
  items: Array<{ description: string; quantity: number; unitPrice: number; area?: number; total: number; product?: { name: string } }>
  payments: Array<{ id: string; amount: number; paymentDate: string; method?: string; reference?: string; notes?: string; createdBy: { name: string } }>
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], method: 'transfer', reference: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchOrder = async () => {
    try {
      const data = await fetch(`/api/orders/${params.id}`).then(r => r.json())
      setOrder(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrder() }, [params.id])

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${params.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paymentForm, amount: parseFloat(paymentForm.amount) || 0 }),
      })
      if (res.ok) {
        setShowPaymentModal(false)
        setPaymentForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], method: 'transfer', reference: '', notes: '' })
        fetchOrder()
      }
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchOrder()
    } catch { alert('Có lỗi xảy ra') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  if (!order) return <div className="text-center py-12 text-surface-500">Không tìm thấy đơn hàng</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/orders')} className="p-2 hover:bg-surface-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{order.code}</h1>
              <span className="badge bg-brand-100 text-blue-800">{ORDER_STATUS_LABELS[order.status]}</span>
              <span className={`badge ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
            </div>
            <p className="text-sm text-surface-500">{order.customer.name} · {order.assignedTo.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status === 'NEW' && <button onClick={() => handleStatusChange('IN_PRODUCTION')} className="px-3 py-2 bg-brand-500 text-white rounded-lg text-sm">Bắt đầu SX</button>}
          {order.status === 'IN_PRODUCTION' && <button onClick={() => handleStatusChange('IN_PROGRESS')} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm">Thi công</button>}
          {order.status === 'IN_PROGRESS' && <button onClick={() => handleStatusChange('COMPLETED')} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm">Hoàn thành</button>}
          <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 gradient-blue text-white rounded-lg text-sm font-medium">
            <DollarSign size={16} /> Thêm thanh toán
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-xs text-surface-500">Tổng giá trị</p><p className="text-xl font-bold text-surface-900 mt-1">{formatCurrency(order.total)}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-xs text-surface-500">Đã thanh toán</p><p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(order.paidAmount)}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-xs text-surface-500">Còn lại</p><p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(order.remainingAmount)}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-xs text-surface-500">VAT ({order.vatRate}%)</p><p className="text-xl font-bold text-surface-600 mt-1">{formatCurrency(order.vatAmount)}</p></div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Hạng mục đơn hàng</h3></div>
        <table className="w-full data-table">
          <thead><tr><th>#</th><th>Mô tả</th><th>m²</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="font-medium">{item.product?.name || item.description}</td>
                <td>{item.area || '-'}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td className="font-semibold">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Lịch sử thanh toán</h3></div>
        {order.payments.length > 0 ? (
          <table className="w-full data-table">
            <thead><tr><th>Ngày</th><th>Số tiền</th><th>Phương thức</th><th>Mã GD</th><th>Ghi chú</th><th>Người tạo</th></tr></thead>
            <tbody>
              {order.payments.map(p => (
                <tr key={p.id}>
                  <td>{formatDate(p.paymentDate)}</td>
                  <td className="font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                  <td>{p.method || '-'}</td>
                  <td className="font-mono text-xs">{p.reference || '-'}</td>
                  <td>{p.notes || '-'}</td>
                  <td>{p.createdBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-surface-400">Chưa có thanh toán</div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Thêm thanh toán">
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div className="bg-brand-50 p-3 rounded-lg text-sm text-brand-700">
            Số tiền còn lại: <span className="font-bold">{formatCurrency(order.remainingAmount)}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Số tiền *</label>
            <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Ngày thanh toán *</label>
            <input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Phương thức</label>
            <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
              <option value="transfer">Chuyển khoản</option>
              <option value="cash">Tiền mặt</option>
              <option value="check">Séc</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Mã giao dịch</label>
            <input value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 border border-surface-300 rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 gradient-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Đang lưu...' : 'Thêm'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

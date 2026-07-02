'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Printer } from 'lucide-react'
import { formatCurrency, QUOTE_STATUS_LABELS, PRODUCT_UNIT_LABELS } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface QuoteItem {
  id?: string; productId?: string; description: string; specification?: string
  thickness?: string; length?: number; width?: number; area?: number
  quantity: number; unitPrice: number; discount: number; total: number
}

interface QuoteDetail {
  id: string; code: string; status: string; subtotal: number; vatRate: number
  vatAmount: number; total: number; shippingCost: number; installationCost: number
  terms?: string; notes?: string; expiryDate?: string; createdAt: string
  customer: { id: string; name: string; code: string; phone?: string; email?: string; address?: string }
  createdBy: { name: string }
  items: QuoteItem[]
}

interface Product { id: string; code: string; name: string; unit: string; referencePrice: number }

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [shippingCost, setShippingCost] = useState(0)
  const [installationCost, setInstallationCost] = useState(0)
  const [vatRate, setVatRate] = useState(10)
  const [terms, setTerms] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    Promise.all([
      apiClient.get(`/quotes/${params.id}`),
      apiClient.get('/products?limit=100'),
    ]).then(([quoteRes, productsData]) => {
      const quoteData = quoteRes.data;
      setQuote(quoteData)
      setItems(quoteData.items || [])
      setShippingCost(quoteData.shippingCost || 0)
      setInstallationCost(quoteData.installationCost || 0)
      setVatRate(quoteData.vatRate || 10)
      setTerms(quoteData.terms || '')
      setNotes(quoteData.notes || '')
      setProducts(productsData.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [params.id])

  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: value }

    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value)
      if (product) {
        item.description = product.name
        item.unitPrice = product.referencePrice
      }
    }

    if (field === 'length' || field === 'width') {
      const l = field === 'length' ? (value as number) : item.length || 0
      const w = field === 'width' ? (value as number) : item.width || 0
      if (l && w) item.area = Math.round(l * w * 100) / 100
    }

    const baseAmount = (item.area || item.quantity) * item.unitPrice
    item.total = Math.round(baseAmount - (baseAmount * item.discount / 100))

    updated[index] = item
    setItems(updated)
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0) + shippingCost + installationCost
  const vatAmount = Math.round(subtotal * vatRate / 100)
  const grandTotal = subtotal + vatAmount

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await apiClient.put(`/quotes/${params.id}`, {
        customerId: quote?.customer.id,
        shippingCost, installationCost, vatRate, terms, notes,
        items: items.map((item, i) => ({ ...item, sortOrder: i })),
      })
      setQuote({ ...quote!, ...updated.data })
      alert('Đã lưu báo giá')
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiClient.put(`/quotes/${params.id}`, { status: newStatus, customerId: quote?.customer.id, items })
      setQuote(q => q ? { ...q, status: newStatus } : null)
    } catch { alert('Có lỗi xảy ra') }
  }

  const handleCreateOrder = async () => {
    if (!confirm('Bạn có chắc muốn tạo đơn hàng từ báo giá này?')) return
    setSaving(true)
    try {
      const order = await apiClient.post('/orders', {
        quoteId: quote?.id,
        customerId: quote?.customer.id,
        discount: 0,
      })
      router.push(`/orders/${order.data.id}`)
    } catch (err: any) { alert(err.message || 'Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  if (!quote) return <div className="text-center py-12 text-surface-500">Không tìm thấy báo giá</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/quotes')} className="p-2 hover:bg-surface-100 rounded-lg print:hidden"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-surface-900">{quote.code}</h1>
              <span className={`badge ${quote.status === 'APPROVED' ? 'bg-green-100 text-green-800' : quote.status === 'DRAFT' ? 'bg-surface-100 text-surface-800' : 'bg-brand-100 text-blue-800'}`}>
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
            </div>
            <p className="text-sm text-surface-500">Khách hàng: {quote.customer.name} · Tạo bởi: {quote.createdBy.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {quote.status === 'DRAFT' && <button onClick={() => handleStatusChange('SENT')} className="px-3 py-2 bg-brand-500 text-white rounded-lg text-sm">Gửi khách</button>}
          {quote.status === 'SENT' && <button onClick={() => handleStatusChange('APPROVED')} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm">Duyệt</button>}
          {quote.status === 'APPROVED' && <button onClick={handleCreateOrder} disabled={saving} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm disabled:opacity-50">Tạo đơn hàng</button>}
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50 print:hidden">
            <Printer size={16} /> In báo giá
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 btn-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 print:hidden">
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-surface-500">Khách hàng:</span> <span className="font-medium">{quote.customer.name}</span></div>
          <div><span className="text-surface-500">Mã KH:</span> <span className="font-mono">{quote.customer.code}</span></div>
          {quote.customer.phone && <div><span className="text-surface-500">SĐT:</span> {quote.customer.phone}</div>}
          {quote.customer.email && <div><span className="text-surface-500">Email:</span> {quote.customer.email}</div>}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Hạng mục báo giá</h3>
          <button onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-sm hover:bg-brand-100">
            <Plus size={14} /> Thêm dòng
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-surface-500 w-8">#</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500">Sản phẩm</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500">Mô tả</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500 w-20">Dày</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500 w-20">Dài</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500 w-20">Rộng</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500 w-20">m²</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500 w-16">SL</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500 w-28">Đơn giá</th>
                <th className="p-3 text-left text-xs font-medium text-surface-500 w-16">CK%</th>
                <th className="p-3 text-right text-xs font-medium text-surface-500 w-32">Thành tiền</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t hover:bg-surface-50">
                  <td className="p-2 text-center text-surface-400">{index + 1}</td>
                  <td className="p-2">
                    <select value={item.productId || ''} onChange={e => updateItem(index, 'productId', e.target.value)} className="w-full border rounded px-2 py-1 text-xs print:hidden">
                      <option value="">Chọn SP</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="hidden print:block text-xs">{products.find(p => p.id === item.productId)?.name || ''}</div>
                  </td>
                  <td className="p-2">
                    <input value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="w-full border rounded px-2 py-1 text-xs print:hidden" />
                    <div className="hidden print:block text-xs whitespace-pre-wrap">{item.description}</div>
                  </td>
                  <td className="p-2"><input value={item.thickness || ''} onChange={e => updateItem(index, 'thickness', e.target.value)} className="w-full border rounded px-2 py-1 text-xs" placeholder="mm" /></td>
                  <td className="p-2"><input type="number" value={item.length || ''} onChange={e => updateItem(index, 'length', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" step="0.01" /></td>
                  <td className="p-2"><input type="number" value={item.width || ''} onChange={e => updateItem(index, 'width', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" step="0.01" /></td>
                  <td className="p-2"><input type="number" value={item.area || ''} onChange={e => updateItem(index, 'area', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs bg-surface-50" step="0.01" /></td>
                  <td className="p-2"><input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="w-full border rounded px-2 py-1 text-xs" min="1" /></td>
                  <td className="p-2"><input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" /></td>
                  <td className="p-2"><input type="number" value={item.discount} onChange={e => updateItem(index, 'discount', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" min="0" max="100" /></td>
                  <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                  <td className="p-2"><button onClick={() => removeItem(index)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-4 border-t bg-surface-50">
          <div className="max-w-sm ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tổng hạng mục:</span>
              <span className="font-medium">{formatCurrency(items.reduce((s, i) => s + i.total, 0))}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span>Vận chuyển:</span>
              <input type="number" value={shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} className="w-32 border rounded px-2 py-1 text-xs text-right" />
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span>Thi công/lắp đặt:</span>
              <input type="number" value={installationCost} onChange={e => setInstallationCost(parseFloat(e.target.value) || 0)} className="w-32 border rounded px-2 py-1 text-xs text-right" />
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Tổng trước VAT:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span>VAT (%):</span>
              <input type="number" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)} className="w-16 border rounded px-2 py-1 text-xs text-right" min="0" max="100" />
              <span>{formatCurrency(vatAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2 text-surface-900">
              <span>TỔNG CỘNG:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-surface-700 mb-2">Điều khoản báo giá</label>
          <textarea value={terms} onChange={e => setTerms(e.target.value)} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm print:hidden" rows={4} placeholder="Nhập điều khoản..." />
          <div className="hidden print:block text-sm whitespace-pre-wrap">{terms}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-surface-700 mb-2">Ghi chú</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm print:hidden" rows={4} placeholder="Ghi chú thêm..." />
          <div className="hidden print:block text-sm whitespace-pre-wrap">{notes}</div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Product { id: string; name: string; referencePrice: number }
interface Customer { id: string; name: string; code: string }
interface QuoteItem {
  productId?: string; description: string; specification?: string; thickness?: string
  length?: number; width?: number; area?: number; quantity: number
  unitPrice: number; discount: number; total: number
}

export default function CreateQuotePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [shippingCost, setShippingCost] = useState(0)
  const [installationCost, setInstallationCost] = useState(0)
  const [vatRate, setVatRate] = useState(10)
  const [terms, setTerms] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }])

  useEffect(() => {
    Promise.all([
      fetch('/api/customers?limit=200').then(r => r.json()),
      fetch('/api/products?limit=100').then(r => r.json()),
    ]).then(([c, p]) => {
      setCustomers(c.data || [])
      setProducts(p.data || [])
    })
  }, [])

  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: value }
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value)
      if (product) { item.description = product.name; item.unitPrice = product.referencePrice }
    }
    if (field === 'length' || field === 'width') {
      const l = field === 'length' ? (value as number) : item.length || 0
      const w = field === 'width' ? (value as number) : item.width || 0
      if (l && w) item.area = Math.round(l * w * 100) / 100
    }
    const base = (item.area || item.quantity) * item.unitPrice
    item.total = Math.round(base - (base * item.discount / 100))
    updated[index] = item
    setItems(updated)
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0) + shippingCost + installationCost
  const vatAmount = Math.round(subtotal * vatRate / 100)
  const grandTotal = subtotal + vatAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) { alert('Vui lòng chọn khách hàng'); return }
    if (!items.some(i => i.description)) { alert('Vui lòng thêm ít nhất 1 hạng mục'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, shippingCost, installationCost, vatRate, terms, notes, items }),
      })
      if (res.ok) {
        const quote = await res.json()
        router.push(`/quotes/${quote.id}`)
      } else { const err = await res.json(); alert(err.error || 'Có lỗi xảy ra') }
    } catch { alert('Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/quotes')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-[#1e293b]">Tạo báo giá mới</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng *</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Chọn khách hàng</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Hạng mục báo giá</h3>
            <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }])} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm">
              <Plus size={14} /> Thêm dòng
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 w-8">#</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500">Sản phẩm</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500">Mô tả</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 w-20">Dài</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 w-20">Rộng</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 w-20">m²</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 w-16">SL</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 w-28">Đơn giá</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 w-16">CK%</th>
                  <th className="p-3 text-right text-xs font-medium text-gray-500 w-32">Thành tiền</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 text-center text-gray-400">{i + 1}</td>
                    <td className="p-2"><select value={item.productId || ''} onChange={e => updateItem(i, 'productId', e.target.value)} className="w-full border rounded px-2 py-1 text-xs"><option value="">Chọn SP</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                    <td className="p-2"><input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="w-full border rounded px-2 py-1 text-xs" /></td>
                    <td className="p-2"><input type="number" value={item.length || ''} onChange={e => updateItem(i, 'length', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" step="0.01" /></td>
                    <td className="p-2"><input type="number" value={item.width || ''} onChange={e => updateItem(i, 'width', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" step="0.01" /></td>
                    <td className="p-2"><input type="number" value={item.area || ''} onChange={e => updateItem(i, 'area', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs bg-gray-50" readOnly={!!(item.length && item.width)} /></td>
                    <td className="p-2"><input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-full border rounded px-2 py-1 text-xs" min="1" /></td>
                    <td className="p-2"><input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" /></td>
                    <td className="p-2"><input type="number" value={item.discount} onChange={e => updateItem(i, 'discount', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" min="0" max="100" /></td>
                    <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                    <td className="p-2">{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={14} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-gray-50">
            <div className="max-w-sm ml-auto space-y-2 text-sm">
              <div className="flex justify-between"><span>Tổng hạng mục:</span><span className="font-medium">{formatCurrency(items.reduce((s, i) => s + i.total, 0))}</span></div>
              <div className="flex justify-between items-center"><span>Vận chuyển:</span><input type="number" value={shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} className="w-32 border rounded px-2 py-1 text-xs text-right" /></div>
              <div className="flex justify-between items-center"><span>Thi công:</span><input type="number" value={installationCost} onChange={e => setInstallationCost(parseFloat(e.target.value) || 0)} className="w-32 border rounded px-2 py-1 text-xs text-right" /></div>
              <div className="flex justify-between border-t pt-2"><span>Trước VAT:</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between items-center"><span>VAT:</span><input type="number" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)} className="w-16 border rounded px-2 py-1 text-xs text-right" /><span>% = {formatCurrency(vatAmount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2 text-[#1e3a5f]"><span>TỔNG:</span><span>{formatCurrency(grandTotal)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.push('/quotes')} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm">Hủy</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 gradient-blue text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Đang tạo...' : 'Tạo báo giá'}
          </button>
        </div>
      </form>
    </div>
  )
}

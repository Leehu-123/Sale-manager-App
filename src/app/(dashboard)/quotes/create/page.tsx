'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface Product { id: string; name: string; code?: string; salePrice: number }
interface Customer { id: string; name: string; code: string }
interface QuoteItem {
  productId?: string; description: string; unit?: string; specification?: string; thickness?: string
  width?: number; length?: number; area?: number; discount?: number;
  quantity: number; unitPrice: number; total: number
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
  const [discount, setDiscount] = useState(0)
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', thickness: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }])
  const [discountRate, setDiscountRate] = useState(0)

  useEffect(() => {
    const extractArray = (res: any) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res.data && Array.isArray(res.data)) return res.data;
      if (res.items && Array.isArray(res.items)) return res.items;
      if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
      if (res.data && res.data.items && Array.isArray(res.data.items)) return res.data.items;
      return [];
    };

    Promise.all([
      apiClient.get('/customers?page=1&limit=100'),
      apiClient.get('/products?page=1&limit=100'),
    ]).then(([c, p]) => {
      setCustomers(extractArray(c));
      setProducts(extractArray(p));
    }).catch(err => {
      console.error('Fetch error:', err);
    })
  }, [])

  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: value }
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value)
      if (product) { item.description = product.name; item.unitPrice = product.salePrice }
    }
    
    const w = item.width || 0
    const l = item.length || 0
    const q = item.quantity || 0
    
    const area = (w * l * q) / 1000000
    item.area = area > 0 ? Math.round(area * 1000) / 1000 : 0
    
    const up = item.unitPrice || 0
    const d = item.discount || 0
    
    const baseQuantity = item.area > 0 ? item.area : q;
    item.total = Math.round(baseQuantity * (up - d))
    
    updated[index] = item
    setItems(updated)
  }

  const itemsTotal = items.reduce((s, i) => s + i.total, 0)
  const totalArea = items.reduce((s, i) => s + (i.area || 0), 0)
  const subtotalBeforeDiscount = itemsTotal + shippingCost + installationCost
  
  // Chiết khấu có thể nhập % hoặc số tiền. Để đơn giản, cho phép nhập trực tiếp số tiền, và hiển thị tỷ lệ %.
  const discountAmount = discount
  const subtotal = subtotalBeforeDiscount - discountAmount
  const vatAmount = Math.round(subtotal * vatRate / 100)
  const grandTotal = subtotal + vatAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) { alert('Vui lòng chọn khách hàng'); return }
    if (!items.some(i => i.description)) { alert('Vui lòng thêm ít nhất 1 hạng mục'); return }
    
    // Clean up to avoid forbidNonWhitelisted validation error
    const cleanedItems = items.map(item => {
      const { productId, total, ...rest } = item;
      const cleanItem: any = { ...rest };
      if (productId) cleanItem.productId = productId;
      
      // Aggressively clean up empty strings and zeros for optional fields
      if (cleanItem.thickness === "") delete cleanItem.thickness;
      if (cleanItem.unit === "") delete cleanItem.unit;
      if (cleanItem.specification === "") delete cleanItem.specification;
      if (!cleanItem.length) delete cleanItem.length;
      if (!cleanItem.width) delete cleanItem.width;
      if (!cleanItem.area) delete cleanItem.area;
      if (!cleanItem.discount) delete cleanItem.discount;
      
      return cleanItem;
    });

    const payload: any = { customerId, items: cleanedItems };
    if (shippingCost) payload.shippingCost = shippingCost;
    if (installationCost) payload.installationCost = installationCost;
    if (discount) payload.discount = discount;
    if (vatRate !== undefined) payload.vatRate = vatRate;
    if (terms) payload.terms = terms;
    if (notes) payload.notes = notes;

    setSaving(true)
    try {
      const quote = await apiClient.post('/quotes', payload)
      router.push(`/quotes/${quote.data.id}`)
    } catch (err: any) { 
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/quotes')} className="p-2 hover:bg-surface-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-surface-900">Tạo báo giá mới</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Khách hàng *</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Chọn khách hàng</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Hạng mục báo giá</h3>
            <button type="button" onClick={() => setItems([...items, { description: '', thickness: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }])} className="flex items-center gap-1 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-sm">
              <Plus size={14} /> Thêm dòng
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-surface-50">
                <tr>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 w-8">#</th>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 min-w-[150px]">Sản phẩm</th>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 w-20">Độ dày</th>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 w-20">Rộng(mm)</th>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 w-20">Dài(mm)</th>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 w-16">SL(Tấm)</th>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 w-20">Tổng m2</th>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 w-24">Đơn giá</th>
                  <th className="p-2 text-left text-xs font-medium text-surface-500 w-24">CK/m2</th>
                  <th className="p-2 text-right text-xs font-medium text-surface-500 w-28">Thành tiền</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 text-center text-surface-400">{i + 1}</td>
                    <td className="p-2">
                      <select value={item.productId || ''} onChange={e => updateItem(i, 'productId', e.target.value)} className="w-full border rounded px-2 py-1 text-xs mb-1">
                        <option value="">Chọn SP</option>{products.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} - ${p.name}` : p.name}</option>)}
                      </select>
                      <input placeholder="Ghi chú SP" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="w-full border rounded px-2 py-1 text-xs" />
                    </td>
                    <td className="p-2"><input placeholder="VD: 6.38" value={item.thickness || ''} onChange={e => updateItem(i, 'thickness', e.target.value)} className="w-full border rounded px-2 py-1 text-xs" /></td>
                    <td className="p-2"><input type="number" placeholder="Rộng" value={item.width || ''} onChange={e => updateItem(i, 'width', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" /></td>
                    <td className="p-2"><input type="number" placeholder="Dài" value={item.length || ''} onChange={e => updateItem(i, 'length', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" /></td>
                    <td className="p-2"><input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-full border rounded px-2 py-1 text-xs" min="1" /></td>
                    <td className="p-2"><input type="number" value={item.area || ''} disabled className="w-full border rounded px-2 py-1 text-xs bg-surface-50" /></td>
                    <td className="p-2"><input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs" /></td>
                    <td className="p-2"><input type="number" value={item.discount || ''} onChange={e => updateItem(i, 'discount', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-xs text-red-600" placeholder="CK" /></td>
                    <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                    <td className="p-2">{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={14} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-surface-50">
            <div className="max-w-md ml-auto space-y-2 text-sm">
              {totalArea > 0 && <div className="flex justify-between text-surface-500"><span>Tổng diện tích:</span><span>{totalArea.toFixed(3)} m2</span></div>}
              <div className="flex justify-between"><span>Tổng hạng mục:</span><span className="font-medium">{formatCurrency(itemsTotal)}</span></div>
              <div className="flex justify-between items-center"><span>Vận chuyển:</span><input type="number" value={shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} className="w-32 border rounded px-2 py-1 text-xs text-right" /></div>
              <div className="flex justify-between items-center"><span>Thi công:</span><input type="number" value={installationCost} onChange={e => setInstallationCost(parseFloat(e.target.value) || 0)} className="w-32 border rounded px-2 py-1 text-xs text-right" /></div>
              <div className="flex justify-between items-center text-red-600">
                <span className="flex items-center gap-2">Chiết khấu tổng: 
                  <input type="number" placeholder="%" value={discountRate || ''} onChange={e => { const rate = parseFloat(e.target.value) || 0; setDiscountRate(rate); setDiscount(Math.round(subtotalBeforeDiscount * rate / 100)) }} className="w-16 border rounded px-2 py-1 text-xs text-right" /> %
                </span>
                <input type="number" value={discount} onChange={e => { setDiscount(parseFloat(e.target.value) || 0); setDiscountRate(0) }} className="w-32 border rounded px-2 py-1 text-xs text-right text-red-600" />
              </div>
              <div className="flex justify-between border-t pt-2"><span>Trước VAT:</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between items-center"><span>VAT:</span><input type="number" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)} className="w-16 border rounded px-2 py-1 text-xs text-right" /><span>% = {formatCurrency(vatAmount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2 text-surface-900"><span>TỔNG:</span><span>{formatCurrency(grandTotal)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.push('/quotes')} className="px-6 py-2.5 border border-surface-300 rounded-lg text-sm">Hủy</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 btn-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Đang tạo...' : 'Tạo báo giá'}
          </button>
        </div>
      </form>
    </div>
  )
}

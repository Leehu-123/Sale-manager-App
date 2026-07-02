'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Plus, Search, Package } from 'lucide-react'
import { formatCurrency, PRODUCT_GROUP_LABELS, PRODUCT_UNIT_LABELS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

interface Product {
  id: string; code: string; name: string; group: string; unit: string
  referencePrice: number; description?: string; isActive: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', group: 'TEMPERED_GLASS', unit: 'SQM', referencePrice: '', description: '' })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (search) params.set('search', search)
    if (groupFilter) params.set('group', groupFilter)
    try {
      const data = await apiClient.get(`/products?${params}`)
      setProducts(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [search, groupFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const url = editId ? `/products/${editId}` : '/products'
    try {
      const payload = { 
        name: form.name,
        sku: form.code || `SKU-${Date.now()}`,
        code: form.code,
        glassType: form.group,
        unit: form.unit,
        salePrice: parseFloat(form.referencePrice) || 0,
        costPrice: 0,
        description: form.description
      };
      const res = editId 
        ? await apiClient.put(url, payload)
        : await apiClient.post(url, payload);
      
      setShowModal(false)
      setEditId(null)
      setForm({ code: '', name: '', group: 'TEMPERED_GLASS', unit: 'SQM', referencePrice: '', description: '' })
      fetchProducts()
    } catch (err: any) { 
      alert(err.message || 'Có lỗi xảy ra') 
    }
    finally { setSaving(false) }
  }

  const handleEdit = (product: Product) => {
    setEditId(product.id)
    setForm({ code: product.code, name: product.name, group: product.group, unit: product.unit, referencePrice: String(product.referencePrice), description: product.description || '' })
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Sản phẩm & Dịch vụ</h1>
          <p className="text-surface-500 text-sm mt-1">Quản lý danh mục sản phẩm kính xây dựng</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ code: '', name: '', group: 'TEMPERED_GLASS', unit: 'SQM', referencePrice: '', description: '' }); setShowModal(true) }} className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm" />
        </div>
        <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="border border-surface-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả nhóm</option>
          {Object.entries(PRODUCT_GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-surface-400">
            <Package size={48} className="mx-auto mb-3 text-surface-300" />
            <p>Chưa có sản phẩm</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} onClick={() => handleEdit(product)} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-surface-100 hover:border-brand-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="badge bg-indigo-100 text-indigo-800">{PRODUCT_GROUP_LABELS[product.group]}</span>
                  <h3 className="font-semibold text-surface-900 mt-2">{product.name}</h3>
                  <p className="text-xs text-surface-400 mt-1">{product.code}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-green-400' : 'bg-surface-300'}`} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('Bạn có chắc muốn xóa sản phẩm này?')) apiClient.delete(`/products/${product.id}`).then(fetchProducts) }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-bold text-surface-900">{formatCurrency(product.referencePrice)}</span>
                <span className="text-xs text-surface-500">/ {PRODUCT_UNIT_LABELS[product.unit]}</span>
              </div>
              {product.description && <p className="text-xs text-surface-500 mt-2 line-clamp-2">{product.description}</p>}
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Mã sản phẩm *</label>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Nhóm SP *</label>
              <select value={form.group} onChange={e => setForm({...form, group: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(PRODUCT_GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Tên sản phẩm *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Đơn vị tính</label>
              <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(PRODUCT_UNIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Đơn giá tham khảo</label>
              <input value={form.referencePrice} onChange={e => setForm({...form, referencePrice: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" type="number" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-surface-300 rounded-lg text-sm font-medium hover:bg-surface-50">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 btn-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

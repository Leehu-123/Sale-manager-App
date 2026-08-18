'use client';

import { useState } from 'react';
import styles from './CPQForm.module.css';

export default function CPQForm({ projectId, onCalculated }) {
  const [formData, setFormData] = useState({
    width: '',
    height: '',
    quantity: 1,
    glassType: 'TEMPERED_8MM',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isOddSize = (formData.width && formData.width % 2 !== 0) || (formData.height && formData.height % 2 !== 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/specifications/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            width: Number(formData.width),
            height: Number(formData.height),
            quantity: Number(formData.quantity),
            glassType: formData.glassType,
            projectId 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tính toán');
      
      setResult(data);
      if (onCalculated) onCalculated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Báo giá nhanh (CPQ)</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.group}>
            <label>Rộng (mm)</label>
            <input type="number" name="width" value={formData.width} onChange={handleChange} required min="100" />
          </div>
          <div className={styles.group}>
            <label>Cao (mm)</label>
            <input type="number" name="height" value={formData.height} onChange={handleChange} required min="100" />
          </div>
        </div>
        
        {isOddSize && (
          <div className={styles.warning}>
            ⚠️ Cảnh báo: Kích thước lẻ. Có thể phát sinh phụ phí hao hụt.
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.group}>
            <label>Số lượng</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" />
          </div>
          <div className={styles.group}>
            <label>Loại kính</label>
            <select name="glassType" value={formData.glassType} onChange={handleChange}>
              <option value="TEMPERED_8MM">Kính cường lực 8mm</option>
              <option value="TEMPERED_10MM">Kính cường lực 10mm</option>
              <option value="TEMPERED_12MM">Kính cường lực 12mm</option>
              <option value="LAMINATED_8_38MM">Kính dán an toàn 8.38mm</option>
            </select>
          </div>
        </div>
        
        <button type="submit" disabled={loading} className={styles.btn}>
          {loading ? 'Đang tính...' : 'Tính giá'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.result}>
          <h4>Kết quả dự kiến:</h4>
          <p>Diện tích: {result.area} m²</p>
          <p>Đơn giá: {result.unitPrice?.toLocaleString('vi-VN')} đ/m²</p>
          <p>Thành tiền: <strong>{result.totalPrice?.toLocaleString('vi-VN')} đ</strong></p>
        </div>
      )}
    </div>
  );
}

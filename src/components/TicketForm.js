'use client';

import { useState } from 'react';
import styles from './TicketForm.module.css';

export default function TicketForm({ projectId, onSuccess }) {
  const [formData, setFormData] = useState({
    issueType: 'BROKEN_GLASS',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, projectId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo sự cố');
      
      setFormData({ issueType: 'BROKEN_GLASS', description: '' });
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h4 className={styles.title}>Báo cáo sự cố</h4>
      <div className={styles.group}>
        <label>Loại sự cố</label>
        <select name="issueType" value={formData.issueType} onChange={handleChange}>
          <option value="BROKEN_GLASS">Kính vỡ</option>
          <option value="WRONG_SIZE">Sai kích thước</option>
          <option value="SCRATCHED">Trầy xước</option>
          <option value="DELIVERY_DELAY">Giao hàng trễ</option>
          <option value="OTHER">Khác</option>
        </select>
      </div>
      <div className={styles.group}>
        <label>Mô tả chi tiết</label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange}
          rows="3"
          required
          placeholder="Mô tả sự cố cần xử lý..."
        ></textarea>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <button type="submit" disabled={loading} className={styles.btn}>
        {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
      </button>
    </form>
  );
}

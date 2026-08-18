'use client';

import DashboardLayout from '@/components/DashboardLayout';
import CreditAlert from '@/components/CreditAlert';

const mockCustomers = [
  { id: '1', name: 'Công ty ABC', currentDebt: 50000000, creditLimit: 100000000 },
  { id: '2', name: 'Tập đoàn XYZ', currentDebt: 150000000, creditLimit: 100000000 },
];

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Danh sách Khách hàng</h2>
        <button style={{ padding: '10px 16px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          + Thêm khách hàng
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {mockCustomers.map(c => (
          <CreditAlert key={c.id} customer={c} />
        ))}
      </div>

      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '12px' }}>Khách hàng</th>
              <th style={{ padding: '12px' }}>Công nợ hiện tại</th>
              <th style={{ padding: '12px' }}>Hạn mức</th>
              <th style={{ padding: '12px' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {mockCustomers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px' }}>{c.name}</td>
                <td style={{ padding: '12px', color: c.currentDebt > c.creditLimit ? 'var(--accent-red-light)' : 'inherit' }}>
                  {c.currentDebt.toLocaleString('vi-VN')} đ
                </td>
                <td style={{ padding: '12px' }}>{c.creditLimit.toLocaleString('vi-VN')} đ</td>
                <td style={{ padding: '12px' }}>
                  {c.currentDebt > c.creditLimit 
                    ? <span style={{ color: 'var(--accent-red-light)', fontSize: '12px', padding: '4px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>Vượt hạn mức</span> 
                    : <span style={{ color: '#34d399', fontSize: '12px', padding: '4px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: '4px' }}>Bình thường</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

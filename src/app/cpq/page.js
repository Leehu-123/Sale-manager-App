'use client';

import DashboardLayout from '@/components/DashboardLayout';
import CPQForm from '@/components/CPQForm';

export default function CPQPage() {
  return (
    <DashboardLayout>
      <h2>Công cụ Báo giá nhanh (CPQ)</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Tính toán nhanh diện tích và chi phí kính cường lực, kính dán.
      </p>
      
      <div style={{ maxWidth: '600px' }}>
        <CPQForm />
      </div>
    </DashboardLayout>
  );
}

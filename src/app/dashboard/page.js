import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';

// Dummy data for now
const stats = [
  { label: 'Diện tích đã bán', value: '1,250', unit: 'm²', trend: '+15%', isPositive: true },
  { label: 'Doanh thu tháng', value: '450.5M', unit: 'VNĐ', trend: '+5%', isPositive: true },
  { label: 'Sự cố phát sinh', value: '3', unit: 'vụ', trend: '-2', isPositive: true },
  { label: 'Tỉ lệ chốt deal', value: '68', unit: '%', trend: '+2%', isPositive: true },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h2>Tổng quan kinh doanh</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {stats.map((stat, idx) => (
          <StatsCard 
            key={idx}
            title={stat.label}
            value={`${stat.value} ${stat.unit}`}
            trend={stat.trend}
            isPositive={stat.isPositive}
          />
        ))}
      </div>
      
      <div style={{ marginTop: '40px', padding: '20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
        <h3>Biểu đồ doanh thu & m2 kính (Sắp tới)</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Khu vực hiển thị biểu đồ phân tích hiệu suất.</p>
      </div>
    </DashboardLayout>
  );
}

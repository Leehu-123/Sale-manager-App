'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CPQForm from '@/components/CPQForm';
import SpecificationTable from '@/components/SpecificationTable';
import TicketList from '@/components/TicketList';

const mockProject = {
  id: '1',
  name: 'Vách kính văn phòng A',
  stage: 'QUOTING',
  customer: { name: 'Công ty ABC' },
  specifications: [
    { id: 's1', glassType: 'TEMPERED_10MM', width: 1000, height: 2000, quantity: 2, area: 4, unitPrice: 350000, totalPrice: 1400000 }
  ],
  tickets: []
};

export default function ProjectDetailPage({ params }) {
  const [project, setProject] = useState(mockProject);

  const handleCalculated = (newSpec) => {
    // Thêm spec vào list
    setProject(prev => ({
      ...prev,
      specifications: [...prev.specifications, { id: Date.now().toString(), ...newSpec }]
    }));
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '20px' }}>
        <h2>{project.name}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Khách hàng: {project.customer.name} | Giai đoạn: {project.stage}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ marginBottom: '20px' }}>
            <CPQForm projectId={project.id} onCalculated={handleCalculated} />
          </div>
          <div style={{ background: 'var(--glass-bg)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
            <h3>Sự cố dự án</h3>
            <TicketList tickets={project.tickets} />
          </div>
        </div>

        <div>
          <SpecificationTable specifications={project.specifications} />
        </div>
      </div>
    </DashboardLayout>
  );
}

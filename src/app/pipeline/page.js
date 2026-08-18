'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import KanbanBoard from '@/components/KanbanBoard';

const mockProjects = [
  { id: '1', name: 'Vách kính văn phòng A', stage: 'NEW', estimatedValue: 15000000, customer: { name: 'Công ty ABC' } },
  { id: '2', name: 'Cửa kính cường lực', stage: 'SURVEYING', estimatedValue: 8500000, customer: { name: 'Anh Nam' } },
  { id: '3', name: 'Lan can kính dự án B', stage: 'QUOTING', estimatedValue: 120000000, customer: { name: 'Tập đoàn XYZ' } },
  { id: '4', name: 'Mái kính giếng trời', stage: 'NEGOTIATING', estimatedValue: 45000000, customer: { name: 'Chị Mai' } },
];

export default function PipelinePage() {
  const [projects, setProjects] = useState(mockProjects);

  const handleProjectMove = (projectId, newStage) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, stage: newStage } : p));
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Pipeline Dự án</h2>
        <button style={{ padding: '10px 16px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          + Thêm dự án mới
        </button>
      </div>
      
      <KanbanBoard projects={projects} onProjectMove={handleProjectMove} />
    </DashboardLayout>
  );
}

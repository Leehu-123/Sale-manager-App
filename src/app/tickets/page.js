'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TicketList from '@/components/TicketList';
import TicketForm from '@/components/TicketForm';

const mockTickets = [
  { id: 't1', issueType: 'BROKEN_GLASS', description: 'Kính vỡ góc khi vận chuyển', status: 'OPEN', createdAt: new Date().toISOString(), project: { name: 'Vách kính văn phòng A' } },
  { id: 't2', issueType: 'WRONG_SIZE', description: 'Sai kích thước 5mm chiều cao', status: 'IN_PROGRESS', createdAt: new Date().toISOString(), project: { name: 'Mái kính giếng trời' } },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState(mockTickets);
  const [showForm, setShowForm] = useState(false);

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Quản lý Sự cố</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 16px', background: showForm ? 'var(--glass-bg)' : 'var(--accent-red-light)', color: showForm ? 'var(--text-primary)' : '#000', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
        >
          {showForm ? 'Đóng' : '+ Báo sự cố'}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '20px', maxWidth: '600px' }}>
          <TicketForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      <TicketList tickets={tickets} onStatusChange={handleStatusChange} />
    </DashboardLayout>
  );
}

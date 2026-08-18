import styles from './TicketList.module.css';

export default function TicketList({ tickets, onStatusChange }) {
  if (!tickets || tickets.length === 0) {
    return <div className={styles.empty}>Chưa có sự cố nào.</div>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN': return <span className={`${styles.badge} ${styles.badgeOpen}`}>Mới</span>;
      case 'IN_PROGRESS': return <span className={`${styles.badge} ${styles.badgeInProgress}`}>Đang xử lý</span>;
      case 'RESOLVED': return <span className={`${styles.badge} ${styles.badgeResolved}`}>Đã giải quyết</span>;
      case 'CLOSED': return <span className={`${styles.badge} ${styles.badgeClosed}`}>Đóng</span>;
      default: return <span className={styles.badge}>{status}</span>;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'BROKEN_GLASS': return 'Kính vỡ';
      case 'WRONG_SIZE': return 'Sai kích thước';
      case 'SCRATCHED': return 'Trầy xước';
      case 'DELIVERY_DELAY': return 'Giao hàng trễ';
      default: return type;
    }
  };

  return (
    <div className={styles.list}>
      {tickets.map((ticket) => (
        <div key={ticket.id} className={styles.card}>
          <div className={styles.header}>
            <h4 className={styles.title}>
              #{ticket.id.slice(-4).toUpperCase()} - {getTypeLabel(ticket.issueType)}
            </h4>
            {getStatusBadge(ticket.status)}
          </div>
          <p className={styles.desc}>{ticket.description}</p>
          <div className={styles.meta}>
            <span className={styles.date}>
              {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
            </span>
            {ticket.projectId && (
              <span className={styles.project}>Dự án: {ticket.project?.name || 'Liên kết'}</span>
            )}
          </div>
          {onStatusChange && ticket.status !== 'CLOSED' && (
            <div className={styles.actions}>
              <select 
                className={styles.statusSelect}
                value={ticket.status} 
                onChange={(e) => onStatusChange(ticket.id, e.target.value)}
              >
                <option value="OPEN">Mới</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="CLOSED">Đóng</option>
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import Link from 'next/link';
import styles from './ProjectCard.module.css';

export default function ProjectCard({ project, onClick }) {
  if (!project) return null;

  const totalArea = project.specifications?.reduce((sum, spec) => sum + (spec.area || 0), 0) || 0;
  
  const content = (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <h4 className={styles.name}>{project.name}</h4>
        <span className={styles.stage}>{project.stage}</span>
      </div>
      <div className={styles.customer}>
        Khách hàng: {project.customer?.name || 'Chưa gắn'}
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.icon}>📏</span>
          <span>{totalArea.toFixed(2)} m²</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.icon}>💰</span>
          <span>{(project.estimatedValue || 0).toLocaleString('vi-VN')} đ</span>
        </div>
      </div>
      {project.tickets?.length > 0 && (
        <div className={styles.warning}>
          ⚠️ Có {project.tickets.length} sự cố
        </div>
      )}
    </div>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link href={`/projects/${project.id}`} className={styles.link}>
      {content}
    </Link>
  );
}

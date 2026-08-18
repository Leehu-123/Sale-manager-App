'use client';

/* StatsCard - Thẻ hiển thị thống kê */
import styles from './StatsCard.module.css';

/* Ánh xạ accent sang class CSS */
const accentClassMap = {
  green: { card: styles.accentGreen, icon: styles.iconGreen },
  blue: { card: styles.accentBlue, icon: styles.iconBlue },
  purple: { card: styles.accentPurple, icon: styles.iconPurple },
  orange: { card: styles.accentOrange, icon: styles.iconOrange },
  red: { card: styles.accentRed, icon: styles.iconRed },
};

export default function StatsCard({
  icon,
  label,
  value,
  trend,       // { value: '+12%', direction: 'up' | 'down' }
  accent = 'blue',
  loading = false,
  delay = 0,   // Animation delay (giây)
}) {
  const accentClasses = accentClassMap[accent] || accentClassMap.blue;

  /* Trạng thái loading */
  if (loading) {
    return (
      <div className={`${styles.card} ${accentClasses.card}`}>
        <div className={styles.cardHeader}>
          <div className={`${styles.skeleton} ${styles.iconWrapper}`} style={{ width: 44, height: 44 }} />
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonLabel}`} />
        <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.card} ${accentClasses.card}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={styles.cardHeader}>
        <div className={`${styles.iconWrapper} ${accentClasses.icon}`}>
          {icon}
        </div>
        {trend && (
          <span
            className={`${styles.trend} ${
              trend.direction === 'up' ? styles.trendUp : styles.trendDown
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
    </div>
  );
}

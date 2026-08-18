'use client';

/* KPIProgressBar - Thanh tiến trình KPI */
import styles from './KPIProgressBar.module.css';

/* Định dạng tiền VND */
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/* Xác định màu dựa trên phần trăm */
function getColorClass(percent) {
  if (percent >= 100) return { fill: styles.fillGreen, text: styles.percentGreen };
  if (percent >= 80) return { fill: styles.fillBlue, text: styles.percentBlue };
  if (percent >= 50) return { fill: styles.fillOrange, text: styles.percentOrange };
  return { fill: styles.fillRed, text: styles.percentRed };
}

export default function KPIProgressBar({
  title = 'KPI Doanh thu',
  target = 0,
  achieved = 0,
  delay = 0,
}) {
  /* Tính phần trăm hoàn thành */
  const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;
  const displayPercent = Math.min(percentage, 100);
  const colorClass = getColorClass(percentage);

  return (
    <div className={styles.wrapper} style={{ animationDelay: `${delay}s` }}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.percentage} ${colorClass.text}`}>
          {percentage}%
        </span>
      </div>

      {/* Thanh tiến trình */}
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${colorClass.fill}`}
          style={{ width: `${displayPercent}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tiến trình KPI: ${percentage}%`}
        />
      </div>

      {/* Chi tiết số liệu */}
      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Đã đạt</span>
          <span className={styles.detailValue}>{formatVND(achieved)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Mục tiêu</span>
          <span className={styles.detailValue}>{formatVND(target)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Còn thiếu</span>
          <span className={styles.detailValue}>
            {achieved >= target ? '🎉 Vượt mục tiêu!' : formatVND(target - achieved)}
          </span>
        </div>
      </div>
    </div>
  );
}

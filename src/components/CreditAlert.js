import styles from './CreditAlert.module.css';

export default function CreditAlert({ customer }) {
  if (!customer) return null;

  const debt = customer.currentDebt || 0;
  const limit = customer.creditLimit || 0;
  
  if (debt <= limit && limit > 0) return null; // All good or no limit check if needed
  // Let's say we only alert if debt >= limit
  if (debt < limit || limit === 0) return null;

  return (
    <div className={styles.alert}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <h4 className={styles.title}>Cảnh báo hạn mức công nợ!</h4>
        <p className={styles.desc}>
          Khách hàng <strong>{customer.name}</strong> đã vượt hạn mức công nợ. 
          <br/>
          Nợ hiện tại: {debt.toLocaleString('vi-VN')} đ / Hạn mức: {limit.toLocaleString('vi-VN')} đ.
          <br/>
          Không thể chốt đơn hàng mới cho đến khi thanh toán.
        </p>
      </div>
    </div>
  );
}

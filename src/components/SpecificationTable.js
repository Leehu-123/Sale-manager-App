import styles from './SpecificationTable.module.css';

export default function SpecificationTable({ specifications }) {
  if (!specifications || specifications.length === 0) {
    return <div className={styles.empty}>Chưa có thông số kỹ thuật kính.</div>;
  }

  const formatCurrency = (value) => value?.toLocaleString('vi-VN') + ' đ';

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Bảng thông số kỹ thuật</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Loại kính</th>
              <th>Kích thước (R x C)</th>
              <th>Số lượng</th>
              <th>Diện tích (m²)</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {specifications.map((spec) => (
              <tr key={spec.id}>
                <td>{spec.glassType === 'TEMPERED_8MM' ? 'KCL 8mm' : spec.glassType === 'TEMPERED_10MM' ? 'KCL 10mm' : spec.glassType === 'TEMPERED_12MM' ? 'KCL 12mm' : spec.glassType}</td>
                <td>{spec.width} x {spec.height} mm</td>
                <td>{spec.quantity}</td>
                <td>{spec.area}</td>
                <td>{formatCurrency(spec.unitPrice)}</td>
                <td>{formatCurrency(spec.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" className={styles.totalLabel}>Tổng cộng:</td>
              <td className={styles.totalValue}>
                {formatCurrency(specifications.reduce((sum, spec) => sum + (spec.totalPrice || 0), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

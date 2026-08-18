'use client';

/* Sidebar - Thanh điều hướng chính */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { icon: '📊', label: 'Tổng quan', href: '/dashboard' },
  { icon: '📋', label: 'Pipeline', href: '/pipeline' },
  { icon: '👥', label: 'Khách hàng', href: '/customers', excludeRole: 'TECH' },
  { icon: '📄', label: 'Báo giá', href: '/cpq', excludeRole: 'TECH' },
  { icon: '⚠️', label: 'Sự cố', href: '/tickets' },
  { icon: '⚙️', label: 'Cài đặt', href: '/settings' },
];

/* Mục menu dành cho Admin/Manager */
const ADMIN_NAV_ITEMS = [
  { icon: '🔗', label: 'Webhook', href: '/webhooks' },
];

/* Lấy chữ cái đầu cho avatar */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* Lấy class cho badge vai trò */
function getRoleClass(role) {
  switch (role) {
    case 'ADMIN': return styles.roleAdmin;
    case 'MANAGER': return styles.roleManager;
    case 'TECH': return styles.roleTech;
    default: return styles.roleSale;
  }
}

/* Nhãn vai trò tiếng Việt */
function getRoleLabel(role) {
  switch (role) {
    case 'ADMIN': return 'Quản trị viên';
    case 'MANAGER': return 'Quản lý';
    case 'TECH': return 'Kỹ thuật viên';
    default: return 'Nhân viên Sale';
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  /* Xử lý đăng xuất */
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  /* Kiểm tra trang đang active */
  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Nút mở menu mobile */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Mở menu điều hướng"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Lớp phủ khi mở menu mobile */}
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.visible : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar chính */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
        {/* Logo & Thương hiệu */}
        <div className={styles.brand} style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Company Logo" style={{ maxWidth: '180px', maxHeight: '50px', objectFit: 'contain' }} />
        </div>

        {/* Menu điều hướng */}
        <nav className={styles.nav}>
          <div className={styles.navSection}>Chính</div>
          {NAV_ITEMS.filter(item => item.excludeRole !== user?.role).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}

          {/* Mục dành cho Admin/Manager */}
          {isAdminOrManager && (
            <>
              <div className={styles.navSection}>Quản trị</div>
              {ADMIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Thông tin người dùng */}
        <div className={styles.userSection}>
          {user && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {getInitials(user.name)}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user.name || 'Người dùng'}</span>
                <span className={`${styles.userRole} ${getRoleClass(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          )}

          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            aria-label="Đăng xuất khỏi hệ thống"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}

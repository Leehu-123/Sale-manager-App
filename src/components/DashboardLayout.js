'use client';

/* DashboardLayout - Bọc các trang đã xác thực với Sidebar */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import Sidebar from './Sidebar';
import { ToastProvider } from './Toast';
import styles from './DashboardLayout.module.css';

/* Component bên trong sử dụng session */
function DashboardInner({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  /* Chuyển hướng nếu chưa đăng nhập */
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  /* Đang tải session */
  if (status === 'loading') {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Đang tải...</p>
      </div>
    );
  }

  /* Chưa xác thực */
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}

/* Wrapper chính với SessionProvider và ToastProvider */
export default function DashboardLayout({ children }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <div className={styles.layoutWrapper}>
          <DashboardInner>{children}</DashboardInner>
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}

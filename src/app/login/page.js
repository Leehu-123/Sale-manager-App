'use client';

/* Trang đăng nhập - Xác thực người dùng */
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* Xử lý đăng nhập */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      {/* Nền gradient động */}
      <div className={styles.animatedBg} />
      <div className={`${styles.particle} ${styles.particle1}`} />
      <div className={`${styles.particle} ${styles.particle2}`} />
      <div className={`${styles.particle} ${styles.particle3}`} />

      {/* Thẻ đăng nhập */}
      <div className={styles.loginCard}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <img src="/logo.png" alt="Company Logo" style={{ maxWidth: '200px', margin: '0 auto 1rem', display: 'block', objectFit: 'contain' }} />
          <h1 className={styles.logoTitle}>Sales Manager</h1>
          <p className={styles.logoSubtitle}>Hệ thống Quản lý Kinh doanh</p>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className={styles.errorMessage}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form đăng nhập */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="email">
              Email
            </label>
            <span className={styles.inputIcon}>📧</span>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="Nhập địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-label="Địa chỉ email"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="password">
              Mật khẩu
            </label>
            <span className={styles.inputIcon}>🔒</span>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-label="Mật khẩu"
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <div className={styles.btnSpinner} />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

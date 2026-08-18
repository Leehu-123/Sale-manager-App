'use client';

/* Component Toast - Thông báo nổi cho người dùng */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

/* Hook sử dụng toast */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng trong ToastProvider');
  }
  return context;
}

/* Provider bọc ứng dụng */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /* Thêm toast mới */
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    /* Tự động xóa sau thời gian */
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  /* Các phương thức tiện ích */
  const toast = useCallback({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  }, [addToast]);

  /* Xóa toast thủ công */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* Icon cho từng loại toast */
  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, toast, removeToast }}>
      {children}
      {/* Container hiển thị toast */}
      <div className="toast-container" role="alert" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => removeToast(t.id)}
            role="button"
            tabIndex={0}
            aria-label={`Đóng thông báo: ${t.message}`}
          >
            <span>{getIcon(t.type)}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

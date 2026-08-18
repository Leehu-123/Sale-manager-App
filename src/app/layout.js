/* Root Layout - Bố cục gốc của ứng dụng */
import './globals.css';

export const metadata = {
  title: 'Quản lý Phòng Kinh doanh',
  description: 'Hệ thống quản lý bán hàng chuyên nghiệp - Theo dõi pipeline, KPI, và hoạt động kinh doanh',
  keywords: ['quản lý bán hàng', 'CRM', 'pipeline', 'KPI'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

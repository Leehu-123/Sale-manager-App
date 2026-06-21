# Dafa Sales - Hệ thống Quản lý Phòng Kinh Doanh

![Dafa Sales](https://img.shields.io/badge/Dafa-Sales%20Management-1e3a5f?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)

Ứng dụng web quản lý phòng kinh doanh cho thương hiệu **Dafa** - chuyên kinh doanh kính xây dựng.

## ✨ Tính năng chính

- 🔐 **Đăng nhập & Phân quyền** - Admin, Trưởng phòng, Nhân viên Sales
- 👥 **Quản lý Khách hàng (CRM)** - Thông tin, lịch sử chăm sóc, chống trùng
- 📊 **Pipeline bán hàng** - Kanban drag-drop, theo dõi cơ hội
- 📋 **Báo giá** - Tạo báo giá chi tiết, tự tính toán, xuất PDF
- 🛒 **Đơn hàng & Hợp đồng** - Theo dõi thi công, công nợ, thanh toán
- ✅ **Quản lý công việc** - Task, lịch chăm sóc, cảnh báo quá hạn
- 📈 **Dashboard & Báo cáo** - KPI, doanh thu, biểu đồ trực quan
- 👤 **Quản lý nhân viên** - Team, KPI, hiệu suất
- ⚙️ **Cài đặt hệ thống** - Cấu hình sản phẩm, pipeline, mặc định

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | Next.js 15, React, TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | NextAuth.js (JWT) |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| PDF | @react-pdf/renderer |
| Icons | Lucide React |
| Validation | Zod |

## 🚀 Hướng dẫn chạy Local

### Yêu cầu

- **Node.js** >= 18 (LTS)
- **Docker** & **Docker Compose** (cho PostgreSQL)
- **npm** >= 9

### Bước 1: Clone & cài đặt dependencies

```bash
cd dafa-sales
npm install
```

### Bước 2: Cấu hình môi trường

```bash
# Copy file env mẫu
cp .env.example .env
```

Chỉnh sửa file `.env` nếu cần:

```env
DATABASE_URL="postgresql://dafa_user:dafa_password_2024@localhost:5432/dafa_sales?schema=public"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
```

### Bước 3: Khởi động PostgreSQL

```bash
docker compose up -d
```

Kiểm tra PostgreSQL đã sẵn sàng:

```bash
docker compose ps
```

### Bước 4: Chạy migration database

```bash
npx prisma migrate dev --name init
```

### Bước 5: Seed dữ liệu mẫu

```bash
npx prisma db seed
```

### Bước 6: Khởi động ứng dụng

```bash
npm run dev
```

Truy cập: **http://localhost:3002**

### Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| Admin | admin@dafa.vn | 123456 |
| Trưởng phòng | manager@dafa.vn | 123456 |
| Nhân viên Sales | sales1@dafa.vn | 123456 |
| Nhân viên Sales | sales2@dafa.vn | 123456 |
| Nhân viên Sales | sales3@dafa.vn | 123456 |

## 📁 Cấu trúc dự án

```
dafa-sales/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Dữ liệu mẫu
│   └── migrations/            # Migration files
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Dashboard pages
│   │   │   ├── page.tsx       # Tổng quan
│   │   │   ├── customers/     # Khách hàng
│   │   │   ├── pipeline/      # Pipeline
│   │   │   ├── products/      # Sản phẩm
│   │   │   ├── quotes/        # Báo giá
│   │   │   ├── orders/        # Đơn hàng
│   │   │   ├── tasks/         # Công việc
│   │   │   ├── users/         # Nhân viên
│   │   │   ├── reports/       # Báo cáo
│   │   │   └── settings/      # Cài đặt
│   │   ├── api/               # API routes
│   │   ├── login/             # Trang đăng nhập
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── layout/            # Sidebar, Topbar
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # Auth helpers
│   │   ├── authorization.ts   # Phân quyền
│   │   ├── utils.ts           # Utilities
│   │   └── validations.ts     # Zod schemas
│   └── hooks/                 # Custom hooks
├── docker-compose.yml         # PostgreSQL local
├── docker-compose.prod.yml    # Production Docker
├── .env.example               # Env template
├── DEPLOY_VPS.md              # Hướng dẫn deploy
└── README.md                  # Tài liệu này
```

## 🔧 Các lệnh hữu ích

```bash
# Chạy dev server
npm run dev

# Build production
npm run build

# Start production
npm start

# Prisma Studio (xem database)
npx prisma studio

# Tạo migration mới
npx prisma migrate dev --name <migration_name>

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## 🔒 Phân quyền

| Chức năng | Admin | Trưởng phòng | Sales |
|-----------|:-----:|:------------:|:-----:|
| Dashboard toàn bộ | ✅ | ✅ | ❌ (chỉ cá nhân) |
| Quản lý user | ✅ | 🔶 (xem) | ❌ |
| Quản lý khách hàng (toàn bộ) | ✅ | ✅ | ❌ (chỉ của mình) |
| Tạo khách hàng | ✅ | ✅ | ✅ |
| Pipeline (toàn bộ) | ✅ | ✅ | ❌ (chỉ của mình) |
| Tạo/sửa báo giá | ✅ | ✅ | ✅ (của mình) |
| Quản lý đơn hàng | ✅ | ✅ | ✅ (của mình) |
| Cài đặt hệ thống | ✅ | ❌ | ❌ |
| Báo cáo toàn bộ | ✅ | ✅ | ❌ (chỉ cá nhân) |
| Giao task | ✅ | ✅ | ❌ (chỉ tự tạo) |

## 📖 Tài liệu khác

- [Hướng dẫn Deploy VPS](./DEPLOY_VPS.md) - Deploy lên Ubuntu + Nginx + PM2

## 📝 License

Private - © 2024 Dafa. All rights reserved.

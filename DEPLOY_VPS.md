# Hướng dẫn Deploy Dafa Sales lên VPS Ubuntu

Hướng dẫn chi tiết deploy ứng dụng Dafa Sales lên VPS Ubuntu để nhiều nhân viên cùng truy cập.

## Yêu cầu VPS

- **OS**: Ubuntu 22.04 LTS hoặc mới hơn
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB)
- **CPU**: 2 vCPU trở lên
- **Disk**: 20GB SSD trở lên
- **Domain**: Đã trỏ DNS về IP VPS (ví dụ: sales.dafa.vn)

## Phương pháp 1: Deploy bằng PM2 + Nginx

### Bước 1: Cập nhật hệ thống

```bash
sudo apt update && sudo apt upgrade -y
```

### Bước 2: Cài đặt Node.js LTS

```bash
# Cài Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra version
node -v
npm -v
```

### Bước 3: Cài đặt PostgreSQL

```bash
# Cài PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Khởi động PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Tạo user và database
sudo -u postgres psql

# Trong psql shell:
CREATE USER dafa_user WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE dafa_sales OWNER dafa_user;
GRANT ALL PRIVILEGES ON DATABASE dafa_sales TO dafa_user;
\q
```

### Bước 4: Cài đặt Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Bước 5: Cài đặt PM2

```bash
sudo npm install -g pm2
```

### Bước 6: Clone và cấu hình ứng dụng

```bash
# Tạo thư mục app
sudo mkdir -p /var/www/dafa-sales
sudo chown $USER:$USER /var/www/dafa-sales

# Copy source code lên VPS (hoặc git clone)
# Cách 1: scp từ máy local
# scp -r ./dafa-sales/* user@your-vps-ip:/var/www/dafa-sales/

# Cách 2: git clone (nếu đã push lên git)
# cd /var/www
# git clone <your-repo-url> dafa-sales

cd /var/www/dafa-sales

# Cài dependencies
npm install --production

# Cấu hình environment
cp .env.example .env
nano .env
```

Nội dung file `.env` cho production:

```env
# Database
DATABASE_URL="postgresql://dafa_user:your_strong_password_here@localhost:5432/dafa_sales?schema=public"

# NextAuth
NEXTAUTH_URL="https://sales.dafa.vn"
NEXTAUTH_SECRET="your-very-long-random-secret-at-least-32-characters-long"

# App
NEXT_PUBLIC_APP_NAME="Dafa Sales"
NEXT_PUBLIC_APP_URL="https://sales.dafa.vn"
```

Tạo NEXTAUTH_SECRET ngẫu nhiên:

```bash
openssl rand -base64 32
```

### Bước 7: Chạy migration và seed

```bash
# Chạy migration
npx prisma migrate deploy

# Seed dữ liệu (chỉ lần đầu)
npx prisma db seed
```

### Bước 8: Build ứng dụng

```bash
npm run build
```

### Bước 9: Khởi động với PM2

```bash
# Start app
pm2 start npm --name "dafa-sales" -- start -- -p 3002

# Lưu cấu hình PM2
pm2 save

# Auto start khi reboot
pm2 startup
# Chạy lệnh mà PM2 suggest
```

Kiểm tra app đang chạy:

```bash
pm2 status
pm2 logs dafa-sales
```

### Bước 10: Cấu hình Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/dafa-sales
```

Nội dung file:

```nginx
server {
    listen 80;
    server_name sales.dafa.vn;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sales.dafa.vn;

    # SSL certificates (sẽ được Certbot tạo)
    ssl_certificate /etc/letsencrypt/live/sales.dafa.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sales.dafa.vn/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/dafa-sales-access.log;
    error_log /var/log/nginx/dafa-sales-error.log;

    # Max upload size
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3002;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /static {
        proxy_pass http://localhost:3002;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Kích hoạt site:

```bash
sudo ln -s /etc/nginx/sites-available/dafa-sales /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 11: Cài SSL với Certbot (Let's Encrypt)

```bash
# Cài Certbot
sudo apt install -y certbot python3-certbot-nginx

# Lấy SSL certificate
sudo certbot --nginx -d sales.dafa.vn

# Tạm thời dùng Nginx config không SSL trước khi chạy certbot:
# Comment các dòng ssl_certificate ở bước 10
# Chạy certbot, nó sẽ tự cấu hình SSL vào Nginx
```

Auto renew SSL:

```bash
# Certbot tự thêm cron job, kiểm tra:
sudo certbot renew --dry-run
```

### Bước 12: Cấu hình Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Phương pháp 2: Deploy bằng Docker Compose

### Bước 1: Cài Docker

```bash
# Cài Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Cài Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Log out và log in lại
```

### Bước 2: Chuẩn bị files

Copy source code lên VPS và cấu hình `.env`:

```bash
cd /var/www/dafa-sales
cp .env.example .env
nano .env
```

### Bước 3: Chạy Docker Compose Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Bước 4: Chạy migration và seed

```bash
# Chạy migration
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Seed data (lần đầu)
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### Bước 5: Cấu hình Nginx

Cài Nginx trên host (không dùng Docker Nginx) và cấu hình giống Phương pháp 1, Bước 10.

---

## 🔄 Cập nhật ứng dụng

### Với PM2:

```bash
cd /var/www/dafa-sales

# Pull code mới (nếu dùng git)
git pull origin main

# Cài dependencies mới
npm install --production

# Chạy migration
npx prisma migrate deploy

# Build lại
npm run build

# Restart app
pm2 restart dafa-sales
```

### Với Docker:

```bash
cd /var/www/dafa-sales
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

---

## 💾 Backup Database

### Backup thủ công

```bash
# Backup
pg_dump -U dafa_user -h localhost dafa_sales > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql -U dafa_user -h localhost dafa_sales < backup_20240101_120000.sql
```

### Backup tự động (Cron job)

```bash
# Tạo thư mục backup
sudo mkdir -p /var/backups/dafa-sales

# Tạo script backup
sudo nano /usr/local/bin/backup-dafa.sh
```

Nội dung script:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/dafa-sales"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="dafa_sales_${TIMESTAMP}.sql.gz"

# Backup và nén
pg_dump -U dafa_user -h localhost dafa_sales | gzip > "${BACKUP_DIR}/${FILENAME}"

# Xóa backup cũ hơn 30 ngày
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${FILENAME}"
```

```bash
sudo chmod +x /usr/local/bin/backup-dafa.sh

# Thêm cron job (backup lúc 2h sáng mỗi ngày)
crontab -e
# Thêm dòng:
0 2 * * * /usr/local/bin/backup-dafa.sh >> /var/log/dafa-backup.log 2>&1
```

---

## 🔍 Monitoring & Troubleshooting

### Xem logs

```bash
# PM2 logs
pm2 logs dafa-sales
pm2 logs dafa-sales --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/dafa-sales-access.log
sudo tail -f /var/log/nginx/dafa-sales-error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Kiểm tra trạng thái

```bash
# App status
pm2 status

# Nginx status
sudo systemctl status nginx

# PostgreSQL status
sudo systemctl status postgresql

# Disk usage
df -h

# Memory usage
free -h

# CPU/Process
htop
```

### Restart services

```bash
pm2 restart dafa-sales
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

---

## 🔒 Bảo mật bổ sung

1. **Đổi port SSH**: Sửa `/etc/ssh/sshd_config`, đổi port 22 sang port khác
2. **Fail2ban**: Chống brute force SSH

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

3. **Giới hạn truy cập PostgreSQL**: Sửa `pg_hba.conf` chỉ cho phép localhost

4. **Cập nhật hệ thống định kỳ**:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 📝 Checklist Deploy

- [ ] VPS đã cài Ubuntu 22.04+
- [ ] DNS domain đã trỏ về IP VPS
- [ ] Node.js 20 LTS đã cài
- [ ] PostgreSQL đã cài và tạo database
- [ ] Nginx đã cài
- [ ] PM2 đã cài (hoặc Docker)
- [ ] Source code đã upload
- [ ] File .env đã cấu hình production
- [ ] Migration đã chạy
- [ ] Seed data đã chạy (lần đầu)
- [ ] App đã build thành công
- [ ] PM2 đã khởi động app
- [ ] Nginx reverse proxy đã cấu hình
- [ ] SSL certificate đã cài (Certbot)
- [ ] Firewall đã cấu hình (UFW)
- [ ] Backup database đã setup cron
- [ ] Test truy cập từ trình duyệt
- [ ] Test đăng nhập với tài khoản demo

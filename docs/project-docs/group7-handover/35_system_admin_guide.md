---
title: "System Administration Guide"
document_id: "35"
version: "1.0"
date: "2026-05-22"
author: "DevOps Team - Diecast360"
status: "Final"
---

# Hướng Dẫn Quản Trị Hệ Thống — Diecast360

## Mục Lục

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Yêu Cầu Máy Chủ](#2-yêu-cầu-máy-chủ)
3. [Quản Lý Process với PM2](#3-quản-lý-process-với-pm2)
4. [Vận Hành Database](#4-vận-hành-database)
5. [Quản Lý Storage](#5-quản-lý-storage)
6. [Cloudflared Tunnel](#6-cloudflared-tunnel)
7. [Bảo Mật và Xoay Vòng Secrets](#7-bảo-mật-và-xoay-vòng-secrets)
8. [Quản Lý Log](#8-quản-lý-log)
9. [Monitoring và Alerting](#9-monitoring-và-alerting)
10. [Các Tác Vụ Admin Thường Gặp](#10-các-tác-vụ-admin-thường-gặp)
11. [Xử Lý Sự Cố](#11-xử-lý-sự-cố)

---

## 1. Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────┐
│                   INTERNET                          │
└──────────────────┬──────────────────────────────────┘
                   │
          ┌────────▼────────┐
          │ Cloudflare CDN  │
          │  (Pages + R2)   │
          └────────┬────────┘
                   │ HTTPS
          ┌────────▼────────┐
          │  Cloudflared    │
          │    Tunnel       │
          └────────┬────────┘
                   │ HTTP
          ┌────────▼────────┐
          │   NestJS API    │  ← PM2 managed
          │   Port 3000     │
          └────────┬────────┘
                   │ TLS (DIRECT_URL)
          ┌────────▼────────┐
          │  Neon PostgreSQL│
          │  (Cloud DB)     │
          └─────────────────┘
```

### Các thành phần chính

| Thành phần | Công nghệ | Vị trí | Quản lý bởi |
|-----------|----------|--------|------------|
| Backend API | NestJS 11 + Node.js 20 | Server (Raspberry Pi / VPS) | PM2 |
| Frontend | React 19 + Vite (static) | Cloudflare Pages | Cloudflare |
| Database | PostgreSQL 16 | Neon (cloud) | Neon Console |
| File Storage | Cloudflare R2 / Local | Cloud / Server | Cloudflare / Disk |
| Tunnel | Cloudflared | Server | systemd |

---

## 2. Yêu Cầu Máy Chủ

### Phần cứng tối thiểu (Production)

| Tài nguyên | Tối thiểu | Khuyến nghị |
|-----------|----------|------------|
| CPU | 2 cores (ARM64 OK) | 4 cores |
| RAM | 1 GB | 2 GB |
| Disk (OS + App) | 20 GB | 40 GB |
| Disk (Uploads) | 10 GB | 50 GB (nếu dùng local storage) |
| Network | 10 Mbps | 100 Mbps |

> **Lưu ý Raspberry Pi**: Dùng Pi 4 (4 GB RAM) hoặc Pi 5. Đặt `--max-old-space-size=512` cho Node.js.

### Phần mềm yêu cầu

```bash
# Kiểm tra phiên bản
node --version      # >= 20.x LTS
pnpm --version      # >= 9.x
pm2 --version       # >= 5.x
psql --version      # >= 15 (client)
cloudflared --version
```

### Cài đặt môi trường (Ubuntu/Debian)

```bash
# 1. Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. pnpm
npm install -g pnpm@9

# 3. PM2
npm install -g pm2

# 4. PostgreSQL client (chỉ client, không cần server)
sudo apt-get install -y postgresql-client-15

# 5. cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb  # ARM64; dùng amd64 cho x86_64
```

---

## 3. Quản Lý Process với PM2

### Cấu hình PM2 (ecosystem.config.js)

File này nằm tại `/home/pi/diecast360/backend/ecosystem.config.js` (hoặc thư mục deploy tương đương):

```javascript
module.exports = {
  apps: [
    {
      name: 'diecast360-api',
      script: 'dist/main.js',
      cwd: '/home/pi/diecast360/backend',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=512',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Tự động restart khi dùng quá 450 MB RAM
      max_memory_restart: '450M',
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/diecast360-api-error.log',
      out_file: '/var/log/pm2/diecast360-api-out.log',
      merge_logs: true,
      // Restart policy
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '30s',
    },
  ],
};
```

### Lệnh PM2 thường dùng

```bash
# Khởi động từ ecosystem config
pm2 start ecosystem.config.js

# Start / Stop / Restart
pm2 start diecast360-api
pm2 stop diecast360-api
pm2 restart diecast360-api

# Reload không downtime (graceful reload)
pm2 reload diecast360-api

# Xem trạng thái
pm2 status
pm2 show diecast360-api

# Xem log realtime
pm2 logs diecast360-api
pm2 logs diecast360-api --lines 100   # 100 dòng gần nhất
pm2 logs diecast360-api --err          # chỉ error log

# Monitor tương tác (CPU, RAM, logs)
pm2 monit

# Lưu danh sách process (để tự khởi động sau reboot)
pm2 save

# Đăng ký PM2 tự chạy khi boot
pm2 startup systemd
# Chạy lệnh mà PM2 in ra sau đó
```

### Quy trình deploy cập nhật

```bash
# 1. Pull code mới
cd /home/pi/diecast360
git pull origin main

# 2. Cài dependencies
cd backend
pnpm install --frozen-lockfile

# 3. Build
pnpm build

# 4. Chạy migration (nếu có)
pnpm prisma migrate deploy

# 5. Reload (không downtime)
pm2 reload diecast360-api

# 6. Kiểm tra
curl http://localhost:3000/api/v1/health
```

---

## 4. Vận Hành Database

### Kết nối Neon DB

```bash
# Lấy connection string từ .env trên server
grep DATABASE_URL /home/pi/diecast360/backend/.env

# Kết nối bằng psql
psql "postgresql://user:password@ep-xxx.neon.tech/diecast360?sslmode=require"

# Hoặc dùng DIRECT_URL (bypass Neon pooler, dùng cho migrations)
psql "$DIRECT_URL"
```

### Quản lý Migration

```bash
cd /home/pi/diecast360/backend

# Kiểm tra trạng thái migration
pnpm prisma migrate status

# Áp dụng migration mới (chỉ dùng trong deploy pipeline)
pnpm prisma migrate deploy

# KHÔNG BAO GIỜ dùng lệnh sau trong production:
# pnpm prisma migrate reset    ← XÓA TOÀN BỘ DỮ LIỆU
# pnpm prisma migrate dev      ← CHỈ DÙNG CHO DEV
```

> **QUY TẮC VÀNG**: Không bao giờ chỉnh sửa file migration đã được apply (`_prisma_migrations` table). Nếu cần thay đổi schema, tạo migration MỚI.

### Backup Database

#### Backup thủ công

```bash
# Backup toàn bộ database
pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --file="/backup/diecast360_$(date +%Y%m%d_%H%M%S).dump"

# Backup chỉ schema (không có data)
pg_dump \
  --dbname="$DATABASE_URL" \
  --schema-only \
  --file="/backup/schema_$(date +%Y%m%d).sql"

# Backup chỉ data
pg_dump \
  --dbname="$DATABASE_URL" \
  --data-only \
  --file="/backup/data_$(date +%Y%m%d).sql"
```

#### Backup tự động (crontab)

```bash
# Chỉnh crontab
crontab -e

# Thêm dòng sau (backup lúc 2:00 AM hàng ngày)
0 2 * * * /home/pi/scripts/backup_db.sh >> /var/log/backup.log 2>&1
```

Nội dung `/home/pi/scripts/backup_db.sh`:

```bash
#!/bin/bash
set -e
source /home/pi/diecast360/backend/.env
BACKUP_DIR="/backup/db"
mkdir -p "$BACKUP_DIR"
FILENAME="$BACKUP_DIR/diecast360_$(date +%Y%m%d_%H%M%S).dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --file="$FILENAME"
echo "[$(date)] Backup thành công: $FILENAME ($(du -sh $FILENAME | cut -f1))"

# Xóa backup cũ hơn 30 ngày
find "$BACKUP_DIR" -name "*.dump" -mtime +30 -delete
echo "[$(date)] Đã dọn backup cũ hơn 30 ngày"
```

#### Khôi phục từ backup

```bash
# Khôi phục toàn bộ database (CẨN THẬN: ghi đè dữ liệu hiện tại)
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  /backup/diecast360_20260101_020000.dump

# Kiểm tra sau khôi phục
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM items;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM members;"
```

---

## 5. Quản Lý Storage

### Local Storage

Khi `STORAGE_DRIVER=local`, file được lưu tại `UPLOAD_DIR` (thường là `/home/pi/diecast360/uploads`).

**Cấu trúc thư mục:**

```
uploads/
├── items/
│   ├── {shop_id}/
│   │   ├── {item_id}/
│   │   │   ├── cover.webp
│   │   │   ├── gallery_0.webp
│   │   │   └── gallery_1.webp
├── spinsets/
│   └── {shop_id}/
│       └── {spin_set_id}/
│           ├── frame_0.webp
│           ├── frame_1.webp
│           └── ...
└── shops/
    └── {shop_id}/
        └── logo.webp
```

**Backup uploads:**

```bash
# Sync sang ổ cứng ngoài / remote
rsync -avz --progress \
  /home/pi/diecast360/uploads/ \
  /mnt/backup/uploads/

# Hoặc nén và lưu
tar -czf /backup/uploads_$(date +%Y%m%d).tar.gz \
  -C /home/pi/diecast360 uploads/
```

**Kiểm tra dung lượng:**

```bash
du -sh /home/pi/diecast360/uploads/
du -sh /home/pi/diecast360/uploads/*/  # theo folder con
df -h /home/pi/diecast360/uploads/
```

### Cloudflare R2 Storage

Khi `STORAGE_DRIVER=r2`, file lưu trên Cloudflare R2.

**Kiểm tra R2:**
1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vào **R2 Object Storage** → chọn bucket `diecast360-prod`
3. Xem usage, browse objects, check metrics

**Xoay vòng R2 Access Key:**

```bash
# 1. Tạo API Token mới trên Cloudflare Dashboard
#    (R2 → Manage R2 API Tokens → Create API Token)

# 2. Cập nhật .env trên server
nano /home/pi/diecast360/backend/.env
# Sửa:
# R2_ACCESS_KEY_ID=<new_key>
# R2_SECRET_ACCESS_KEY=<new_secret>

# 3. Reload PM2
pm2 reload diecast360-api

# 4. Xóa key cũ trên Cloudflare Dashboard
```

**Signed URL (MEDIA_SIGNING_SECRET):**

Media URL được ký bằng HMAC. Để xoay vòng secret:

```bash
# 1. Sinh secret mới
openssl rand -hex 32

# 2. Cập nhật .env
MEDIA_SIGNING_SECRET=<new_secret>

# 3. Reload PM2 (URL cũ sẽ hết hạn ngay lập tức)
pm2 reload diecast360-api

# LƯU Ý: URL ảnh đang cached trên client sẽ hết hạn.
# Người dùng cần refresh trang.
```

---

## 6. Cloudflared Tunnel

### Cài đặt và Cấu hình

```bash
# 1. Đăng nhập Cloudflare
cloudflared tunnel login

# 2. Tạo tunnel (chỉ làm 1 lần)
cloudflared tunnel create diecast360-api

# 3. Tạo file cấu hình
mkdir -p /home/pi/.cloudflared
cat > /home/pi/.cloudflared/config.yml << 'EOF'
tunnel: <TUNNEL_ID>
credentials-file: /home/pi/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api.diecast360.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# 4. Trỏ DNS CNAME về tunnel
cloudflared tunnel route dns diecast360-api api.diecast360.com
```

### Quản lý Tunnel Service (systemd)

```bash
# Cài tunnel như systemd service
sudo cloudflared service install

# Quản lý service
sudo systemctl start cloudflared
sudo systemctl stop cloudflared
sudo systemctl restart cloudflared
sudo systemctl status cloudflared

# Xem log tunnel
sudo journalctl -u cloudflared -f
sudo journalctl -u cloudflared --since "1 hour ago"

# Enable tự chạy khi boot
sudo systemctl enable cloudflared
```

### Kiểm tra tunnel hoạt động

```bash
# Kiểm tra trạng thái tunnel
cloudflared tunnel info diecast360-api

# Test từ máy local
curl -v https://api.diecast360.com/api/v1/health
```

---

## 7. Bảo Mật và Xoay Vòng Secrets

### Quy trình xoay vòng JWT_SECRET

```bash
# 1. Sinh secret mới (256-bit)
openssl rand -hex 32

# 2. Cập nhật .env (KHÔNG xóa key cũ ngay)
nano /home/pi/diecast360/backend/.env
# JWT_SECRET=<new_secret>

# 3. Reload PM2 (tất cả session hiện tại sẽ invalid)
pm2 reload diecast360-api

# LƯU Ý: Tất cả user sẽ bị logout và phải đăng nhập lại.
# Nên thực hiện ngoài giờ cao điểm.
```

### Quy trình xoay vòng Cookie Secret

```bash
# Tương tự JWT_SECRET
COOKIE_SECRET=<new_secret>
pm2 reload diecast360-api
```

### Xoay vòng Facebook Long-Lived Token

Facebook token hết hạn sau 60 ngày. Quy trình gia hạn:

```bash
# 1. Lấy short-lived token từ Facebook Login
# (Yêu cầu Admin App đăng nhập lại)

# 2. Đổi sang long-lived token
curl -G \
  "https://graph.facebook.com/oauth/access_token" \
  --data-urlencode "grant_type=fb_exchange_token" \
  --data-urlencode "client_id=$FACEBOOK_APP_ID" \
  --data-urlencode "client_secret=$FACEBOOK_APP_SECRET" \
  --data-urlencode "fb_exchange_token=<short_lived_token>"

# 3. Cập nhật .env
FACEBOOK_PAGE_ACCESS_TOKEN=<new_long_lived_token>

# 4. Reload PM2
pm2 reload diecast360-api
```

> **Lịch nhắc nhở**: Đặt lịch nhắc 45 ngày/lần để gia hạn token trước khi hết hạn.

### Xem Audit Logs

```bash
# Qua API (cần quyền platform_super)
curl -H "Cookie: <admin_session>" \
  "https://api.diecast360.com/api/v1/admin/shops/1/audit-logs?limit=50"
```

---

## 8. Quản Lý Log

### Vị trí Log Files

| Log | Đường dẫn | Mô tả |
|-----|----------|-------|
| PM2 stdout | `/var/log/pm2/diecast360-api-out.log` | Application output |
| PM2 stderr | `/var/log/pm2/diecast360-api-error.log` | Errors và exceptions |
| cloudflared | `journalctl -u cloudflared` | Tunnel logs |
| System | `/var/log/syslog` | OS logs |

### PM2 Log Rotation

```bash
# Cài pm2-logrotate module
pm2 install pm2-logrotate

# Cấu hình
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # midnight hàng ngày
```

### Log Levels

Cấu hình trong `.env`:

```bash
LOG_LEVEL=info   # production: info hoặc warn
# Các level: error | warn | info | debug | verbose
```

### Điều tra Lỗi

```bash
# Xem error gần nhất
pm2 logs diecast360-api --err --lines 50

# Tìm kiếm lỗi cụ thể
grep -i "error\|exception\|fatal" /var/log/pm2/diecast360-api-error.log | tail -50

# Xem log theo thời gian (cần timestamp)
grep "2026-05-22" /var/log/pm2/diecast360-api-error.log

# Monitor realtime
pm2 logs diecast360-api --raw | grep -i error
```

---

## 9. Monitoring và Alerting

### Health Check Endpoint

```bash
# Health check cơ bản
curl -s https://api.diecast360.com/api/v1/health | jq '.'

# Response mẫu khi OK:
# {
#   "ok": true,
#   "data": {
#     "status": "ok",
#     "db": "connected",
#     "uptime": 123456
#   }
# }
```

### Script Monitoring Tự Động

```bash
# /home/pi/scripts/healthcheck.sh
#!/bin/bash
ENDPOINT="https://api.diecast360.com/api/v1/health"
ALERT_EMAIL="admin@example.com"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT")

if [ "$STATUS" != "200" ]; then
  echo "[$(date)] ALERT: Health check failed! HTTP $STATUS" \
    | mail -s "Diecast360 DOWN" "$ALERT_EMAIL"
  # Thử restart tự động
  pm2 restart diecast360-api
fi
```

Thêm vào crontab (kiểm tra mỗi 5 phút):

```bash
*/5 * * * * /home/pi/scripts/healthcheck.sh >> /var/log/healthcheck.log 2>&1
```

### Giám sát Tài Nguyên

```bash
# RAM usage của Node.js process
pm2 show diecast360-api | grep -E "memory|cpu"

# Disk space uploads
df -h /home/pi/diecast360/uploads
du -sh /home/pi/diecast360/uploads/ --max-depth=2

# Tổng RAM hệ thống
free -m

# CPU load
uptime
top -bn1 | head -5
```

### Ngưỡng Cảnh báo

| Metric | Cảnh báo | Khẩn cấp |
|--------|---------|----------|
| RAM process | > 400 MB | > 450 MB (tự restart) |
| Disk uploads | > 70% | > 90% |
| CPU load | > 80% / 5min | > 95% / 1min |
| DB connections | > 15 (Neon free: 20 max) | > 18 |
| Error rate | > 1% requests | > 5% requests |

---

## 10. Các Tác Vụ Admin Thường Gặp

### 10.1 Thêm Shop Mới (Platform Super Admin)

```bash
# Qua API (cần token platform_super)
curl -X POST https://api.diecast360.com/api/v1/admin/shops \
  -H "Content-Type: application/json" \
  -H "Cookie: <platform_super_session>" \
  -H "X-CSRF-Token: <csrf_token>" \
  -d '{
    "name": "Tên Shop Mới",
    "slug": "ten-shop-moi",
    "contact_phone": "0901234567",
    "contact_email": "shop@example.com"
  }'
```

### 10.2 Vô Hiệu Hóa Shop

```bash
curl -X PATCH https://api.diecast360.com/api/v1/admin/shops/{shopId} \
  -H "Content-Type: application/json" \
  -H "Cookie: <platform_super_session>" \
  -H "X-CSRF-Token: <csrf_token>" \
  -d '{"is_active": false}'
```

### 10.3 Reset Mật Khẩu User

```bash
# 1. Kết nối database
psql "$DATABASE_URL"

# 2. Tạo hash mật khẩu mới (dùng bcrypt)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('MatKhauMoi@123', 12).then(h => console.log(h));"

# 3. Cập nhật trong DB
UPDATE users
SET password_hash = '<bcrypt_hash>'
WHERE email = 'user@example.com';

# 4. Thông báo cho user đổi mật khẩu ngay sau khi login
```

### 10.4 Thêm User Vào Shop

```bash
# Cần quyền shop_admin hoặc platform_super
curl -X POST https://api.diecast360.com/api/v1/admin/shops/{shopId}/members-users \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin_session>" \
  -H "X-CSRF-Token: <csrf_token>" \
  -d '{
    "user_id": 123,
    "role": "shop_staff"
  }'
```

### 10.5 Xử Lý Pre-Order Bị Kẹt

Pre-order có thể bị kẹt ở trạng thái trung gian nếu có lỗi. Quy trình xử lý:

```bash
# 1. Xác định pre-order bị kẹt
psql "$DATABASE_URL" -c "
SELECT id, status, updated_at
FROM pre_orders
WHERE shop_id = <shop_id>
  AND status NOT IN ('PAID', 'REFUNDED', 'CANCELLED')
  AND updated_at < NOW() - INTERVAL '7 days'
ORDER BY updated_at;
"

# 2. Sau khi xác nhận với Shop Owner, cancel nếu cần
# (NÊN làm qua API, không qua DB trực tiếp)
curl -X PATCH https://api.diecast360.com/api/v1/preorders/{id}/status \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin_session>" \
  -H "X-CSRF-Token: <csrf_token>" \
  -d '{"status": "CANCELLED", "note": "Auto-cancelled by admin after 7 days stuck"}'
```

---

## 11. Xử Lý Sự Cố

### Backend Không Phản Hồi

```bash
# 1. Kiểm tra PM2
pm2 status
pm2 logs diecast360-api --err --lines 20

# 2. Kiểm tra port
ss -tlnp | grep 3000

# 3. Restart nếu cần
pm2 restart diecast360-api

# 4. Kiểm tra lại
curl http://localhost:3000/api/v1/health
```

### Lỗi "Cannot connect to database"

```bash
# 1. Kiểm tra Neon status
open https://neon.tech/docs/status

# 2. Test kết nối trực tiếp
psql "$DATABASE_URL" -c "SELECT 1;"

# 3. Kiểm tra DATABASE_URL trong .env
grep DATABASE_URL /home/pi/diecast360/backend/.env

# 4. Kiểm tra số connection hiện tại
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"
```

### Upload Ảnh Thất Bại

```bash
# 1. Kiểm tra UPLOAD_DIR tồn tại và có quyền ghi
ls -la /home/pi/diecast360/uploads/
# Nếu không có quyền:
chmod 755 /home/pi/diecast360/uploads/
chown -R pi:pi /home/pi/diecast360/uploads/

# 2. Kiểm tra dung lượng disk
df -h /home/pi/diecast360/uploads/

# 3. Kiểm tra cấu hình R2 (nếu dùng R2)
grep "R2_" /home/pi/diecast360/backend/.env
```

### HTTPS/SSL Lỗi (Cloudflared)

```bash
# 1. Kiểm tra tunnel status
sudo systemctl status cloudflared
cloudflared tunnel info diecast360-api

# 2. Restart cloudflared
sudo systemctl restart cloudflared

# 3. Kiểm tra lại
curl -v https://api.diecast360.com/api/v1/health
```

### Memory Leak / OOM

```bash
# 1. Kiểm tra RAM usage
pm2 show diecast360-api | grep memory

# 2. Nếu > 400MB, restart
pm2 restart diecast360-api

# 3. Theo dõi sau restart
pm2 monit

# 4. Báo cáo cho Dev Team nếu tái diễn
```

### Migration Thất Bại

```bash
# 1. Xem lỗi chi tiết
pnpm prisma migrate status
pnpm prisma migrate deploy 2>&1 | tee migration_error.log

# 2. KHÔNG tự sửa migration file

# 3. Liên hệ Tech Lead ngay lập tức với nội dung migration_error.log

# 4. Nếu cần rollback khẩn cấp, restore từ backup DB
pg_restore --dbname="$DATABASE_URL" --clean /backup/latest.dump
```

---

*Tài liệu này được duy trì bởi DevOps Team. Cập nhật lần cuối: 2026-05-22.*
*Mọi thay đổi về cấu hình hệ thống phải được ghi lại trong change log và thông báo cho team.*

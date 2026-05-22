---
title: "Deployment Guide"
version: "1.0"
date: "2026-05-22"
author: "DevOps Team"
---

# File 29 — Deployment Guide

## Mục lục

1. [Development Environment](#1-development-environment)
2. [Staging Environment](#2-staging-environment)
3. [Production Environment — Backend (Raspberry Pi + Cloudflared)](#3-production-environment--backend-raspberry-pi--cloudflared)
4. [Production Environment — Frontend (Cloudflare Pages)](#4-production-environment--frontend-cloudflare-pages)
5. [Database production (Neon PostgreSQL)](#5-database-production-neon-postgresql)
6. [Cloudflare R2 Storage setup](#6-cloudflare-r2-storage-setup)
7. [Cloudflared Tunnel setup](#7-cloudflared-tunnel-setup)
8. [PM2 / systemd service configuration](#8-pm2--systemd-service-configuration)
9. [Reverse proxy (Nginx/Caddy)](#9-reverse-proxy-nginxcaddy)
10. [Monitoring & health checks](#10-monitoring--health-checks)
11. [Rollback procedures](#11-rollback-procedures)

---

## 1. Development Environment

Xem tài liệu chi tiết: [`26_dev_environment_setup.md`](26_dev_environment_setup.md)

**Tóm tắt:**
- DB: Local PostgreSQL (`localhost:5432`) hoặc Docker
- Storage: Local files (`./uploads`)
- Auth: HTTP cookie, `COOKIE_SECURE=false`, `COOKIE_SAME_SITE=lax`
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173` (Vite proxy → backend)

```bash
docker compose up -d db
pnpm install
pnpm --filter ./backend exec prisma migrate dev
pnpm dev
```

---

## 2. Staging Environment

Staging là môi trường giống production nhất, dùng để kiểm tra trước khi deploy production.

### Yêu cầu server staging

| Thành phần | Yêu cầu tối thiểu |
|-----------|-------------------|
| CPU | 2 cores |
| RAM | 1 GB |
| Storage | 10 GB SSD |
| OS | Ubuntu 22.04 LTS / Debian 12 |
| Node.js | 20.x LTS |

### Docker Compose setup cho staging

**`docker-compose.staging.yml`:**

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    env_file:
      - ./backend/.env.staging
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
        VITE_MAX_SPINNER_FRAMES: "48"
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"

volumes:
  uploads_data:
```

```bash
# Deploy staging
docker compose -f docker-compose.staging.yml up -d --build
```

### Neon DB cho staging

1. Tạo branch staging trong Neon Console: `Project > Branches > + New Branch`
2. Đặt tên: `staging`
3. Lấy connection strings (pooled + direct)
4. Trong `backend/.env.staging`:

```dotenv
DATABASE_URL=postgresql://neondb_owner:pass@ep-xxx-staging-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:pass@ep-xxx-staging.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

5. Chạy migration:
```bash
cd backend
DATABASE_URL="$STAGING_DIRECT_URL" DIRECT_URL="$STAGING_DIRECT_URL" npx prisma migrate deploy
```

### Cloudflare Pages preview deployment

Cloudflare Pages tự động tạo preview URL cho mỗi branch:
- PR branch `feature/DC-101-*` → `https://feature-dc-101-xxx.diecast360.pages.dev`
- Cấu hình `VITE_API_BASE_URL` cho staging API endpoint

### Environment variables cho staging

```dotenv
# backend/.env.staging
DATABASE_URL=postgresql://...staging-pooler...
DIRECT_URL=postgresql://...staging...
NODE_ENV=production
PORT=3000
JWT_SECRET=staging-jwt-secret-min-32-chars
COOKIE_SECRET=staging-cookie-secret-min-32-chars
COOKIE_SECURE=true
COOKIE_SAME_SITE=none  # nếu frontend khác domain
FRONTEND_URL=https://staging.diecast360.pages.dev
BACKEND_URL=https://staging-api.yourdomain.com
STORAGE_DRIVER=local
UPLOAD_DIR=/app/uploads
```

### SSL via Cloudflared tunnel (staging)

Cloudflared tạo HTTPS tunnel miễn phí — không cần SSL certificate riêng:

```bash
# Cài cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Tạo tunnel staging
cloudflared tunnel create diecast360-staging
cloudflared tunnel route dns diecast360-staging staging-api.yourdomain.com

# Config file: ~/.cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: staging-api.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404

# Chạy tunnel
cloudflared tunnel run diecast360-staging
```

### Staging testing checklist

Trước khi merge lên production, verify:

- [ ] Đăng nhập admin thành công (cookie set đúng, HTTPS)
- [ ] Thêm item + upload ảnh (< 10MB)
- [ ] Upload spinner 24 frames, kiểm tra order frame
- [ ] Tạo pre-order, chuyển status PENDING → WAITING_FOR_GOODS
- [ ] Kiểm tra public catalog hiển thị đúng shop
- [ ] API health: `curl https://staging-api.yourdomain.com/api/v1/health`
- [ ] Kiểm tra CORS không bị block
- [ ] Cookie `access_token` set trên browser staging domain
- [ ] Upload vượt `MAX_UPLOAD_MB` bị từ chối với message rõ ràng

---

## 3. Production Environment — Backend (Raspberry Pi + Cloudflared)

### Kiến trúc production

```
Browser
  → Cloudflare Pages (frontend static)
  → Cloudflare Edge (CDN + TLS)
  → Cloudflared Tunnel (HTTPS → HTTP)
  → Raspberry Pi :3000 (NestJS)
  → Neon PostgreSQL (cloud)
```

### Chuẩn bị server (Raspberry Pi)

**Specs khuyến nghị:** Raspberry Pi 4, 2GB+ RAM, 32GB+ SD card hoặc USB SSD, OS 64-bit (Raspberry Pi OS 64-bit hoặc Ubuntu 22.04 ARM64)

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra
node --version   # v20.x.x
npm --version

# Cài Git
sudo apt install -y git

# Cài rsync (dùng trong CD)
sudo apt install -y rsync

# Tạo thư mục deploy
sudo mkdir -p /opt/diecast360-backend
sudo chown pi:pi /opt/diecast360-backend   # chỉnh username phù hợp
```

### Pre-deployment checklist

- [ ] Node.js 20 đã cài và hoạt động
- [ ] `UPLOAD_DIR` tồn tại và có quyền ghi
- [ ] `backend/.env` đã tạo với đầy đủ biến production
- [ ] Neon DB đã migrate schema mới nhất
- [ ] Cloudflared tunnel đã cấu hình và chạy
- [ ] systemd service file đã tạo
- [ ] `sudo systemctl restart diecast360-api` hoạt động không cần password (sudoers)

### Quy trình deploy thủ công (manual)

```bash
# 1. SSH vào Pi
ssh pi@<raspberry-pi-ip>

# 2. Pull code mới nhất
cd /path/to/Diecast360/backend

# 3. Cài dependencies (cần devDependencies cho build)
NPM_CONFIG_PRODUCTION=false NODE_ENV=development npm ci

# 4. Build
npm run build

# 5. Cài chỉ production deps
npm ci --omit=dev

# 6. Generate Prisma client
npx prisma generate

# 7. Chạy migration (dùng DIRECT_URL)
npx prisma migrate deploy

# 8. Restart service
sudo systemctl restart diecast360-api

# 9. Kiểm tra
sudo systemctl status diecast360-api
curl http://127.0.0.1:3000/api/v1/health
journalctl -u diecast360-api -n 50 --no-pager
```

### Quy trình deploy tự động (GitHub Actions + Self-hosted Runner)

Sau khi merge PR vào `main`:

1. CI pass (tự động)
2. CD workflow trigger (tự động)
3. Job `migrate`: chạy `prisma migrate deploy` trên GitHub-hosted runner
4. Job `deploy`: checkout, build, rsync, restart trên Pi
5. Health check: probe `/api/v1/health` 30 lần

Xem chi tiết: [`28_cicd_pipeline.md`](28_cicd_pipeline.md)

### Node memory limit trên Pi

Pi có RAM hạn chế. Cấu hình trong systemd hoặc PM2:

```bash
# systemd (ExecStart)
ExecStart=/usr/bin/node --max-old-space-size=512 dist/main.js

# PM2
pm2 start dist/main.js --node-args="--max-old-space-size=512"
```

### Sharp config cho low-RAM

Trong code backend (thường ở `main.ts` hoặc image service):

```typescript
import sharp from 'sharp';
sharp.cache(false);      // Tắt cache buffer
sharp.concurrency(1);   // Xử lý tuần tự
```

---

## 4. Production Environment — Frontend (Cloudflare Pages)

### Cài đặt lần đầu

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Pages > + Create a project > Connect to Git**
3. Chọn GitHub repo `diecast360`
4. Cấu hình build:

| Setting | Giá trị |
|---------|---------|
| Project name | `diecast360` |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `cd frontend && npm ci && npm run build` |
| Build output directory | `frontend/dist` |
| Root directory | `/` |

5. **Environment variables (Production):**

```
NODE_VERSION=20
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_MAX_SPINNER_FRAMES=48
VITE_PUBLIC_CATALOG_SHOP_ID=<your-shop-uuid>
```

6. **Save and Deploy**

### SPA routing

Tạo file `frontend/public/_redirects`:

```
/*    /index.html    200
```

Hoặc `frontend/public/_headers` cho security headers:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### Deploy qua wrangler CLI

```bash
# Cài wrangler
npm install -g wrangler

# Build frontend
cd frontend
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=diecast360

# Xem deployment history
npx wrangler pages deployment list --project-name=diecast360
```

### Custom domain

1. Cloudflare Pages > Project > Custom domains > + Set up a custom domain
2. Nhập domain: `diecast360.yourdomain.com`
3. Cloudflare tự cấu hình DNS record
4. HTTPS được cấp tự động

---

## 5. Database production (Neon PostgreSQL)

### Tạo project Neon

1. Đăng ký tại [neon.tech](https://neon.tech)
2. **New Project** → chọn region gần nhất (ap-southeast-1 cho Vietnam)
3. Database name: `neondb` (mặc định)
4. Lấy connection strings:
   - **Pooled** (có `-pooler` trong hostname) → `DATABASE_URL`
   - **Direct** (không có `-pooler`) → `DIRECT_URL`

### Connection string format

```dotenv
# Runtime (pooled — cho app)
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Prisma migrate (direct — không qua pooler)
DIRECT_URL=postgresql://neondb_owner:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Chạy migration lên Neon

```bash
# Từ máy dev, trỏ env vào Neon
cd backend
DIRECT_URL="postgresql://neondb_owner:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" \
DATABASE_URL="postgresql://neondb_owner:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" \
npx prisma migrate deploy

# Hoặc qua GitHub Actions (xem deploy-backend.yml)
```

### Migration strategy

| Tình huống | Cách xử lý |
|-----------|-----------|
| Thêm cột nullable | Additive — an toàn, không cần maintenance window |
| Thêm cột NOT NULL với default | Thêm default value trong migration |
| Rename cột | Tạo cột mới + migrate data + drop cột cũ (3 migrations) |
| Xóa cột | Đảm bảo code không còn dùng cột đó trước khi drop |
| Thêm index | Xem xét `CREATE INDEX CONCURRENTLY` trong raw SQL |

**Nguyên tắc:** Không edit migration đã apply. Không force-push schema. Luôn test migration trên staging trước.

### Backup Neon

- Neon free tier: lưu trữ 1 GB, Point-in-Time Recovery (PITR) trong 24h
- Paid tier: PITR lâu hơn, nhiều branches hơn
- Thủ công backup:
  ```bash
  pg_dump "postgresql://neondb_owner:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" \
    -f backup_$(date +%Y%m%d).sql
  ```

---

## 6. Cloudflare R2 Storage setup

Dùng R2 khi không muốn lưu media trên disk Pi (recommended cho production ổn định).

### Tạo R2 bucket

1. Cloudflare Dashboard > **R2 > + Create bucket**
2. Name: `diecast360-media`
3. Region: Automatic (gần nhất)

### Tạo API token

1. R2 > **Manage R2 API tokens > + Create API token**
2. Permissions: **Object Read & Write** (chọn bucket cụ thể)
3. Lưu lại `Access Key ID` và `Secret Access Key`

### Cấu hình backend

```dotenv
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=abc123def456...
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=yyy-secret
R2_BUCKET=diecast360-media
```

### Migrate từ local storage sang R2

```bash
# Cài rclone
curl https://rclone.org/install.sh | sudo bash

# Cấu hình remote R2
rclone config create r2remote s3 \
  provider Cloudflare \
  access_key_id $R2_ACCESS_KEY_ID \
  secret_access_key $R2_SECRET_ACCESS_KEY \
  endpoint https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com \
  region auto

# Dry-run kiểm tra
rclone sync /opt/diecast360-backend/uploads r2remote:diecast360-media \
  --dry-run --progress

# Sync thật (giữ nguyên key structure — không thêm prefix)
rclone sync /opt/diecast360-backend/uploads r2remote:diecast360-media \
  --progress

# So sánh số files
rclone size /opt/diecast360-backend/uploads
rclone size r2remote:diecast360-media

# Sau khi verify, restart backend với STORAGE_DRIVER=r2
sudo systemctl restart diecast360-api
```

---

## 7. Cloudflared Tunnel setup

Cloudflared cho phép expose backend Pi ra internet HTTPS mà không cần IP tĩnh và không mở inbound port.

### Cài cloudflared trên Pi

```bash
# ARM64 (Pi 4 64-bit)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb \
  -o cloudflared.deb
sudo dpkg -i cloudflared.deb
cloudflared --version
```

### Tạo và cấu hình tunnel

```bash
# Đăng nhập Cloudflare
cloudflared tunnel login

# Tạo tunnel
cloudflared tunnel create diecast360-api
# Ghi lại Tunnel ID

# Tạo DNS record
cloudflared tunnel route dns diecast360-api api.yourdomain.com
```

**Tạo config file `/home/pi/.cloudflared/config.yml`:**

```yaml
tunnel: <your-tunnel-id>
credentials-file: /home/pi/.cloudflared/<your-tunnel-id>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://127.0.0.1:3000
    originRequest:
      connectTimeout: 30s
      noTLSVerify: false
  - service: http_status:404
```

### Cài tunnel như systemd service

```bash
# Cài service
sudo cloudflared service install

# Start và enable
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
sudo systemctl status cloudflared
```

### Kiểm tra tunnel hoạt động

```bash
# Từ bên ngoài
curl https://api.yourdomain.com/api/v1/health

# Xem logs tunnel trên Pi
journalctl -u cloudflared -f
```

---

## 8. PM2 / systemd service configuration

### Phương án A: systemd (khuyến nghị cho Pi)

**Tạo `/etc/systemd/system/diecast360-api.service`:**

```ini
[Unit]
Description=Diecast360 Backend API
Documentation=https://github.com/your-org/diecast360
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/opt/diecast360-backend
EnvironmentFile=/opt/diecast360-backend/.env

# Node memory limit cho Pi 2GB RAM
ExecStart=/usr/bin/node --max-old-space-size=512 dist/main.js

# Restart policy
Restart=on-failure
RestartSec=10
StartLimitInterval=60s
StartLimitBurst=3

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=diecast360-api

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
# Load và enable
sudo systemctl daemon-reload
sudo systemctl enable diecast360-api
sudo systemctl start diecast360-api

# Kiểm tra
sudo systemctl status diecast360-api
journalctl -u diecast360-api -f
```

**Cho phép restart không cần sudo password** (cần cho CD workflow):

```bash
sudo visudo
# Thêm dòng sau (chỉnh username):
pi ALL=(ALL) NOPASSWD: /bin/systemctl restart diecast360-api
pi ALL=(ALL) NOPASSWD: /bin/systemctl status diecast360-api
```

### Phương án B: PM2

```bash
# Cài PM2
npm install -g pm2

# Tạo ecosystem config
cat > /opt/diecast360-backend/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'diecast360-api',
    script: 'dist/main.js',
    cwd: '/opt/diecast360-backend',
    env_file: '/opt/diecast360-backend/.env',
    node_args: '--max-old-space-size=512',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/diecast360/error.log',
    out_file: '/var/log/diecast360/out.log',
  }]
};
EOF

# Start
pm2 start /opt/diecast360-backend/ecosystem.config.js
pm2 save

# Enable startup
pm2 startup systemd
# Chạy lệnh được output bởi pm2 startup

# Commands thường dùng
pm2 status
pm2 logs diecast360-api
pm2 restart diecast360-api
pm2 reload diecast360-api    # zero-downtime restart (cluster mode)
```

---

## 9. Reverse proxy (Nginx/Caddy)

Trong deployment hiện tại với Cloudflared tunnel, **Nginx/Caddy không bắt buộc** vì Cloudflared đã handle TLS và proxy. Tuy nhiên có thể thêm nếu cần thêm security headers hoặc rate limiting ở local.

### Nginx (optional)

```nginx
# /etc/nginx/sites-available/diecast360
server {
    listen 127.0.0.1:3001;
    server_name localhost;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Upload size limit
        client_max_body_size 15M;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Không log request body (bảo mật)
    access_log /var/log/nginx/diecast360.access.log;
    error_log /var/log/nginx/diecast360.error.log;
}
```

### Caddy (thay thế đơn giản hơn)

```caddyfile
# /etc/caddy/Caddyfile
# Nếu Caddy xử lý TLS thay vì Cloudflared

api.yourdomain.com {
    reverse_proxy localhost:3000

    # Upload limit
    request_body {
        max_size 15MB
    }

    # Tắt access log body
    log {
        output file /var/log/caddy/diecast360.log
        format json
    }
}
```

---

## 10. Monitoring & health checks

### Health endpoint

Backend expose: `GET /api/v1/health`

```json
{
  "status": "ok",
  "timestamp": "2026-05-22T10:00:00.000Z"
}
```

### Kiểm tra thủ công

```bash
# Local
curl http://127.0.0.1:3000/api/v1/health

# Production (qua tunnel)
curl https://api.yourdomain.com/api/v1/health

# Systemd logs
journalctl -u diecast360-api -n 100 --no-pager
journalctl -u diecast360-api -f   # follow

# PM2 logs
pm2 logs diecast360-api --lines 100
```

### Automated health check với systemd timer

```ini
# /etc/systemd/system/diecast360-healthcheck.service
[Unit]
Description=Diecast360 API Health Check

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'curl -sfS http://127.0.0.1:3000/api/v1/health || systemctl restart diecast360-api'
```

```ini
# /etc/systemd/system/diecast360-healthcheck.timer
[Unit]
Description=Run Diecast360 health check every 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Unit=diecast360-healthcheck.service

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now diecast360-healthcheck.timer
sudo systemctl list-timers | grep diecast360
```

### Uptime monitoring (external)

Khuyến nghị dùng dịch vụ miễn phí:
- [UptimeRobot](https://uptimerobot.com) — monitor `https://api.yourdomain.com/api/v1/health` mỗi 5 phút
- [Better Uptime](https://betteruptime.com) — tương tự, có incident management
- Cấu hình alert qua email/SMS/Slack khi down

---

## 11. Rollback procedures

### Backend rollback

**Nhanh nhất: revert qua GitHub**

```bash
# Trên máy dev
git revert <bad-commit-hash> --no-edit
git push origin main
# CD tự động chạy và deploy version cũ
```

**Thủ công trên Pi:**

```bash
ssh pi@raspberry-pi

# Kiểm tra logs để xác định vấn đề
journalctl -u diecast360-api -n 200 --no-pager

# Option 1: Checkout version cũ (nếu /opt/ là git repo)
cd /opt/diecast360-backend
git log --oneline -5
git checkout <previous-commit>
npm ci --omit=dev
npx prisma generate
sudo systemctl restart diecast360-api

# Option 2: Restore từ backup dist
ls /opt/diecast360-backups/
cp -r /opt/diecast360-backups/20260101_120000/dist /opt/diecast360-backend/
sudo systemctl restart diecast360-api

# Verify
curl http://127.0.0.1:3000/api/v1/health
```

### Frontend rollback (Cloudflare Pages)

```bash
# Qua dashboard
# Pages > diecast360 > Deployments > Chọn deployment cũ > ... > Rollback to this deployment

# Qua CLI
npx wrangler pages deployment list --project-name=diecast360
npx wrangler pages deployment rollback <deployment-id> --project-name=diecast360
```

### Database rollback

> Ưu tiên rollback code trước — chỉ rollback DB khi thực sự cần thiết.

```bash
# Kiểm tra migration status
npx prisma migrate status

# Nếu migration mới gây lỗi, tạo migration đảo ngược
cd backend
npx prisma migrate dev --name rollback_add_xxx_column

# Với Neon: có thể dùng Time Travel (PITR) nếu cần
# Neon Console > Project > Restore > chọn thời điểm trước khi migrate
```

### Checklist sau rollback

- [ ] Health endpoint trả `{"status":"ok"}`
- [ ] Đăng nhập admin hoạt động
- [ ] Xem logs để confirm không còn error
- [ ] Notify team về sự cố và nguyên nhân
- [ ] Tạo issue để track và fix properly

---

## Tài liệu liên quan

- [`docs/DEPLOYMENT.md`](../../DEPLOYMENT.md) — Deployment summary (Pi + Neon + Vercel)
- [`docs/BACKEND_SELF_HOSTED_RUNNER.md`](../../BACKEND_SELF_HOSTED_RUNNER.md) — Setup self-hosted runner
- [`docs/BACKEND_PI_CLOUDFLARE.md`](../../BACKEND_PI_CLOUDFLARE.md) — Pi + Cloudflare chi tiết
- [`docs/ENV.md`](../../ENV.md) — Biến môi trường đầy đủ
- [`docs/COOKIE_AUTH.md`](../../COOKIE_AUTH.md) — Cookie/CORS cross-domain
- [`docs/project-docs/group5-devops/28_cicd_pipeline.md`](28_cicd_pipeline.md) — CI/CD pipeline
- [`docs/project-docs/group5-devops/30_environment_config_guide.md`](30_environment_config_guide.md) — Config guide

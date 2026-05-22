---
title: "Environment Configuration Guide"
version: "1.0"
date: "2026-05-22"
author: "DevOps Team"
---

# File 30 — Environment Configuration Guide

## Mục lục

1. [Tổng quan cấu trúc env files](#1-tổng-quan-cấu-trúc-env-files)
2. [Backend .env — tham chiếu đầy đủ](#2-backend-env--tham-chiếu-đầy-đủ)
3. [Frontend .env.local — tham chiếu đầy đủ](#3-frontend-envlocal--tham-chiếu-đầy-đủ)
4. [Secrets management](#4-secrets-management)
5. [Environment-specific configs](#5-environment-specific-configs)
6. [Config validation on startup](#6-config-validation-on-startup)
7. [Rotation procedures](#7-rotation-procedures)
8. [Troubleshooting config issues](#8-troubleshooting-config-issues)

---

## 1. Tổng quan cấu trúc env files

### Monorepo env file layout

```
diecast360/
├── .env                      # Root level (Docker Compose — không dùng cho app)
├── .env.example              # Template cho root .env
├── backend/
│   ├── .env                  # Backend config — KHÔNG commit
│   ├── .env.example          # Template — COMMIT vào git
│   └── .env.test             # Test environment (nếu có)
└── frontend/
    ├── .env.local            # Frontend config — KHÔNG commit
    ├── .env.example          # Template — COMMIT vào git
    └── .env.production       # (optional) Overrides khi `vite build`
```

### Nguyên tắc

| File | Commit? | Mục đích |
|------|---------|---------|
| `backend/.env` | KHÔNG | Secrets và config thực tế |
| `backend/.env.example` | CÓ | Template với placeholder values |
| `frontend/.env.local` | KHÔNG | Build-time config thực tế |
| `frontend/.env.example` | CÓ | Template |
| `.env` (root) | KHÔNG | Docker Compose secrets |

### `.gitignore` đảm bảo không commit secrets

```gitignore
# Trong .gitignore tại root
.env
.env.local
.env.*.local
backend/.env
frontend/.env.local
```

---

## 2. Backend .env — tham chiếu đầy đủ

### 2.1 Database

| Biến | Bắt buộc | Default | Ví dụ | Mô tả |
|------|---------|---------|-------|-------|
| `DATABASE_URL` | Bắt buộc | — | `postgresql://postgres:postgres@localhost:5432/diecast360` | Connection string cho runtime app. Với Neon: dùng URL pooled (có `-pooler` trong hostname) |
| `DIRECT_URL` | Bắt buộc | — | `postgresql://postgres:postgres@localhost:5432/diecast360` | Connection string cho Prisma CLI (migrate, introspect). Với Neon: dùng URL direct (không pooler) |

**Tại sao cần hai URL?**

```
DATABASE_URL  → Prisma runtime → Neon Pooler (pgBouncer) → DB
                                  └─ Connection pooling, scale tốt hơn

DIRECT_URL    → Prisma CLI    → Neon Direct → DB
                                  └─ Bắt buộc: pgBouncer không support
                                    `SHOW search_path` của migrate
```

**Format cho từng môi trường:**

```dotenv
# Local dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/diecast360
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/diecast360

# Neon production
DATABASE_URL=postgresql://neondb_owner:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://neondb_owner:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2.2 App runtime

| Biến | Bắt buộc | Default | Ví dụ | Mô tả |
|------|---------|---------|-------|-------|
| `NODE_ENV` | Khuyến nghị | `development` | `production` | Bật HTTPS cookie, CORS strict, HSTS khi `production` |
| `PORT` | Tùy chọn | `3000` | `3000` | Port backend listen |
| `HOST` | Tùy chọn | `0.0.0.0` | `127.0.0.1` | Dùng `127.0.0.1` khi expose qua tunnel/proxy |

### 2.3 JWT & Auth

| Biến | Bắt buộc | Validation | Ví dụ |
|------|---------|-----------|-------|
| `JWT_SECRET` | Bắt buộc | Min 32 ký tự | `a1b2c3d4e5f6...` (hex 64 chars) |
| `JWT_EXPIRES_IN` | Tùy chọn | Time string | `15m` (default) |
| `REFRESH_TOKEN_EXPIRES_IN` | Tùy chọn | Time string | `7d` (default) |
| `JWT_ALLOW_AUTHORIZATION_BEARER` | Tùy chọn | `true`/`false` | `true` (default) |

**Tạo JWT_SECRET mạnh:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 64-char hex string
```

**`JWT_ALLOW_AUTHORIZATION_BEARER`:** Cho phép đọc JWT từ `Authorization: Bearer <token>` header ngoài cookie. Đặt `false` trong production web-only để giảm attack surface (XSS không đọc được HttpOnly cookie nhưng có thể inject header).

### 2.4 Cookie

| Biến | Dev | Staging | Production | Mô tả |
|------|-----|---------|-----------|-------|
| `COOKIE_SECRET` | any 32+ chars | random 32+ | random 32+ | Ký cookie — phải khác `JWT_SECRET` |
| `COOKIE_SECURE` | `false` | `true` | `true` | Chỉ gửi cookie qua HTTPS |
| `COOKIE_SAME_SITE` | `lax` | `none` hoặc `lax` | `none` (cross-domain) / `lax` (same-domain) | SameSite policy |

**Quy tắc SameSite:**

```
Frontend và API cùng domain (ví dụ: yourdomain.com + api.yourdomain.com):
  → COOKIE_SAME_SITE=lax

Frontend và API khác domain hoàn toàn (Cloudflare Pages + Pi tunnel):
  → COOKIE_SAME_SITE=none
  → COOKIE_SECURE=true (bắt buộc khi SameSite=none)
  → HTTPS trên cả hai phía
```

**`SECURITY_HSTS_DISABLED`:** Mặc định `false`. Chỉ set `true` khi rollback khẩn cấp cần tắt HSTS tạm thời. HSTS được bật tự động khi `NODE_ENV=production` và `COOKIE_SECURE=true`.

### 2.5 CORS

| Biến | Dev | Production | Mô tả |
|------|-----|-----------|-------|
| `FRONTEND_URL` | `http://localhost:5173` | `https://diecast360.pages.dev` | Origin chính của frontend |
| `FRONTEND_URLS` | (không cần) | `https://preview.xxx.dev,...` | Các origin bổ sung, phân cách bằng dấu phẩy |
| `CORS_ALLOW_LAN` | `true` (khi test LAN) | `false` (bắt buộc) | Cho phép IP private trong CORS |

> **Production:** `CORS_ALLOW_LAN=true` sẽ bị từ chối khi `NODE_ENV=production`. Backend kiểm tra và log warning.

### 2.6 Upload & Storage

| Biến | Bắt buộc | Default | Mô tả |
|------|---------|---------|-------|
| `UPLOAD_DIR` | Khi `STORAGE_DRIVER=local` | `./uploads` | Thư mục lưu file. Phải tồn tại và có quyền ghi |
| `MAX_UPLOAD_MB` | Tùy chọn | `10` | Giới hạn kích thước file upload (MB) |
| `MAX_SPINNER_FRAMES` | Tùy chọn | `48` | Số frame tối đa cho 360 spinner |
| `ALLOWED_MIME` | Tùy chọn | `image/jpeg,image/png,image/webp` | MIME types được phép upload |
| `STORAGE_DRIVER` | Tùy chọn | `local` | `local` hoặc `r2` |

### 2.7 Signed Media URLs

| Biến | Bắt buộc | Default | Mô tả |
|------|---------|---------|-------|
| `BACKEND_URL` | Khuyến nghị | `http://localhost:3000` | Base URL public của API. Dùng để tạo signed media URL |
| `MEDIA_SIGNING_SECRET` | Tùy chọn | Fallback `JWT_SECRET` | Secret riêng cho ký media URL. Nên set riêng để xoay JWT không vô hiệu link ảnh cũ |
| `MEDIA_URL_TTL_MS` | Tùy chọn | `604800000` (7 ngày) | TTL của signed URL (milliseconds) |

### 2.8 Cloudflare R2 (khi `STORAGE_DRIVER=r2`)

| Biến | Bắt buộc | Mô tả |
|------|---------|-------|
| `R2_ACCOUNT_ID` | Bắt buộc | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Bắt buộc | R2 API Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Bắt buộc | R2 API Secret — KHÔNG commit |
| `R2_BUCKET` | Bắt buộc | Tên bucket (ví dụ: `diecast360-media`) |
| `R2_PUBLIC_BASE_URL` | Tùy chọn | CDN URL nếu không dùng presigned |

### 2.9 Rate limiting

| Biến | Bắt buộc | Default | Mô tả |
|------|---------|---------|-------|
| `THROTTLE_TTL` | Tùy chọn | `60000` | Window (ms) cho rate limiting |
| `THROTTLE_LIMIT` | Tùy chọn | `100` | Số request trong window |

### 2.10 Third-party integrations (optional)

| Biến | Module | Mô tả |
|------|--------|-------|
| `FACEBOOK_PAGE_ID` | Facebook publish | Page ID |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Facebook publish | Long-lived Page Access Token — KHÔNG commit |
| `FACEBOOK_GRAPH_API_VERSION` | Facebook publish | Mặc định `v21.0` |
| `OPENAI_API_KEY` | AI features | `sk-...` — KHÔNG commit |
| `OPENAI_MODEL` | AI features | `gpt-4o` hoặc model khác |
| `PINECONE_API_KEY` | Vector search | KHÔNG commit |
| `PINECONE_INDEX` | Vector search | Mặc định `diecast360` |

### Template `backend/.env.example`

```dotenv
# =============================================
# Diecast360 Backend — Environment Variables
# Copy to .env and fill in actual values
# =============================================

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diecast360"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/diecast360"

# App
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Auth (REQUIRED: min 32 chars each)
JWT_SECRET=change-me-to-random-hex-string-at-least-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
JWT_ALLOW_AUTHORIZATION_BEARER=true

# Cookie (REQUIRED: min 32 chars)
COOKIE_SECRET=change-me-to-another-random-secret-32-chars
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# CORS
FRONTEND_URL=http://localhost:5173
# FRONTEND_URLS=
CORS_ALLOW_LAN=false

# Upload
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=10
MAX_SPINNER_FRAMES=48
ALLOWED_MIME=image/jpeg,image/png,image/webp

# URLs
BACKEND_URL=http://localhost:3000

# Media signing (optional — falls back to JWT_SECRET)
# MEDIA_SIGNING_SECRET=
# MEDIA_URL_TTL_MS=604800000

# Storage (local or r2)
STORAGE_DRIVER=local

# R2 (required when STORAGE_DRIVER=r2)
# R2_ACCOUNT_ID=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_BUCKET=diecast360-media

# Rate limiting
# THROTTLE_TTL=60000
# THROTTLE_LIMIT=100

# Facebook (optional)
# FACEBOOK_PAGE_ID=
# FACEBOOK_PAGE_ACCESS_TOKEN=
# FACEBOOK_GRAPH_API_VERSION=v21.0

# AI (optional)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o
# PINECONE_API_KEY=
# PINECONE_INDEX=diecast360
```

---

## 3. Frontend .env.local — tham chiếu đầy đủ

### 3.1 Vite environment variables

Tất cả biến frontend phải có prefix `VITE_` để Vite expose vào bundle. Biến không có prefix `VITE_` sẽ không available trong browser code.

| Biến | Bắt buộc | Default | Mô tả |
|------|---------|---------|-------|
| `VITE_API_BASE_URL` | Tùy chọn | `""` (empty) | Base URL API. Rỗng/`auto` = same-origin `/api/v1` qua Vite proxy |
| `VITE_MAX_SPINNER_FRAMES` | Tùy chọn | `48` | UI limit cho spinner frames — phải <= backend `MAX_SPINNER_FRAMES` |
| `VITE_PUBLIC_CATALOG_SHOP_ID` | Tùy chọn | `""` | UUID/slug shop mặc định cho catalog public |
| `VITE_PUBLIC_PREORDER_SHOP_ID` | Tùy chọn | `""` | UUID shop cho trang pre-orders public |
| `VITE_ADMIN_SEMANTIC_SEARCH_ENABLED` | Tùy chọn | `false` | Bật UI semantic search (cần backend Pinecone) |

### 3.2 Build-time vs runtime

```
VITE_* variables → được nhúng vào JavaScript bundle lúc `vite build`
                → KHÔNG thể thay đổi sau khi build mà không rebuild
                → Đọc trong code: import.meta.env.VITE_API_BASE_URL
```

**Hệ quả:**
- Thay đổi `VITE_API_BASE_URL` → phải chạy `pnpm build` lại
- Thay đổi trong `frontend/.env.local` → phải restart `pnpm dev`
- Production build: set env vars TRƯỚC KHI chạy `vite build`

### 3.3 Vite dev proxy

Cấu hình trong `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Khi `VITE_API_BASE_URL` rỗng/`auto`, code frontend gọi `/api/v1/...` relative, Vite proxy forward đến `http://localhost:3000/api/v1/...`.

**Không cần CORS configuration trong dev** khi dùng Vite proxy.

### 3.4 Template `frontend/.env.example`

```dotenv
# =============================================
# Diecast360 Frontend — Environment Variables
# Copy to .env.local
# =============================================

# API Base URL
# Empty = same-origin /api/v1 via Vite proxy (local dev)
# Absolute URL for staging/production when API is on different domain
VITE_API_BASE_URL=

# Spinner limits (match or less than backend MAX_SPINNER_FRAMES)
VITE_MAX_SPINNER_FRAMES=48

# Public catalog shop ID (required for single-tenant public pages)
VITE_PUBLIC_CATALOG_SHOP_ID=

# Public preorder shop ID
VITE_PUBLIC_PREORDER_SHOP_ID=

# Admin semantic search (requires Pinecone configured on backend)
VITE_ADMIN_SEMANTIC_SEARCH_ENABLED=false
```

---

## 4. Secrets management

### 4.1 Phân loại secrets

| Secret | Dev | Staging | Production |
|--------|-----|---------|-----------|
| `JWT_SECRET` | `.env` local | Server env | GitHub Secrets + server `.env` |
| `COOKIE_SECRET` | `.env` local | Server env | GitHub Secrets + server `.env` |
| `DATABASE_URL` | `.env` local | Server env | GitHub Environment secret |
| `DIRECT_URL` | `.env` local | Server env | GitHub Environment secret |
| `R2_SECRET_ACCESS_KEY` | `.env` local (nếu dùng) | Server env | GitHub Secrets |
| `OPENAI_API_KEY` | `.env` local (nếu dùng) | Server env | GitHub Secrets |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | `.env` local (nếu dùng) | Server env | GitHub Secrets |

### 4.2 Không bao giờ commit các biến này

```bash
# Danh sách tuyệt đối KHÔNG commit
JWT_SECRET
COOKIE_SECRET
DATABASE_URL          # (nếu có password thật)
DIRECT_URL            # (nếu có password thật)
R2_SECRET_ACCESS_KEY
OPENAI_API_KEY
PINECONE_API_KEY
FACEBOOK_PAGE_ACCESS_TOKEN
MEDIA_SIGNING_SECRET
```

**Pre-commit hook để ngăn commit secrets** (optional, thêm vào `.git/hooks/pre-commit`):

```bash
#!/bin/bash
# Check không có .env files được staged
if git diff --cached --name-only | grep -qE '^(backend|frontend)/\.env$|\.env\.local$'; then
  echo "ERROR: Attempting to commit .env file!"
  echo "Remove from staging: git reset HEAD <file>"
  exit 1
fi

# Check có secret patterns trong staged files
if git diff --cached | grep -qE '(sk-[a-zA-Z0-9]{48}|AKIA[A-Z0-9]{16})'; then
  echo "WARNING: Possible API key in staged changes. Please review."
  exit 1
fi
```

### 4.3 GitHub Actions secrets

**Repository-level secrets** (`Settings > Secrets and variables > Actions`):

| Secret | Dùng ở |
|--------|--------|
| `NEON_PROJECT_ID` | Neon preview branches workflow |
| `NEON_API_KEY` | Neon preview branches workflow |
| `SLACK_WEBHOOK_URL` | Deployment notifications (optional) |

**Environment secrets** (`Settings > Environments > production`):

| Secret | Dùng ở |
|--------|--------|
| `PRODUCTION_DATABASE_URL` | `deploy-backend.yml` migrate job |
| `PRODUCTION_DIRECT_URL` | `deploy-backend.yml` migrate job |
| `DEPLOY_REMOTE_PATH` | `deploy-backend.yml` deploy job |

### 4.4 Secrets trên server (Pi)

Secrets được lưu trong `backend/.env` trên Pi:

```bash
# Permissions an toàn
chmod 600 /opt/diecast360-backend/.env
chown pi:pi /opt/diecast360-backend/.env

# Verify chỉ owner đọc được
ls -la /opt/diecast360-backend/.env
# -rw------- 1 pi pi ...
```

---

## 5. Environment-specific configs

### 5.1 Development

```dotenv
# backend/.env (development)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/diecast360
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/diecast360
JWT_SECRET=dev-secret-change-in-prod-min32char
COOKIE_SECRET=dev-cookie-change-in-prod-32chars
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
# CORS_ALLOW_LAN=true  ← chỉ khi test từ LAN
```

```dotenv
# frontend/.env.local (development)
VITE_API_BASE_URL=
VITE_MAX_SPINNER_FRAMES=48
```

### 5.2 Staging

```dotenv
# backend/.env (staging)
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
DATABASE_URL=postgresql://...staging-pooler...
DIRECT_URL=postgresql://...staging...
JWT_SECRET=<random-32+-chars>
COOKIE_SECRET=<random-32+-chars>
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
FRONTEND_URL=https://staging.diecast360.pages.dev
BACKEND_URL=https://staging-api.yourdomain.com
STORAGE_DRIVER=local
UPLOAD_DIR=/opt/diecast360-staging/uploads
```

```dotenv
# frontend (Cloudflare Pages - staging env vars)
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api/v1
VITE_MAX_SPINNER_FRAMES=48
VITE_PUBLIC_CATALOG_SHOP_ID=<staging-shop-uuid>
```

### 5.3 Production

```dotenv
# backend/.env (production — trên Pi)
NODE_ENV=production
PORT=3000
HOST=127.0.0.1

# Neon DB
DATABASE_URL=postgresql://neondb_owner:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://neondb_owner:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Auth
JWT_SECRET=<production-random-64-hex>
COOKIE_SECRET=<production-random-64-hex>
COOKIE_SECURE=true
COOKIE_SAME_SITE=none  # frontend (Cloudflare Pages) khác domain với API

# CORS
FRONTEND_URL=https://diecast360.pages.dev
CORS_ALLOW_LAN=false

# URLs
BACKEND_URL=https://api.yourdomain.com
MEDIA_SIGNING_SECRET=<random-32+-chars>

# Storage
STORAGE_DRIVER=r2   # hoặc local nếu giữ disk
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=diecast360-media

# Upload
MAX_UPLOAD_MB=10
MAX_SPINNER_FRAMES=48
ALLOWED_MIME=image/jpeg,image/png,image/webp
```

```dotenv
# frontend (Cloudflare Pages - Production env vars)
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_MAX_SPINNER_FRAMES=48
VITE_PUBLIC_CATALOG_SHOP_ID=<production-shop-uuid>
```

### So sánh nhanh theo môi trường

| Biến | Dev | Staging | Production |
|------|-----|---------|-----------|
| `NODE_ENV` | `development` | `production` | `production` |
| `COOKIE_SECURE` | `false` | `true` | `true` |
| `COOKIE_SAME_SITE` | `lax` | `none` | `none` |
| `CORS_ALLOW_LAN` | `true`/`false` | `false` | `false` |
| `STORAGE_DRIVER` | `local` | `local`/`r2` | `r2` (khuyến nghị) |
| `DATABASE_URL` | localhost | Neon staging | Neon production |

---

## 6. Config validation on startup

Backend validate các biến bắt buộc khi khởi động. Thiếu biến hoặc giá trị không hợp lệ sẽ gây crash với message rõ ràng.

### Biến được validate tại bootstrap

| Biến | Kiểm tra |
|------|---------|
| `DATABASE_URL` | Tồn tại, format postgresql:// |
| `DIRECT_URL` | Tồn tại, format postgresql:// |
| `JWT_SECRET` | Tồn tại, min 32 ký tự |
| `COOKIE_SECRET` | Tồn tại, min 32 ký tự |
| `NODE_ENV` | `development` hoặc `production` (khi set) |
| `COOKIE_SECURE` | Boolean string khi `NODE_ENV=production` |
| `COOKIE_SAME_SITE` | `lax`, `strict`, hoặc `none` |
| `MAX_UPLOAD_MB` | Number nếu set |
| `MAX_SPINNER_FRAMES` | Number nếu set |

### Kiểm tra production safety

Khi `NODE_ENV=production`, backend từ chối khởi động nếu:

- `COOKIE_SAME_SITE=none` nhưng `COOKIE_SECURE` không phải `true`
- `CORS_ALLOW_LAN=true` (không được phép trong production)

```bash
# Ví dụ error message khi thiếu JWT_SECRET
Error: JWT_SECRET is required and must be at least 32 characters
    at ConfigService.validate (config/config.service.ts:42)
```

### Verify config sau deploy

```bash
# Kiểm tra app start không có config error
journalctl -u diecast360-api -n 50 --no-pager | grep -E "ERROR|WARN|Bootstrap"

# Health check (config ok → service up)
curl http://127.0.0.1:3000/api/v1/health
```

---

## 7. Rotation procedures

### 7.1 Rotate JWT_SECRET

> **Hệ quả:** Tất cả access tokens hiện tại sẽ invalid. Users phải login lại.

```bash
# 1. Generate secret mới
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo $NEW_SECRET

# 2. Update backend/.env trên Pi
# Thay JWT_SECRET=<old> bằng JWT_SECRET=$NEW_SECRET

# 3. Restart backend
sudo systemctl restart diecast360-api

# 4. Verify
curl http://127.0.0.1:3000/api/v1/health
```

**Graceful rotation** (tránh logout đột ngột — advanced):

- Giữ old secret trong biến `JWT_SECRET_LEGACY`
- Backend chấp nhận cả hai khi verify
- Sau 15 phút (TTL access token), tất cả tokens mới dùng secret mới
- Xóa `JWT_SECRET_LEGACY`

### 7.2 Rotate COOKIE_SECRET

> **Hệ quả:** Tất cả signed cookies sẽ invalid. Users phải login lại.

Tương tự JWT_SECRET — generate mới, update `.env`, restart.

### 7.3 Rotate MEDIA_SIGNING_SECRET

> **Hệ quả:** Tất cả signed media URLs hiện tại sẽ invalid trong TTL còn lại.

```bash
# Nếu không set MEDIA_SIGNING_SECRET riêng:
# → backend dùng JWT_SECRET → rotate JWT_SECRET là đủ

# Nếu có MEDIA_SIGNING_SECRET riêng:
# → Generate mới, update .env, restart
# → Links cũ sẽ 403 sau khi restart
# → Client nên refetch URLs sau 403
```

### 7.4 Rotate R2 Access Keys

```bash
# 1. Tạo API token mới trong Cloudflare R2 Console
# 2. Update backend/.env:
#    R2_ACCESS_KEY_ID=<new-key-id>
#    R2_SECRET_ACCESS_KEY=<new-secret>
# 3. Restart backend
sudo systemctl restart diecast360-api
# 4. Verify upload/download hoạt động
# 5. Revoke API token cũ trong Cloudflare Console
```

**Thứ tự quan trọng:** Phải có key mới hoạt động trước khi revoke key cũ.

### 7.5 Rotate Facebook Page Access Token

```bash
# 1. Lấy token mới từ Facebook Graph API Explorer
# 2. Exchange long-lived token:
#    GET https://graph.facebook.com/v21.0/oauth/access_token
#      ?grant_type=fb_exchange_token
#      &client_id={app-id}
#      &client_secret={app-secret}
#      &fb_exchange_token={short-lived-token}
# 3. Update backend/.env:
#    FACEBOOK_PAGE_ACCESS_TOKEN=<new-token>
# 4. Restart backend
```

### 7.6 Rotate Neon DB Password

```bash
# 1. Trong Neon Console: Settings > Connection String > Reset password
# 2. Copy connection strings mới (pooled + direct)
# 3. Update backend/.env trên Pi:
#    DATABASE_URL=postgresql://...new-password...
#    DIRECT_URL=postgresql://...new-password...
# 4. Update GitHub Secrets:
#    PRODUCTION_DATABASE_URL
#    PRODUCTION_DIRECT_URL
# 5. Restart backend
sudo systemctl restart diecast360-api
```

---

## 8. Troubleshooting config issues

### 8.1 `JWT_SECRET is required`

```bash
# Kiểm tra .env tồn tại
ls -la /opt/diecast360-backend/.env

# Kiểm tra giá trị
grep JWT_SECRET /opt/diecast360-backend/.env

# Nếu thiếu: thêm vào .env
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  >> /opt/diecast360-backend/.env

sudo systemctl restart diecast360-api
```

### 8.2 Cookie không được gửi / 401 sau login

**Checklist:**

```bash
# 1. Kiểm tra COOKIE_SECURE và COOKIE_SAME_SITE
grep -E "COOKIE_SECURE|COOKIE_SAME_SITE" /opt/diecast360-backend/.env

# 2. Nếu frontend và API khác domain, phải:
#    COOKIE_SECURE=true
#    COOKIE_SAME_SITE=none
#    → Backend phải chạy HTTPS

# 3. Kiểm tra HTTPS đang hoạt động
curl -v https://api.yourdomain.com/api/v1/health 2>&1 | grep -E "SSL|TLS|< HTTP"

# 4. Kiểm tra cookie trong browser DevTools
# Application > Cookies > api.yourdomain.com
# Cookie access_token phải có: Secure=true, SameSite=None
```

### 8.3 CORS blocked

```bash
# 1. Kiểm tra FRONTEND_URL
grep FRONTEND_URL /opt/diecast360-backend/.env
# Phải khớp CHÍNH XÁC với origin của frontend (kể cả http/https, port)

# 2. Test CORS manually
curl -v \
  -H "Origin: https://diecast360.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://api.yourdomain.com/api/v1/auth/login 2>&1 | grep -i "access-control"
# Phải thấy: Access-Control-Allow-Origin: https://diecast360.pages.dev

# 3. Nếu cần nhiều origins
# FRONTEND_URLS=https://preview.pages.dev,https://staging.pages.dev
```

### 8.4 `Can't reach database server` (ECONNREFUSED)

```bash
# Local dev
# 1. PostgreSQL chạy chưa?
sudo systemctl status postgresql
docker ps | grep postgres

# 2. Đúng host chưa?
# - App chạy trên host: dùng localhost
# - App chạy trong Docker: dùng service name (db)
# - App trong dev container: dùng db

# Production (Neon)
# 1. Test kết nối
psql "postgresql://neondb_owner:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" \
  -c "SELECT 1"

# 2. Kiểm tra sslmode
# Neon bắt buộc: sslmode=require
```

### 8.5 `VITE_API_BASE_URL` không hoạt động

```bash
# 1. Đảm bảo đã restart dev server sau khi thay đổi .env.local
pkill -f "vite"
pnpm dev

# 2. Kiểm tra giá trị trong browser console
# import.meta.env.VITE_API_BASE_URL

# 3. Production: rebuild sau khi thay đổi env
cd frontend
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 npm run build

# 4. Cloudflare Pages: set env var trong dashboard, trigger redeploy
```

### 8.6 `EACCES: permission denied` khi upload

```bash
# Kiểm tra UPLOAD_DIR
ls -la $(grep UPLOAD_DIR /opt/diecast360-backend/.env | cut -d= -f2)

# Fix permissions
UPLOAD_DIR=$(grep UPLOAD_DIR /opt/diecast360-backend/.env | cut -d= -f2)
mkdir -p "$UPLOAD_DIR"
chmod 755 "$UPLOAD_DIR"
chown pi:pi "$UPLOAD_DIR"

sudo systemctl restart diecast360-api
```

### 8.7 Sharp build errors sau `npm ci`

```bash
# Rebuild native module
cd /opt/diecast360-backend
npm rebuild sharp

# Nếu vẫn lỗi, force rebuild
npm install --ignore-scripts=false sharp

# Verify
node -e "require('sharp'); console.log('sharp ok')"
```

### 8.8 Migration lỗi với Neon Pooler

```
Error: prepared statement "s0" already exists
# Hoặc
Error: SSL connection is required
```

```bash
# LUÔN dùng DIRECT_URL cho prisma migrate deploy
DIRECT_URL="postgresql://...direct-url..." \
DATABASE_URL="postgresql://...direct-url..." \
npx prisma migrate deploy

# Không dùng URL pooler (-pooler hostname) cho Prisma CLI
```

---

## Tài liệu liên quan

- [`docs/ENV.md`](../../ENV.md) — Biến môi trường (nguồn truth chính thức)
- [`docs/COOKIE_AUTH.md`](../../COOKIE_AUTH.md) — Cookie/CORS chi tiết
- [`docs/DEPLOYMENT.md`](../../DEPLOYMENT.md) — Deployment overview
- [`docs/project-docs/group5-devops/26_dev_environment_setup.md`](26_dev_environment_setup.md) — Dev setup
- [`docs/project-docs/group5-devops/29_deployment_guide.md`](29_deployment_guide.md) — Deployment guide

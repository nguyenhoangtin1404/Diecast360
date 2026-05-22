---
title: "Dev Environment Setup Guide"
version: "1.0"
date: "2026-05-22"
author: "DevOps Team"
---

# File 26 — Hướng dẫn cài đặt môi trường phát triển (Development Environment Setup)

## Mục lục

1. [Prerequisites](#1-prerequisites)
2. [Clone & cài đặt dependencies](#2-clone--cài-đặt-dependencies)
3. [Cài đặt Database](#3-cài-đặt-database)
4. [Cấu hình file môi trường](#4-cấu-hình-file-môi-trường)
5. [Khởi động dev servers](#5-khởi-động-dev-servers)
6. [Checklist xác nhận setup](#6-checklist-xác-nhận-setup)
7. [Xử lý sự cố thường gặp](#7-xử-lý-sự-cố-thường-gặp)
8. [Khuyến nghị IDE](#8-khuyến-nghị-ide)
9. [Optional: Docker Compose cho PostgreSQL local](#9-optional-docker-compose-cho-postgresql-local)

---

## 1. Prerequisites

Trước khi bắt đầu, đảm bảo máy đã cài:

| Phần mềm | Phiên bản tối thiểu | Kiểm tra |
|----------|--------------------|----|
| Node.js | LTS (20.x hoặc 22.x) | `node --version` |
| pnpm | 9.x trở lên | `pnpm --version` |
| Git | 2.x | `git --version` |
| PostgreSQL | 16.x (hoặc dùng Docker) | `psql --version` |
| Docker (optional) | 24.x | `docker --version` |

### Cài Node.js (nếu chưa có)

```bash
# Dùng nvm (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Cài pnpm

```bash
npm install -g pnpm
# Hoặc dùng corepack (Node 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

### Cài PostgreSQL local (nếu không dùng Docker)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-16 postgresql-client-16
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Windows:**
- Tải installer từ https://www.postgresql.org/download/windows/
- Hoặc dùng Docker (xem mục 9)

---

## 2. Clone & cài đặt dependencies

```bash
# Clone repository
git clone https://github.com/<org>/diecast360.git
cd diecast360

# Cài đặt toàn bộ workspace
pnpm install
```

> **Lưu ý:** `pnpm install` tại root sẽ cài dependencies cho cả `backend/` và `frontend/` nhờ `pnpm-workspace.yaml`.

Cấu trúc thư mục sau khi clone:

```
diecast360/
├── backend/         # NestJS 11
├── frontend/        # React 19 + Vite 7
├── docs/
├── CLAUDE.md
└── pnpm-workspace.yaml
```

---

## 3. Cài đặt Database

### Phương án A: PostgreSQL cài trực tiếp trên máy

```bash
# Kết nối vào PostgreSQL với user postgres
sudo -u postgres psql

# Tạo database
CREATE DATABASE diecast360;

# Tạo user (nếu muốn dùng user riêng)
CREATE USER diecast360_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE diecast360 TO diecast360_user;

# Thoát
\q
```

### Phương án B: PostgreSQL qua Docker (xem mục 9)

```bash
# Khởi động chỉ service db
docker compose up -d db
```

### Chạy migrations và seed data

```bash
# Chạy migrations
cd backend
pnpm prisma migrate dev

# Seed dữ liệu mẫu (categories, etc.)
pnpm prisma db seed

# Hoặc từ root workspace
pnpm --filter ./backend exec prisma migrate dev
pnpm --filter ./backend exec prisma db seed
```

### Tạo tài khoản admin lần đầu

```bash
# Từ thư mục backend
pnpm create:admin:quick -- admin@example.com your-secure-password

# Hoặc từ root
pnpm --filter ./backend create:admin:quick -- admin@example.com your-secure-password
```

### Tạo thư mục upload

```bash
mkdir -p backend/uploads
```

---

## 4. Cấu hình file môi trường

### 4.1 Backend — `backend/.env`

```bash
cp backend/.env.example backend/.env
```

Chỉnh sửa `backend/.env` với nội dung tối thiểu:

```dotenv
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diecast360"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/diecast360"

# App
NODE_ENV=development
PORT=3000

# Auth (bắt buộc — tối thiểu 32 ký tự)
JWT_SECRET=change-me-to-a-random-secret-that-is-at-least-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Cookie
COOKIE_SECRET=change-me-to-another-random-secret-32-chars
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# Upload
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=10
MAX_SPINNER_FRAMES=48
ALLOWED_MIME=image/jpeg,image/png,image/webp

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Storage (local mặc định)
STORAGE_DRIVER=local
```

> **Bảo mật:** `JWT_SECRET` và `COOKIE_SECRET` phải là chuỗi ngẫu nhiên ít nhất 32 ký tự. Dùng lệnh sau để tạo:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4.2 Frontend — `frontend/.env.local`

```bash
cp frontend/.env.example frontend/.env.local
```

Nội dung tối thiểu:

```dotenv
# Bỏ trống hoặc "auto" → frontend gọi same-origin /api/v1 qua Vite proxy
VITE_API_BASE_URL=

# Số frame tối đa cho spinner (phải khớp hoặc nhỏ hơn MAX_SPINNER_FRAMES backend)
VITE_MAX_SPINNER_FRAMES=48

# Shop UUID/slug cho public catalog (dùng khi single-tenant)
VITE_PUBLIC_CATALOG_SHOP_ID=
```

### 4.3 Vite Proxy (tự động)

Vite proxy được cấu hình trong `frontend/vite.config.ts` — các request `/api/v1/*` tự động forward về `http://localhost:3000`. Không cần cấu hình thêm khi `VITE_API_BASE_URL` để trống.

---

## 5. Khởi động dev servers

### Khởi động cùng lúc (từ root)

```bash
pnpm dev
```

### Khởi động riêng lẻ (hai terminal)

**Terminal 1 — Backend:**
```bash
cd backend
pnpm start:dev
# Hoặc từ root:
pnpm run dev:backend
```

**Terminal 2 — Frontend:**
```bash
cd frontend
pnpm dev
# Hoặc từ root:
pnpm run dev:frontend
```

### Kiểm tra ports

| Dịch vụ | URL |
|---------|-----|
| Backend API | http://localhost:3000 |
| Health check | http://localhost:3000/api/v1/health |
| Frontend (Vite) | http://localhost:5173 |
| Admin UI | http://localhost:5173/admin/login |
| Prisma Studio | http://localhost:5555 (sau `pnpm prisma studio`) |
| PostgreSQL | localhost:5432 |

---

## 6. Checklist xác nhận setup

Sau khi khởi động, xác nhận các điểm sau:

- [ ] **Health endpoint**: `curl http://localhost:3000/api/v1/health` trả về `{"ok":true,"data":{"ok":true,"status":"healthy"},"message":""}`
- [ ] **Đăng nhập admin**: Truy cập http://localhost:5173/admin/login, đăng nhập thành công với tài khoản đã tạo
- [ ] **API hoạt động**: Sau khi login, truy cập http://localhost:5173/admin/items — danh sách items load (có thể rỗng)
- [ ] **Upload test**: Vào admin > thêm item > upload ảnh < 10MB, xác nhận ảnh hiển thị
- [ ] **Prisma Studio**: `pnpm --filter ./backend exec prisma studio` mở http://localhost:5555, có thể duyệt bảng `User`, `Item`
- [ ] **Database seed**: Bảng `Category` có dữ liệu sau `pnpm --filter ./backend exec prisma db seed`

---

## 7. Xử lý sự cố thường gặp

### 7.1 Port conflicts

**Triệu chứng:** `Error: listen EADDRINUSE :::3000`

```bash
# Tìm process đang dùng port 3000
# Linux/macOS
lsof -ti:3000 | xargs kill -9
# Windows (PowerShell)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Hoặc đổi port trong `backend/.env`:
```dotenv
PORT=3001
```

### 7.2 Prisma migration errors

**Lỗi:** `Error: P1001: Can't reach database server`
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql
# Hoặc Docker
docker ps | grep postgres
# Kiểm tra kết nối
psql "postgresql://postgres:postgres@localhost:5432/diecast360" -c "SELECT 1"
```

**Lỗi:** `Migration failed: relation "xxx" already exists`
```bash
# Reset database hoàn toàn (DEV ONLY — mất data)
cd backend
pnpm prisma migrate reset
```

**Lỗi:** `Drift detected`
- Không được chỉnh sửa migration đã apply. Tạo migration mới:
```bash
pnpm prisma migrate dev --name fix_xxx
```

### 7.3 CORS issues

**Triệu chứng:** `Access-Control-Allow-Origin` bị từ chối trong browser console.

Kiểm tra `backend/.env`:
```dotenv
FRONTEND_URL=http://localhost:5173   # phải khớp chính xác (kể cả port)
```

Nếu truy cập qua IP LAN (ví dụ test trên điện thoại):
```dotenv
CORS_ALLOW_LAN=true
# Hoặc thêm origin cụ thể:
FRONTEND_URLS=http://192.168.1.10:5173
```

### 7.4 Sharp native binary build failures

**Triệu chứng:** `Error: Something went wrong installing the "sharp" module`

```bash
# Rebuild sharp cho platform hiện tại
cd backend
npm rebuild sharp
# Hoặc
pnpm rebuild sharp

# Nếu vẫn lỗi, xóa và cài lại
rm -rf node_modules/.cache
pnpm install --force
```

Trên máy RAM thấp (< 1GB), thêm vào `backend/.env`:
```dotenv
# Sharp config cho môi trường low-RAM
SHARP_CACHE=false
SHARP_CONCURRENCY=1
```

Trong code, đảm bảo `sharp.cache(false)` và `sharp.concurrency(1)` được gọi trước khi xử lý ảnh.

### 7.5 UPLOAD_DIR permission issues

**Triệu chứng:** `EACCES: permission denied, open './uploads/...'`

```bash
# Tạo thư mục và cấp quyền
mkdir -p backend/uploads
chmod 755 backend/uploads

# Linux: đảm bảo user hiện tại sở hữu thư mục
chown -R $(whoami) backend/uploads
```

Trong `backend/.env`, dùng đường dẫn tuyệt đối nếu cần:
```dotenv
UPLOAD_DIR=/home/user/diecast360/backend/uploads
```

### 7.6 Cookie không được gửi (SameSite config)

**Triệu chứng:** Đăng nhập thành công nhưng request tiếp theo báo 401.

**Nguyên nhân thường gặp:**

1. Frontend và API khác origin (khác port hoặc domain):
```dotenv
# backend/.env
COOKIE_SAME_SITE=none
COOKIE_SECURE=true  # bắt buộc khi SameSite=none
```

2. Dev local (same origin qua Vite proxy):
```dotenv
# backend/.env
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
```

3. Kiểm tra DevTools > Application > Cookies — cookie `access_token` và `refresh_token` phải xuất hiện sau login.

### 7.7 `JWT_SECRET is required` khi khởi động

```bash
# Kiểm tra file .env tồn tại và có giá trị
cat backend/.env | grep JWT_SECRET
# Phải có ít nhất 32 ký tự
```

### 7.8 `pnpm: command not found`

```bash
npm install -g pnpm
# Thêm vào PATH nếu cần
export PATH="$HOME/.local/share/pnpm:$PATH"
```

---

## 8. Khuyến nghị IDE

### VS Code (khuyến nghị)

**Extensions cần thiết:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode-remote.remote-containers",
    "PKief.material-icon-theme"
  ]
}
```

Cài nhanh:
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension Prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
```

**`frontend/.vscode/settings.json`** (tạo nếu chưa có):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

**`backend/.vscode/settings.json`**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### ESLint & Prettier

ESLint và Prettier đã được cấu hình trong từng package. Chạy lint:

```bash
# Backend
cd backend && pnpm lint

# Frontend
cd frontend && pnpm lint

# Fix tự động
cd backend && pnpm lint --fix
cd frontend && pnpm lint --fix
```

> **Lưu ý:** Frontend có một số pre-existing lint errors — không coi đây là regression, nhưng không thêm lỗi mới.

---

## 9. Optional: Docker Compose cho PostgreSQL local

Dự án cung cấp `docker-compose.yml` tại root. Để chỉ chạy PostgreSQL qua Docker:

```bash
# Khởi động chỉ service db
docker compose up -d db

# Xem logs
docker compose logs -f db

# Dừng
docker compose stop db

# Xóa hoàn toàn (kể cả data)
docker compose down -v
```

**`docker-compose.yml`** (service db):
```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: diecast360
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Khi dùng Docker cho DB, `backend/.env` vẫn dùng `localhost`:
```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diecast360"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/diecast360"
```

### Full stack với Docker Compose

```bash
# Khởi động toàn bộ stack (db + backend + frontend)
cp .env.example .env           # hoặc docker-compose.override.yml.example
docker compose up --build

# Chỉ rebuild một service
docker compose up --build backend
```

> Khi mount code vào container, thay đổi `package.json` lớn cần rebuild image: `docker compose build --no-cache backend`.

---

## Tài liệu liên quan

- [`docs/ENV.md`](../../ENV.md) — Tham chiếu đầy đủ biến môi trường
- [`docs/DEV.md`](../../DEV.md) — Hướng dẫn phát triển nâng cao
- [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md) — Kiến trúc hệ thống
- [`docs/API_CONTRACT.md`](../../API_CONTRACT.md) — API contract
- [`docs/COOKIE_AUTH.md`](../../COOKIE_AUTH.md) — Cookie/CORS chi tiết

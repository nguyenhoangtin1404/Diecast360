# Triển khai production (tóm tắt kiến trúc)

Tài liệu mô tả phương án: **frontend tĩnh** (Vercel hoặc host miễn phí tương đương), **backend NestJS** trên **Raspberry Pi 4 (2 GB)** không có IP tĩnh, **PostgreSQL trên Neon** (free tier). Checklist chi tiết và thảo luận: GitHub issue **[#111](https://github.com/nguyenhoangtin1404/Diecast360/issues/111)**.

Biến môi trường đầy đủ: [`ENV.md`](ENV.md). Cookie / CORS khi frontend và API khác domain: [`COOKIE_AUTH.md`](COOKIE_AUTH.md).

---

## Sơ đồ luồng

```text
Trình duyệt
    → CDN (Vercel / Cloudflare Pages / …) — static Vite build
    → HTTPS API (hostname public, ví dụ api.example.com)
    → Cloudflare Tunnel (cloudflared trên Pi) → http://127.0.0.1:3000
    → Neon PostgreSQL (pooler cho runtime)
```

---

## 1. Neon (database)

1. Tạo project trên [Neon](https://neon.tech), tạo database (thường có sẵn `neondb`).
2. Lấy hai URL:
   - **Pooled** (host có `-pooler`) → `DATABASE_URL` trên Pi (runtime ứng dụng).
   - **Direct** (host không pooler) → `DIRECT_URL` trên Pi (Prisma `migrate`, introspect).
3. Áp migration lên Neon (một lần hoặc mỗi khi có migration mới), từ máy dev có env trỏ Neon:

   ```bash
   cd backend && npm ci && npx prisma migrate deploy
   ```

   (Hoặc `pnpm` nếu bạn dùng monorepo pnpm; khớp với lockfile trong `backend/`.)

4. Không commit URL có mật khẩu; chỉ đặt trong env trên Pi hoặc secret CI.

---

## 2. Frontend (Vercel hoặc thay thế)

### Vercel (mặc định dễ với Vite)

- Import repository GitHub → **Root Directory**: `frontend`.
- **Build command** / **Output**: theo `frontend/package.json` (thường build ra `dist`).
- Biến build (Production): `VITE_API_BASE_URL=https://<hostname-api-cua-ban>/api/v1` (HTTPS, khớp prefix `/api/v1`).

### Cloudflare Pages (thường được xem là lựa chọn free/CDN mạnh)

- Kết nối repo, build từ `frontend`, output `dist`.
- Cấu hình SPA / rewrite nếu React Router cần fallback về `index.html` (theo tài liệu Pages).

### Netlify

- Tương tự: root `frontend`, publish `dist`, env build giống Vercel.

Giới hạn free tier và điều khoản sử dụng thương mại — kiểm tra trang pricing của từng nhà cung cấp tại thời điểm triển khai.

---

## 3. Raspberry Pi — backend, không static IP

### Khuyến nghị: Cloudflare Tunnel

1. Tài khoản Cloudflare (miễn phí), có hostname (subdomain hoặc domain riêng).
2. Cài [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) trên Pi (ARM64).
3. Tạo tunnel, ánh xạ public hostname (ví dụ `api.example.com`) → service nội bộ `http://127.0.0.1:3000`.
4. Nest chỉ cần lắng nghe `127.0.0.1:3000` (hoặc `0.0.0.0` nếu tunnel trỏ đúng interface); HTTPS do Cloudflare xử lý phía edge.

Lợi ích: không cần mở cổng inbound trên router, không phụ thuộc IP tĩnh nhà mạng.

### Pi 4 (2 GB): gợi ý vận hành

- Dùng OS 64-bit; Node LTS (khớp `engines` trong `frontend/package.json` / thực tế build backend).
- **Chỉ chạy backend trên Pi**; database để trên Neon để tránh Postgres + Nest tranh RAM.
- Tạo thư mục `UPLOAD_DIR` trên ổ đủ dung lượng (USB nếu cần); giới hạn `MAX_UPLOAD_MB` hợp lý — xử lý ảnh (Sharp) có thể tốn RAM khi upload đồng thời.
- Cài dependency và build:

  ```bash
  cd /path/to/Diecast360/backend
  npm ci --omit=dev
  npm run build
  ```

- Chạy production: `node dist/main` (hoặc `npm run start:prod`) dưới **systemd** để tự khởi động lại và ghi log (`journalctl`).

Ví dụ unit systemd (chỉnh `User`, `WorkingDirectory`, `EnvironmentFile`):

```ini
[Unit]
Description=Diecast360 API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Diecast360/backend
EnvironmentFile=/home/pi/Diecast360/backend/.env
ExecStart=/usr/bin/node dist/main
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 4. Biến môi trường tối thiểu (tóm tắt)

| Nơi | Biến | Ghi chú |
|-----|------|---------|
| **Pi / `backend/.env`** | `DATABASE_URL`, `DIRECT_URL` | Neon pooled + direct — xem [`ENV.md`](ENV.md) |
| **Pi** | `JWT_SECRET`, `COOKIE_SECRET` | Đủ entropy, không tái sử dụng từ dev |
| **Pi** | `FRONTEND_URL` | Origin chính xác của frontend (ví dụ `https://xxx.vercel.app`) — CORS |
| **Pi** | `PUBLIC_BASE_URL` | URL public của API (HTTPS), dùng ghép link ảnh/thumbnail nếu cần |
| **Pi** | `COOKIE_SECURE=true`, `COOKIE_SAME_SITE` | Production HTTPS — xem [`ENV.md`](ENV.md) |
| **Pi** | `UPLOAD_DIR` | Đường dẫn tuyệt đối trên Pi, thư mục tồn tại và ghi được |
| **Vercel / Pages** (build) | `VITE_API_BASE_URL` | `https://<api-host>/api/v1` |

Chi tiết Facebook, OpenAI, Pinecone: tùy tính năng bật — vẫn trong [`ENV.md`](ENV.md).

---

## 5. Thứ tự triển khai đề xuất

1. Neon: tạo project, gán `DATABASE_URL` / `DIRECT_URL`, chạy `prisma migrate deploy`.
2. Pi: cài Node, clone repo, tạo `backend/.env`, build, chạy thử local trên `127.0.0.1:3000`.
3. Cloudflare Tunnel: public HTTPS → port 3000 trên Pi.
4. Cập nhật `VITE_API_BASE_URL` trên host frontend, deploy lại frontend.
5. Kiểm tra đăng nhập, upload nhỏ, catalog; đọc [`COOKIE_AUTH.md`](COOKIE_AUTH.md) nếu cookie cross-site lỗi.

---

## 6. CI và migration

Workflow CI mặc định: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Nếu repository có thêm workflow migrate Neon kích hoạt sau CI xanh trên `main`, cấu hình secret `NEON_DATABASE_URL` (và tùy chọn `NEON_DIRECT_URL`) trong GitHub Actions — không ghi secret vào git.

---

## 7. Bảo mật và vận hành

- Xoay mật khẩu Neon nếu từng lộ URL trong chat / log công khai.
- Sao lưu định kỳ thư mục upload trên Pi; Neon có backup theo gói dịch vụ.
- Cập nhật code: `git pull` trên Pi → `npm ci --omit=dev` → `npm run build` → `systemctl restart …`.

# Hướng dẫn phát triển local (Diecast360)

Tài liệu này bổ sung [`README.md`](../README.md): nhiều luồng chạy dev, cổng dịch vụ, Prisma, test và xử lý sự cố thường gặp. Biến môi trường đầy đủ: [`docs/ENV.md`](ENV.md). Triển khai production (Vercel/Pages, Pi, Neon): [`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

## Chọn luồng dev

| Luồng | Khi nào dùng | Postgres | Backend / Frontend chạy ở đâu |
|--------|----------------|----------|----------------------------------|
| **A. Native (pnpm)** | Máy có Node + pnpm, muốn debug nhanh trên host | Cài local hoặc chỉ chạy `docker compose up -d db` | Host (`pnpm dev`) |
| **B. Docker Compose full** | Muốn stack đồng nhất, ít cài đặt trên host | Container `db` trong `docker-compose.yml` | Container `backend` / `frontend` |
| **C. Dev Container** | VS Code / GitHub Codespaces | Container `db` trong `.devcontainer/docker-compose.yml` | Trong container `app` (`pnpm dev`) |

URL mặc định:

| Dịch vụ | URL |
|---------|-----|
| API (Nest) | `http://localhost:3000` — REST có prefix `/api/v1` |
| UI (Vite) | `http://localhost:5173` |
| Postgres (map ra host) | `localhost:5432` — DB `diecast360`, user/pass thường là `postgres`/`postgres` (theo compose) |

---

## A. Native: Postgres + `pnpm dev`

### A1. Chỉ dựng Postgres bằng Docker

Từ thư mục gốc repo:

```bash
docker compose up -d db
```

Đợi healthcheck xong. Trong `backend/.env` dùng host **`localhost`**:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diecast360"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/diecast360"
```

### A2. Cấu hình `.env`

1. `cp backend/.env.example backend/.env` — chỉnh DB, `JWT_SECRET`, `COOKIE_SECRET` (bắt buộc cho auth ổn định). Nên thêm `REFRESH_TOKEN_EXPIRES_IN` nếu muốn khớp [`docs/ENV.md`](ENV.md) (file `.env.example` của backend có thể chưa liệt kê hết; tham chiếu bảng trong ENV).
2. `cp frontend/.env.example frontend/.env` — tối thiểu:

   - `VITE_API_BASE_URL=http://localhost:3000/api/v1`  
   - Hoặc bỏ trống / đặt `auto` để dùng logic mặc định trong `frontend/src/config/api.ts` (suy ra host từ `window.location` + cổng `3000`).

### A3. Cài package & migration

```bash
pnpm install
pnpm --filter ./backend exec prisma migrate dev
```

Tùy chọn seed category:

```bash
pnpm --filter ./backend exec prisma db seed
```

Thư mục upload (đường dẫn tương đối từ `backend/`):

```bash
mkdir -p backend/uploads
```

### A4. Tạo tài khoản admin (lần đầu)

```bash
pnpm --filter ./backend create:admin:quick
```

Mặc định script dùng email/password mẫu trong code; **nên truyền email/password riêng**:

```bash
pnpm --filter ./backend create:admin:quick -- you@example.com your-secure-password
```

Đăng nhập admin UI: `http://localhost:5173/admin/login` (theo log script).

### A5. Chạy dev

```bash
pnpm dev
```

Tách terminal nếu cần:

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

---

## B. Docker Compose (full stack)

Phù hợp khi muốn backend + frontend + DB cùng lúc trong Docker.

1. `cp .env.example .env` — **bắt buộc** đặt `JWT_SECRET` và `COOKIE_SECRET` (Compose không cho giá trị mặc định an toàn).
2. Hoặc: `cp docker-compose.override.yml.example docker-compose.override.yml` (chỉ dev cá nhân, secret yếu).
3. `docker compose up --build`

Ghi chú:

- Compose gán `VITE_API_BASE_URL` cho service frontend; API mặc định `http://localhost:3000/api/v1` từ trình duyệt host.
- Code được mount vào container; dependency nằm trong volume `node_modules` của image — nếu đổi `package.json` lớn, có thể cần build lại image.

---

## C. Dev Container (VS Code / Codespaces)

Service Postgres tên **`db`**. Khi chạy **backend trong container `app`**, trong `backend/.env` phải trỏ host **`db`**, không phải `localhost`:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/diecast360"
DIRECT_URL="postgresql://postgres:postgres@db:5432/diecast360"
```

`postCreateCommand` trong `.devcontainer/devcontainer.json` chạy `pnpm install` và `prisma migrate dev --name init`. Nếu migration đã tồn tại và lệnh báo lỗi tên trùng, chạy tay:

```bash
pnpm --filter ./backend exec prisma migrate dev
```

Sau đó `pnpm dev` như luồng native.

Port forward: **3000** (API), **5432** (Postgres) — có thể dùng client GUI trên máy host kết nối `localhost:5432`.

---

## Truy cập UI từ thiết bị khác trong LAN (Vite `--host`)

Frontend chạy `vite --host`, nên có thể mở UI qua IP máy (ví dụ `http://192.168.1.10:5173`). Backend cần chấp nhận CORS từ origin đó:

- Đặt `FRONTEND_URL` (và nếu cần `FRONTEND_URLS`) khớp origin thực tế, **hoặc**
- Bật `CORS_ALLOW_LAN=true` trong `backend/.env` (chỉ dev; xem `backend/src/main.ts`).

`VITE_API_BASE_URL`: nếu trình duyệt không chạy trên cùng máy với API, cần URL API mà thiết bị đó truy cập được (ví dụ `http://192.168.1.10:3000/api/v1`), không chỉ `localhost`.

---

## Lệnh Prisma hữu ích

Chạy từ root (khuyến nghị):

```bash
pnpm --filter ./backend exec prisma studio
pnpm --filter ./backend exec prisma migrate dev
pnpm --filter ./backend exec prisma migrate deploy   # CI / prod
```

---

## Test & chất lượng

| Mục | Lệnh |
|-----|------|
| Backend unit | `pnpm --filter ./backend test` |
| Frontend unit | `pnpm --filter ./frontend test:unit` |
| Frontend E2E (Playwright) | `pnpm --filter ./frontend test:e2e` |
| ESLint backend | `pnpm --filter ./backend lint` |
| ESLint frontend | `pnpm --filter ./frontend lint` |

---

## Script backend đáng chú ý (từ `backend/package.json`)

| Script | Mô tả ngắn |
|--------|------------|
| `create:admin` | Tạo admin (script đầy đủ hơn `create-admin.ts`) |
| `create:admin:quick` | Tạo admin nhanh |
| `reset:admin:password` | Đổi mật khẩu admin |
| `list:users` | Liệt kê user |
| `index:items` | Index item (tìm kiếm / vector — xem code) |
| `vector:process-queue` | Xử lý hàng đợi vector |

Chạy qua pnpm filter, ví dụ:

```bash
pnpm --filter ./backend run list:users
```

---

## Xử lý sự cố

### `Can't reach database server` / ECONNREFUSED

- Postgres chưa chạy hoặc sai host: trong Docker **db** dùng hostname `db`; trên host dùng `localhost`.
- Kiểm tra cổng 5432 không bị process khác chiếm.

### CORS / cookie khi đăng nhập

- `FRONTEND_URL` phải khớp origin UI (kể cả `http` vs `https`, cổng).
- Chi tiết cookie: [`docs/COOKIE_AUTH.md`](COOKIE_AUTH.md).

### Frontend gọi sai API

- Kiểm tra `VITE_API_BASE_URL` trong `frontend/.env` (chỉ áp dụng lúc **khởi động** Vite; đổi env cần restart `pnpm dev`).

### `JWT_SECRET is required` khi `docker compose up`

- Tạo `.env` từ `.env.example` hoặc dùng `docker-compose.override.yml.example` như README.

### `pnpm install` / Prisma lỗi phiên bản Node

- Tuân thủ `engines` trong `frontend/package.json` và dùng Node tương thích (Dev Container hiện Node 24).

---

## Tài liệu liên quan

- [`docs/ENV.md`](ENV.md) — biến môi trường
- [`docs/API_CONTRACT.md`](API_CONTRACT.md) — API
- [`../docker-compose.yml`](../docker-compose.yml) — dịch vụ & env Compose

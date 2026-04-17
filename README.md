# Diecast360

Full-stack ứng dụng quản lý kho xe diecast tỉ lệ 1:64: media thường + viewer 360°, catalog công khai, luồng hỗ trợ đăng bài (caption / link / SEO). Đặc tả triển khai tham chiếu: [`DIECAST360_AI_MASTER_GUIDE.md`](DIECAST360_AI_MASTER_GUIDE.md).

## Mục lục

- [Tóm tắt khả năng](#tóm-tắt-khả-năng)
- [Cấu trúc repo](#cấu-trúc-repo)
- [Stack & quy ước API](#stack--quy-ước-api)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt & chạy dev](#cài-đặt--chạy-dev)
- [Hướng dẫn dev chi tiết](docs/DEV.md)
- [Docker Compose (full stack)](#docker-compose-full-stack)
- [Dev Container](#dev-container)
- [Cơ sở dữ liệu](#cơ-sở-dữ-liệu)
- [Tài liệu kỹ thuật](#tài-liệu-kỹ-thuật)
- [Quy tắc thay đổi](#quy-tắc-thay-đổi)
- [Phụ lục: ước lượng chi phí nội dung](#phụ-lục-ước-lượng-chi-phí-nội-dung)

## Tóm tắt khả năng

| Nhóm | Mô tả ngắn |
|------|------------|
| **Sản phẩm** | CRUD item, trạng thái `con_hang \| giu_cho \| da_ban`, cờ `is_public`, soft delete. |
| **Media** | Nhiều ảnh, thumbnail, cover, sắp xếp; spinner 360° (nhiều spin set, một default; khuyến nghị 24 frame, tối đa 36). |
| **Catalog công khai** | `GET /api/v1/public/items`, `GET /api/v1/public/items/:id` — JWT **tùy chọn** (`OptionalJwtAuthGuard`). Không token: trả mọi item `is_public` (không lọc `shop_id`). Có token hợp lệ: có thể scope theo shop đang chọn (`active_shop_id` trên payload JWT). Token sai/hết hạn: `401`. |
| **Đa shop & quản trị** | Super admin: quản lý shop, thành viên, mặt hàng; nhật ký **audit** (MVP) cho thao tác nhạy cảm. Chi tiết route: `docs/API_CONTRACT.md`. |
| **Xác thực** | Access + refresh JWT, revoke qua refresh token; cookie-based session aspects — xem `docs/COOKIE_AUTH.md`; route admin kèm guard + kiểm tra vai trò. |
| **Social / AI / tìm kiếm** | Copy caption + link; semantic search (Pinecone tùy chọn); OpenAI cho gợi ý / import; gợi ý SEO (xem guide). |

## Cấu trúc repo

```
pnpm-workspace.yaml   Monorepo: packages backend + frontend
backend/              NestJS + Prisma + PostgreSQL
frontend/             React 19 + Vite 7 + TanStack Query + Tailwind CSS
docs/                 Domain, API, schema, môi trường
uploads/              File tĩnh upload (dev); production qua storage / reverse proxy
.devcontainer/        Codespace / VS Code Dev Container (Node + Postgres)
docker-compose.yml    Postgres + backend + frontend (Dockerfile dev targets)
```

## Stack & quy ước API

- **Monorepo:** [pnpm](https://pnpm.io/) (`pnpm install` ở root; script `pnpm dev` chạy song song backend + frontend nhờ `concurrently`).
- **Backend:** Node.js, NestJS 11, Prisma 6, PostgreSQL, Sharp, upload local trong dev; tùy chọn OpenAI, Pinecone.
- **Frontend:** React 19, Vite 7, React Router 7, TanStack Query, Tailwind CSS 3, Radix Slot; test: Vitest + Playwright.
- **API:** prefix toàn cục `/api/v1`; payload JSON **snake_case**; envelope `{ ok, data, message }` hoặc `{ ok, error, message }` ([`docs/ERROR_HANDLING.md`](docs/ERROR_HANDLING.md)).

## Yêu cầu môi trường

- **Node.js:** theo `frontend/package.json` → `>=20.19.0 <21` **hoặc** `>=22.12.0` (Dev Container hiện dùng image Node **24**).
- **pnpm** (lockfile: `pnpm-lock.yaml` ở root).
- **PostgreSQL** — local, Docker (`docker-compose.yml`), hoặc managed (ví dụ Neon).

## Cài đặt & chạy dev

**Hướng dẫn đầy đủ** (nhiều luồng: native / Compose / Dev Container, Postgres chỉ Docker, LAN, Prisma, test, xử lý sự cố): [`docs/DEV.md`](docs/DEV.md).

### 1. Chuẩn bị biến môi trường

- **Chạy backend/frontend trên máy (không Docker app):**  
  - `cp backend/.env.example backend/.env` và chỉnh `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `COOKIE_SECRET`, v.v.  
  - `cp frontend/.env.example frontend/.env` — tối thiểu `VITE_API_BASE_URL=http://localhost:3000/api/v1` (hoặc để trống / `auto` để frontend tự suy ra host mặc định theo `frontend/src/config/api.ts`).
- **Tham chiếu gộp cho Docker / tài liệu:** [`/.env.example`](.env.example) và chi tiết trong [`docs/ENV.md`](docs/ENV.md).

### 2. Cài dependency (root)

```bash
pnpm install
```

(`postinstall` của backend chạy `prisma generate`.)

### 3. Database & seed (lần đầu)

```bash
pnpm --filter ./backend exec prisma migrate dev
pnpm --filter ./backend exec prisma db seed   # tùy chọn: seed categories
mkdir -p backend/uploads
pnpm --filter ./backend create:admin:quick
```

### 4. Chạy song song API + UI

```bash
pnpm dev
```

- API: `http://localhost:3000` (REST dưới `/api/v1`).
- UI: `http://localhost:5173` (Vite `--host` nên có thể truy cập qua LAN).

Chạy riêng từng package:

```bash
pnpm run dev:backend    # tương đương backend: nest start --watch
pnpm run dev:frontend   # tương đương frontend: vite --host
```

## Docker Compose (full stack)

Chạy Postgres 16, backend và frontend trong container (bind mount mã nguồn).

1. `cp .env.example .env` và đặt **`JWT_SECRET`**, **`COOKIE_SECRET`** (Compose **bắt buộc** hai biến này; không có giá trị mặc định an toàn).
2. Hoặc cho dev nhanh: `cp docker-compose.override.yml.example docker-compose.override.yml` (placeholder yếu — **chỉ máy cá nhân**).
3. `docker compose up --build`

- DB: `postgresql://postgres:postgres@localhost:5432/diecast360` (map port `5432`).
- Frontend nhận `VITE_API_BASE_URL` (mặc định trỏ tới `http://localhost:3000/api/v1`).

Trong container backend vẫn dùng `npm run start:dev` / frontend `npm run dev` theo image build; mã nguồn host được mount vào container.

## Dev Container

Thư mục [`.devcontainer/`](.devcontainer/): service `app` (Node) + `db` (Postgres, volume `postgres-data`). `devcontainer.json` forward port **3000** và **5432**; sau khi tạo container chạy:

`pnpm install && pnpm --filter ./backend exec prisma migrate dev --name init`

Workspace mount: `/workspaces/<tên-thư-mục-repo>`.

## Cơ sở dữ liệu

| Bối cảnh | `DATABASE_URL` | `DIRECT_URL` | Ghi chú |
|----------|----------------|--------------|---------|
| Local | Cùng host DB, thường không pooler | Giống hoặc giống `DATABASE_URL` | Prisma migrate cần URL kết nối trực tiếp tới DB |
| Neon (prod) | URL **pooler** (`…-pooler…`) | URL **direct** (không pooler) | Runtime dùng pooler; `migrate` / CLI dùng direct |

- Luôn khai báo đủ **cả hai** biến khi dùng PostgreSQL qua Prisma.
- **Không** sửa migration đã apply; mọi thay đổi schema → migration mới.

## Tài liệu kỹ thuật

| Tài liệu | Nội dung |
|----------|----------|
| [`docs/DOMAIN.md`](docs/DOMAIN.md) | Domain & bounded context |
| [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) | Schema & quan hệ |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Hợp đồng REST |
| [`docs/ERROR_HANDLING.md`](docs/ERROR_HANDLING.md) | Mã lỗi & envelope |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Kiến trúc hệ thống |
| [`docs/ENV.md`](docs/ENV.md) | Biến môi trường |
| [`docs/DEV.md`](docs/DEV.md) | Chạy dev local, Docker, Dev Container, test & troubleshooting |
| [`docs/COOKIE_AUTH.md`](docs/COOKIE_AUTH.md) | Cookie & CORS liên quan auth |
| [`docs/AI_RULES.md`](docs/AI_RULES.md) | Quy tắc tích hợp AI |
| [`docs/TODO.md`](docs/TODO.md) | Lộ trình |
| [`docs/PROMPT_TEMPLATE.md`](docs/PROMPT_TEMPLATE.md) | Prompt mẫu |

## Quy tắc thay đổi

1. Thay đổi hành vi nghiệp vụ / API / DB phải đi kèm cập nhật tài liệu tương ứng trong `docs/`.
2. `DIECAST360_AI_MASTER_GUIDE.md` là nguồn đồng bộ với code và docs khi có chỉnh sửa lớn.
3. Thiếu thông tin → làm rõ trước khi implement; tránh suy đoán trong PR.

---

## Phụ lục: ước lượng chi phí nội dung

Bảng dưới mang tính **tham khảo** (scope ~200 bài bán hàng đơn giản; giá model thay đổi theo thời điểm).

| Phương án | Chi phí / bài (ước lượng) | ~200 bài | Thời gian | Ghi chú |
|-----------|---------------------------|----------|-----------|---------|
| AI – Gemini Flash-Lite | ~5 VND | ~1.000 VND | Vài phút | Rẻ, cần kiểm tra lại |
| AI – Gemini Flash | ~11 VND | ~2.200 VND | Vài phút | Cân bằng |
| AI – GPT-5 mini | ~25–30 VND | ~5.000–6.000 VND | Vài phút | Chất lượng ổn |
| AI – GPT-5.2 (MAX) | ~156 VND | ~31.000 VND | Vài phút | Ít chỉnh sửa hơn |
| Freelancer SEO | 50k–150k VND | 10–30 triệu VND | Nhiều ngày | Viết tay |
| SEO full-time | — | 15–25 triệu VND / tháng | Theo tháng | Cần vận hành |

**Tóm tắt:** Với scope trên, pipeline AI thường rẻ hơn nhiều so với outsource SEO truyền thống; trade-off là kiểm soát chất lượng và policy nội dung phải được định nghĩa rõ trong sản phẩm.

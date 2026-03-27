# Diecast360

Full-stack ứng dụng quản lý kho xe diecast tỉ lệ 1:64: media thường + viewer 360°, catalog công khai, luồng hỗ trợ đăng bài (caption / link / SEO). Đặc tả triển khai tham chiếu: [`DIECAST360_AI_MASTER_GUIDE.md`](DIECAST360_AI_MASTER_GUIDE.md).

## Mục lục

- [Tóm tắt khả năng](#tóm-tắt-khả-năng)
- [Cấu trúc repo](#cấu-trúc-repo)
- [Stack & quy ước API](#stack--quy-ước-api)
- [Chạy local](#chạy-local)
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
| **Xác thực** | Access + refresh JWT, revoke qua refresh token; route admin kèm guard + kiểm tra vai trò. |
| **Social / AI** | Copy caption + link; semantic search; AI image import; gợi ý nội dung SEO (xem guide). |

## Cấu trúc repo

```
backend/     NestJS + Prisma + PostgreSQL
frontend/    React + Vite + TanStack Query + Tailwind CSS
docs/        Đặc tả domain, API, schema, môi trường
uploads/     Static upload (dev); production cấu hình qua Storage abstraction
```

## Stack & quy ước API

- **Backend:** Node.js 20+, NestJS, Prisma, PostgreSQL, Sharp, storage abstraction (local trong dev).
- **Frontend:** React, Vite, React Router, TanStack Query, Tailwind CSS.
- **API:** global prefix `/api/v1`; payload JSON **snake_case**; response envelope `{ ok, data, message }` hoặc `{ ok, error, message }` ([`docs/ERROR_HANDLING.md`](docs/ERROR_HANDLING.md)).

## Chạy local

### Yêu cầu

- Node.js **>= 20.17.0**
- npm hoặc yarn
- PostgreSQL (Docker, local, hoặc Neon)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Cấu hình DATABASE_URL + DIRECT_URL (xem bảng dưới)
npm run prisma:generate
npm run prisma:migrate    # dev
# hoặc: npx prisma migrate deploy   # CI / production
mkdir uploads
npm run create:admin:quick
npm run start:dev
```

API mặc định: `http://localhost:3000` (path thực tế có prefix `/api/v1`).

### Frontend

```bash
cd frontend
npm install
```

Tạo `.env` nếu cần:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

```bash
npm run dev
```

UI dev: `http://localhost:5173`

Biến môi trường đầy đủ: [`docs/ENV.md`](docs/ENV.md).

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

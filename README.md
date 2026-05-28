# Diecast360

Diecast360 là phần mềm quản lý kho và bán hàng cho shop diecast, tập trung vào 3 việc cốt lõi:

- quản lý hàng hóa chính xác theo từng shop
- bán công khai với trải nghiệm xem ảnh 360
- tăng tốc vận hành bán hàng qua pre-order, hội viên và nội dung social

## Phần mềm này giúp được gì?

### 1) Quản lý kho không bị mù số liệu

- Quản lý vòng đời item (`con_hang`, `giu_cho`, `da_ban`, `preorder`)
- Theo dõi tồn kho bằng ledger nhập/xuất/điều chỉnh/reverse
- Chống sai lệch khi cập nhật đồng thời (transaction + lock)
- Quản lý ảnh thường + spinner 360 theo thứ tự rõ ràng

**Lợi ích:** giảm lỗi "bán nhầm, trừ nhầm, hết hàng giả", ra quyết định nhập hàng theo dữ liệu thật.

### 2) Chốt đơn tốt hơn trên kênh online

- Catalog công khai theo từng shop, cô lập dữ liệu tenant
- Trang chi tiết có viewer 360 giúp khách xem sản phẩm rõ hơn
- Luồng pre-order đầy đủ cho admin và khách
- Trang "Đơn hàng của tôi" cho người mua theo dõi trạng thái

**Lợi ích:** tăng tỷ lệ chuyển đổi, giảm hỏi đáp lặp lại, giảm mất đơn do thông tin không rõ.

### 3) Vận hành marketing nhanh hơn

- Copy caption + link bán hàng trực tiếp từ item
- Hỗ trợ AI cho nội dung và gợi ý dữ liệu sản phẩm
- Quản lý hội viên, điểm thưởng, nâng hạng tự động
- Dashboard KPI và trend để theo dõi hiệu quả

**Lợi ích:** tiết kiệm thời gian đăng bài, giữ chân khách cũ tốt hơn, đo được hiệu quả kinh doanh thay vì làm theo cảm tính.

## Tại sao nên dùng thay vì làm thủ công?

- **Một nguồn dữ liệu duy nhất:** kho, pre-order, hội viên, báo cáo nằm chung hệ thống.
- **Giảm phụ thuộc cá nhân:** quy trình có state machine, guard và audit log.
- **Dễ mở rộng nhiều shop:** RBAC + multi-tenant tách dữ liệu theo `shop_id`.
- **Sẵn cho production:** CI/CD, test E2E, quy ước API và tài liệu vận hành đầy đủ.

## Tính năng chính

- Item CRUD + soft delete + trạng thái hàng hóa
- Ảnh sản phẩm + cover + reorder + spinner 360 (nhiều spin set, một default)
- Public catalog/detail theo `shop_id` (UUID hoặc slug)
- RBAC theo vai trò nền tảng và vai trò trong shop
- Pre-order lifecycle có kiểm soát trạng thái
- Membership tier + points ledger + auto upgrade
- Báo cáo KPI nhập/xuất/pre-order/doanh thu/tồn kho
- Hỗ trợ social selling và AI content workflow

## Tech Stack

- Monorepo: `pnpm`
- Backend: NestJS 11 + Prisma 6 + PostgreSQL 16
- Frontend: React 19 + Vite 7 + TanStack Query + Tailwind CSS 3
- API: `/api/v1`, payload `snake_case`, envelope `{ ok, data/message }`

## Chạy nhanh trên local

### Yêu cầu

- Node.js: `>=20.19.0 <21` hoặc `>=22.12.0`
- pnpm
- PostgreSQL

### 1) Chuẩn bị env

- Copy `backend/.env.example` -> `backend/.env`
- Copy `frontend/.env.example` -> `frontend/.env`
- Điền tối thiểu: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `COOKIE_SECRET`

Chi tiết biến môi trường: [`docs/ENV.md`](docs/ENV.md)

### 2) Cài dependency

```bash
pnpm install
```

### 3) Migrate DB và tạo admin dev

```bash
pnpm --filter ./backend exec prisma migrate dev
pnpm --filter ./backend create:admin:quick
```

### 4) Chạy backend + frontend

```bash
pnpm dev
```

- API: `http://localhost:3000/api/v1`
- UI: `http://localhost:5173`

## Chất lượng & kiểm thử

- Frontend unit: Vitest
- Backend test: Jest
- E2E: Playwright smoke suite (53 tests)
- CI chạy lint + build + test + health-check

## Tài liệu cần đọc khi phát triển

- [`docs/DOMAIN.md`](docs/DOMAIN.md): luật nghiệp vụ
- [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md): hợp đồng API
- [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md): schema và migration
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): kiến trúc hệ thống
- [`docs/DEV.md`](docs/DEV.md): hướng dẫn dev đầy đủ
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): triển khai production
- [`docs/CICD.md`](docs/CICD.md): pipeline CI/CD

## Cấu trúc repo

```text
backend/    NestJS + Prisma + PostgreSQL
frontend/   React + Vite
docs/       Tài liệu domain, API, kiến trúc, vận hành
```

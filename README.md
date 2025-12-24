# Diecast360

Ứng dụng full-stack quản lý kho xe diecast 1:64 với viewer 360°, catalog công khai và công cụ hỗ trợ bán trên Facebook (copy caption + copy link). Repo này dùng **DIECAST360_AI_MASTER_GUIDE** làm nguồn chân lý để triển khai code.

## Tính năng cốt lõi
- Quản lý Item: tạo/sửa/xóa mềm, trạng thái `con_hang | giu_cho | da_ban`, bật/tắt `is_public` để xuất bản catalog.
- Ảnh thường: upload nhiều ảnh, tạo thumbnail, chọn cover, reorder, xóa.
- Spinner 360°: nhiều spin set/item, duy nhất 1 default; upload frame (24 khuyến nghị, 36 tối đa), reorder, autoplay/preload trên UI, fallback gallery nếu chưa có spinner.
- Catalog công khai: list/detail item công khai, hiển thị cover/status, dùng spinner default nếu có.
- Social selling: từ admin có nút copy caption + link để đăng Facebook.
- Auth: JWT access + refresh, lưu refresh token để revoke; chỉ admin truy cập route quản trị.

## Tech stack (đã chốt)
- Backend: Node.js (NestJS), Prisma ORM, PostgreSQL, JWT, Sharp, lưu file local (dev/demo) qua abstraction Storage.
- Frontend: React + Vite, React Router, TanStack Query.
- JSON: snake_case, base path `/api/v1`, envelope chuẩn `{ok,data,message}` / `{ok,error,message}`.

## Bắt đầu (dev)

### Yêu cầu
- Node.js >= 20.17.0
- PostgreSQL
- npm hoặc yarn

### Backend Setup
1. Vào thư mục backend:
   ```bash
   cd backend
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. Tạo file `.env` từ `.env.example` và cấu hình:
   ```bash
   cp .env.example .env
   ```
   Chỉnh sửa `.env` với thông tin database của bạn.

4. Generate Prisma client và chạy migration:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Tạo thư mục uploads:
   ```bash
   mkdir uploads
   ```

6. Khởi động server:
   ```bash
   npm run start:dev
   ```
   Server chạy tại `http://localhost:3000`

### Frontend Setup
1. Vào thư mục frontend:
   ```bash
   cd frontend
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. Tạo file `.env` (nếu cần):
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

4. Khởi động dev server:
   ```bash
   npm run dev
   ```
   Frontend chạy tại `http://localhost:5173`

## Kiến trúc & tài liệu
- Domain: `docs/DOMAIN.md`
- Database: `docs/DB_SCHEMA.md`
- API contract: `docs/API_CONTRACT.md`
- Error handling: `docs/ERROR_HANDLING.md`
- Kiến trúc: `docs/ARCHITECTURE.md`
- Biến môi trường: `docs/ENV.md`
- Quy tắc cho AI: `docs/AI_RULES.md`
- Lộ trình: `docs/TODO.md`
- Prompt mẫu: `docs/PROMPT_TEMPLATE.md`

## Quy tắc làm việc
- File `DIECAST360_AI_MASTER_GUIDE.md` là nguồn gốc; mọi thay đổi phải đồng bộ toàn bộ docs.
- Không đổi API/DB/response format khi chưa cập nhật docs tương ứng.
- Nếu thông tin thiếu, đặt câu hỏi thay vì tự suy đoán; giữ mọi output ở trạng thái có thể dùng ngay.

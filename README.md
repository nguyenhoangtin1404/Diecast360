# Diecast360

Ứng dụng full-stack quản lý kho xe diecast 1:64 với viewer 360°, catalog công khai và công cụ hỗ trợ bán trên Facebook (copy caption + copy link). Repo này dùng **DIECAST360_AI_MASTER_GUIDE** làm nguồn chân lý để triển khai code.

## Tính năng cốt lõi
- Quản lý Item: tạo/sửa/xóa mềm, trạng thái `con_hang | giu_cho | da_ban`, bật/tắt `is_public` để xuất bản catalog.
- Ảnh thường: upload nhiều ảnh, tạo thumbnail, chọn cover, reorder, xóa.
- Spinner 360°: nhiều spin set/item, duy nhất 1 default; upload frame (24 khuyến nghị, 36 tối đa), reorder, autoplay/preload trên UI, fallback gallery nếu chưa có spinner.
- Catalog công khai: list/detail item công khai, hiển thị cover/status, dùng spinner default nếu có.
- Social selling: từ admin có nút copy caption + link + nội dung chuẩn SEO tạo sinh từ AI để đăng Facebook.
- Auth: JWT access + refresh, lưu refresh token để revoke; chỉ admin truy cập route quản trị.
- Semantic Search: Tìm kiếm sản phẩm thông minh theo ngữ nghĩa.
- AI Image Import: Tạo item diecast nhanh chóng từ ảnh.

## Tech stack (đã chốt)
- Backend: Node.js (NestJS), Prisma ORM, **PostgreSQL**, JWT, Sharp, lưu file local (dev/demo) qua abstraction Storage.
- Frontend: React + Vite, React Router, TanStack Query.
- JSON: snake_case, base path `/api/v1`, envelope chuẩn `{ok,data,message}` / `{ok,error,message}`.

## Bắt đầu (dev)

### Yêu cầu
- Node.js >= 20.17.0
- npm hoặc yarn
- PostgreSQL (local Docker/VPS hoặc Neon)

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
   
   **PostgreSQL Local (mặc định cho dev):**
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/diecast360
   DIRECT_URL=postgresql://postgres:postgres@localhost:5432/diecast360
   ```
   
   **PostgreSQL (Production - Neon):**
   ```env
   # Pooled URL cho app runtime
   DATABASE_URL=postgresql://neondb_owner:your_password@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   # Direct URL cho Prisma migrate
   DIRECT_URL=postgresql://neondb_owner:your_password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

4. Generate Prisma client và chạy migration:
   ```bash
   npm run prisma:generate
   # Cả DATABASE_URL và DIRECT_URL đều phải được cấu hình
   # Dev/local:
   npm run prisma:migrate
   # Production/CI (khuyên dùng với Neon):
   npx prisma migrate deploy
   ```

5. Tạo thư mục uploads:
   ```bash
   mkdir uploads
   ```

6. Tạo tài khoản admin:
   ```bash
   npm run create:admin:quick
   ```

7. Khởi động server:
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

## Cấu hình Database (PostgreSQL)

| Môi trường | DATABASE_URL | DIRECT_URL | Ghi chú |
|-----------|--------------|------------|---------|
| Dev/local | `postgresql://postgres:postgres@localhost:5432/diecast360` | `postgresql://postgres:postgres@localhost:5432/diecast360` | Dùng PostgreSQL local hoặc Docker |
| Production (Neon) | URL pooler `...-pooler...` | URL direct `...` | Runtime dùng pooler, Prisma CLI dùng direct |

**Khuyến nghị:**
- Luôn cấu hình đủ cả `DATABASE_URL` và `DIRECT_URL` trong mọi môi trường PostgreSQL.
- Không chỉnh sửa migration đã apply; thay đổi schema phải tạo migration mới.

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

## So sánh chi phí: AI vs Thuê SEO  (200 bài bán hàng đơn giản)

| Phương án | Chi phí / bài | Tổng 200 bài | Thời gian | Ghi chú |
|---------|---------------|--------------|-----------|--------|
| AI – Gemini Flash-Lite | ~5 VND | ~1.000 VND | Vài phút | Rẻ nhất, cần validate nhẹ |
| AI – Gemini Flash | ~11 VND | ~2.200 VND | Vài phút | Cân bằng chi phí/chất lượng |
| AI – GPT-5 mini | ~25–30 VND | ~5.000–6.000 VND | Vài phút | Chất lượng ổn |
| **AI – GPT-5.2 (MAX)** | **~156 VND** | **~31.000 VND** | Vài phút | Gần như dùng ngay |
| Freelancer SEO | 50k–150k VND | 10–30 triệu VND | Nhiều ngày | Viết thủ công |
| SEO full-time | — | 15–25 triệu VND | 1 tháng | Cần quản lý, training |

**Kết luận:** AI rẻ hơn thuê SEO  ~300× đến 30.000× cho scope 200 bài.

### Lý do chọn giải pháp này
Dựa trên bảng phân tích trên, chúng tôi quyết định **tích hợp AI vào quy trình tạo content** vì những lý do sau:
1. **Tối ưu chi phí cực đại**: Với chỉ ~31.000 VND cho 200 bài viết (dùng model xịn nhất), chi phí gần như bằng 0 so với con số 15-30 triệu VND khi thuê nhân sự.
2. **Tốc độ triển khai**: Hoàn thành khối lượng công việc của 1 tháng chỉ trong vài phút. Điều này cho phép Diecast360 nhanh chóng lấp đầy nội dung catalog và đẩy bán hàng ngay lập tức.
3. **Chất lượng kiểm soát được**: Các model AI thế hệ mới (GPT-5.2) cho ra văn bản có độ chính xác và sáng tạo cao, giảm thiểu công sức biên tập lại (gần như dùng ngay).
4. **Phù hợp nguồn lực**: Với dự án quy mô vừa và nhỏ, việc nuôi bộ máy marketing là gánh nặng không cần thiết khi công nghệ đã giải quyết tốt bài toán này.

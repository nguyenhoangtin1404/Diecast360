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
1. Sao chép cấu hình: `cp .env.example .env` và chỉnh các biến trong `docs/ENV.md`.
2. Chuẩn bị PostgreSQL (theo `DATABASE_URL`) và thư mục `UPLOAD_DIR` có quyền ghi.
3. Khi hiện thực backend: cài dependency Node, áp dụng schema Prisma theo `docs/DB_SCHEMA.md`, chạy migrate, khởi động server NestJS.
4. Khi hiện thực frontend: cấu hình API base `/api/v1`, dùng TanStack Query cho data fetching và Spinner360/Gallery theo specs.

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

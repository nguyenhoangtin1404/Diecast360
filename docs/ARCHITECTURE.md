# Architecture – Diecast360

## Tổng quan
- Full-stack: Backend (Node.js/NestJS theo docs không phụ thuộc framework), DB PostgreSQL + Prisma ORM, Frontend React + Vite + TanStack Query.
- Mục tiêu: quản lý kho diecast, public catalog, viewer spinner 360° và công cụ hỗ trợ bán Facebook.

## Lựa chọn Database

| Database mode | RAM | Phù hợp cho |
|---------------|-----|-------------|
| **PostgreSQL Local** | ~200-400MB | Dev, self-host, CI nội bộ |
| **PostgreSQL Neon** | Theo gói | Production managed PostgreSQL |

Prisma ORM dùng `DATABASE_URL` cho runtime và `DIRECT_URL` cho migrate/introspect.

## Backend
- Layering: **Controller/Route → Service → Repository (Prisma) → DB**. Không bỏ qua layer.
- Module chính:
  - **Auth**: JWT access + refresh, lưu refresh token để revoke; middleware guard cho route admin.
  - **Items**: CRUD item (soft delete), toggle `is_public`, quản lý trạng thái kho.
  - **Images**: Upload ảnh thường, đặt cover, reorder, xóa; lưu metadata file/thumbnail.
  - **Spinner**: Quản lý spin set (default duy nhất), upload frame, reorder frame, đảm bảo `(spin_set_id, frame_index)` unique và liên tục.
  - **Public**: Route chỉ đọc cho catalog; chỉ lấy item `is_public=true` & chưa xóa mềm.
  - **AI**: Sinh mô tả sản phẩm, Facebook post bằng AI; phân tích ảnh tạo draft item tự động. Gồm `AiService` (orchestrate), `EmbeddingService` (vector embedding), `VectorStoreService` (tìm kiếm tương tự).
- Hạ tầng:
  - **Storage abstraction**: interface lưu/xóa file; triển khai mặc định `LocalStorage` (dev/demo) dùng `UPLOAD_DIR`; chuẩn bị interface để thay bằng S3 sau này.
  - **ImageProcessor**: dùng Sharp để resize/tạo thumbnail cả ảnh thường và frame spinner.
  - **Config**: lấy từ `.env`, validate khi bootstrap (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `UPLOAD_DIR`...).
- Error handling: theo `docs/ERROR_HANDLING.md`, map chuẩn HTTP, không lộ chi tiết nhạy cảm.

## Upload & xử lý ảnh
- Ảnh thường: upload multipart → Service gọi ImageProcessor tạo thumbnail → lưu file qua Storage → persist metadata (path, thumbnail, is_cover, order).
- Spinner: upload từng frame (1 file/req) → ImageProcessor tạo thumbnail (nhỏ để preload) → lưu file + thumbnail → gán `frame_index` (append nếu không truyền). Reorder cập nhật index liên tục.
- Khi xóa ảnh/frame: Service xóa file + thumbnail trong storage (nếu policy cho phép) và cập nhật cover/default/order hợp lệ.

## Frontend
- Vite + React Router, chia route **admin** (protected) và **public** (khách).
- Data fetch: TanStack Query, keys tách theo resource (`items`, `item:{id}`, `spin_sets:{itemId}`...). Cache invalidation sau các mutation upload/reorder.
- Thành phần chính:
  - **Spinner360**: drag/touch, autoplay play/pause, preload dần (chỉ load frame kế tiếp), fallback ảnh thumb khi chưa tải full, hỗ trợ 24-36 frames.
  - **Gallery**: hiển thị ảnh thường theo `display_order`, đánh dấu cover.
  - **ItemCard**: dùng cho catalog/public, hiển thị cover, status, nút copy caption/link.
- UI rule: nếu item có spin set default → ưu tiên hiển thị Spinner360; nếu không có → fallback Gallery.

## API sử dụng
- Base path `/api/v1`, JSON snake_case, envelope chuẩn (ok/data/message hoặc ok/error/message).
- Upload qua multipart; client phải gửi access token cho route admin.

## Triển khai & môi trường
- Env đọc từ `.env`/`docs/ENV.md`; không hardcode secret.
- Database mặc định: PostgreSQL local (`postgresql://postgres:postgres@localhost:5432/diecast360`).
- Mặc định lưu file local tại `UPLOAD_DIR` (cần mount volume nếu docker). Khi chuyển S3, chỉ thay Storage implementation.
- Logging: request id + error log (không trả về client). CORS bật cho frontend origin.
- Không chỉnh sửa migration đã apply. Mọi thay đổi schema phải tạo migration mới.

## Tối ưu tài nguyên thấp với PostgreSQL
- Dùng PostgreSQL local trong Docker với giới hạn memory phù hợp host.
- Config Sharp: `cache(false)`, `concurrency(1)` để tránh OOM khi xử lý ảnh.
- Giới hạn Node.js memory: `NODE_OPTIONS="--max-old-space-size=512"`.

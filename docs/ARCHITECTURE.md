# Architecture – Diecast360

## Tổng quan
- Full-stack: Backend NestJS 11, DB PostgreSQL + Prisma ORM, Frontend React 19 + Vite 7 + TanStack Query.
- Mục tiêu: quản lý kho diecast, public catalog, viewer spinner 360°, pre-order, hội viên/điểm, báo cáo và công cụ hỗ trợ bán Facebook.

## Triển khai (tham chiếu)
- Hướng dẫn tách tầng: static frontend (Vercel / Cloudflare Pages / tương đương), API trên máy chủ tự quản (ví dụ Raspberry Pi) với tunnel HTTPS khi không có IP tĩnh, DB managed Neon — xem [`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

## Lựa chọn Database

| Database mode | RAM | Phù hợp cho |
|---------------|-----|-------------|
| **PostgreSQL Local** | ~200-400MB | Dev, self-host, CI nội bộ |
| **PostgreSQL Neon** | Theo gói | Production managed PostgreSQL |

Prisma ORM dùng `DATABASE_URL` cho runtime và `DIRECT_URL` cho migrate/introspect.

## Backend
- Layering: **Controller/Route → Service → PrismaService/Storage/Processor → DB/Object storage**. Không đưa business rule trực tiếp vào controller.
- Module chính:
  - **Auth**: JWT access + refresh, lưu refresh token để revoke; middleware guard cho route admin.
  - **Items**: CRUD item (soft delete), toggle `is_public`, quản lý trạng thái kho.
  - **Images**: Upload ảnh thường, đặt cover, reorder, xóa; lưu metadata file/thumbnail.
  - **Spinner**: Quản lý spin set (default duy nhất), upload frame, reorder frame, đảm bảo `(spin_set_id, frame_index)` unique và liên tục.
  - **Public**: Route chỉ đọc cho catalog/detail/contact; chỉ lấy item `is_public=true` & chưa xóa mềm. Production yêu cầu shop scope (`shop_id` hoặc JWT active shop) để tránh aggregate nhiều shop.
  - **Shops / Shop settings**: Platform shop management, RBAC, audit log, contact/appearance/loyalty JSON theo tenant.
  - **Categories**: Global seed categories + category theo shop (`car_brand`, `model_brand`).
  - **Inventory**: Ledger nhập/xuất/adjust/reverse, reconciliation và cập nhật tồn kho có transaction.
  - **Preorders**: Lifecycle `PENDING_CONFIRMATION → WAITING_FOR_GOODS → ARRIVED → PAID → REFUNDED`, public cards và my-orders.
  - **Members**: Hội viên, tier, points ledger; tự động earn/redeem theo pre-order paid/refund.
  - **Reports**: Summary/trends cho inventory, pre-order, doanh thu và Facebook posts.
  - **AI**: Sinh mô tả sản phẩm, Facebook post bằng AI; phân tích ảnh tạo draft item tự động. Gồm `AiService` (orchestrate), `EmbeddingService` (vector embedding), `VectorStoreService` (tìm kiếm tương tự).
- Hạ tầng:
  - **Storage abstraction**: interface lưu/xóa/resolve URL; `LocalStorage` dùng `UPLOAD_DIR`, `R2StorageService` dùng Cloudflare R2 qua S3-compatible API khi `STORAGE_DRIVER=r2`.
  - **ImageProcessor**: dùng Sharp để resize/tạo thumbnail cả ảnh thường và frame spinner.
  - **Config/Security**: lấy từ `.env`; bootstrap validate `JWT_SECRET`, `COOKIE_SECRET`, production `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `CORS_ALLOW_LAN`; Helmet + CSRF double-submit.
- Error handling: theo `docs/ERROR_HANDLING.md`, map chuẩn HTTP, không lộ chi tiết nhạy cảm.

## Upload & xử lý ảnh
- Ảnh thường: upload multipart → Service gọi ImageProcessor tạo thumbnail → lưu file qua Storage → persist metadata (path, thumbnail, is_cover, order).
- Spinner: upload từng frame (1 file/req) → ImageProcessor tạo thumbnail (nhỏ để preload) → lưu file + thumbnail → gán `frame_index` (append nếu không truyền). Reorder cập nhật index liên tục.
- Khi xóa ảnh/frame: Service xóa file + thumbnail trong storage (nếu policy cho phép) và cập nhật cover/default/order hợp lệ.

## Frontend
- Vite + React Router, chia route **admin** (protected) và **public** (khách).
- Data fetch: TanStack Query, keys tách theo resource (`items`, `item:{id}`, `spin_sets:{itemId}`...). Cache invalidation sau các mutation upload/reorder.
- Thành phần chính:
  - **Spinner360**: drag/touch, autoplay play/pause, preload dần (chỉ load frame kế tiếp), fallback ảnh thumb khi chưa tải full, giới hạn mặc định 48 frames qua `VITE_MAX_SPINNER_FRAMES`.
  - **Gallery**: hiển thị ảnh thường theo `display_order`, đánh dấu cover.
  - **ItemCard**: dùng cho catalog/public, hiển thị cover, status, nút copy caption/link.
- UI rule: nếu item có spin set default → ưu tiên hiển thị Spinner360; nếu không có → fallback Gallery.

## API sử dụng
- Base path `/api/v1`, JSON snake_case, envelope chuẩn (ok/data/message hoặc ok/error/message).
- Upload qua multipart; client phải gửi access token cho route admin.

## Triển khai & môi trường
- Env đọc từ `.env`/`docs/ENV.md`; không hardcode secret.
- Database mặc định: PostgreSQL local (`postgresql://postgres:postgres@localhost:5432/diecast360`).
- Mặc định lưu file local tại `UPLOAD_DIR` (cần mount volume nếu docker). Với Cloudflare R2 đặt `STORAGE_DRIVER=r2` và đủ `R2_*`; signed media endpoint vẫn proxy object để tương thích link đã ký.
- Logging: request id + error log (không trả về client). CORS bật cho frontend origin.
- Không chỉnh sửa migration đã apply. Mọi thay đổi schema phải tạo migration mới.

## Tối ưu tài nguyên thấp với PostgreSQL
- Dùng PostgreSQL local trong Docker với giới hạn memory phù hợp host.
- Config Sharp: `cache(false)`, `concurrency(1)` để tránh OOM khi xử lý ảnh.
- Giới hạn Node.js memory: `NODE_OPTIONS="--max-old-space-size=512"`.

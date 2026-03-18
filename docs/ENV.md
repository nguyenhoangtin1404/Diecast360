# ENV – Diecast360

Các biến bắt buộc (tham chiếu `.env.example`). Không hardcode vào code; validate khi khởi động.

## Chọn Database

Diecast360 dùng PostgreSQL làm chuẩn cho runtime và Prisma CLI:

| Database | Khuyến nghị cho | RAM sử dụng |
|----------|-----------------|-------------|
| **PostgreSQL Local** | Dev, CI nội bộ, VPS self-host | ~200-400MB |
| **PostgreSQL Neon** | Production managed PostgreSQL | Theo gói Neon |

## Biến môi trường

| Variable | Mục đích | Ví dụ | Ghi chú |
|----------|----------|-------|---------|
| DATABASE_URL | Kết nối Database | Xem bên dưới | Bắt buộc |
| DIRECT_URL | Kết nối trực tiếp DB cho Prisma CLI | Xem bên dưới | Bắt buộc với PostgreSQL + Prisma migrate/introspect |
| JWT_SECRET | Secret ký access token | `super-secret` | Bắt buộc, đủ entropy |
| JWT_EXPIRES_IN | TTL access token | `15m` | Chuỗi thời gian (ms, s, m, h...) |
| REFRESH_TOKEN_EXPIRES_IN | TTL refresh token | `7d` | Dùng để tính `expires_at` |
| UPLOAD_DIR | Thư mục lưu file local | `./uploads` | Phải tồn tại/ghi được |
| MAX_UPLOAD_MB | Giới hạn kích thước upload | `10` | Áp dụng cho ảnh thường và frame spinner |
| ALLOWED_MIME | MIME type cho upload | `image/jpeg,image/png` | Server validate trước khi lưu |
| PUBLIC_BASE_URL | Base public URL | `http://localhost:5173` | Dùng để ghép URL ảnh/thumbnail |
| FRONTEND_URL | Frontend origin cho CORS | `http://localhost:5173` | Phải khớp với origin frontend |
| COOKIE_SECRET | Secret ký cookies | random 32+ chars | Bắt buộc, đổi trong production |
| COOKIE_SECURE | Chỉ gửi cookies qua HTTPS | `false` (dev) / `true` (prod) | Bật khi deploy HTTPS |
| COOKIE_SAME_SITE | SameSite attribute cho cookies | `lax` (dev) / `strict` (prod) | Chống CSRF |
| FACEBOOK_PAGE_ID | Facebook Page ID cho publish | `123456789` | Tùy chọn (bắt buộc cho FB publish) |
| FACEBOOK_PAGE_ACCESS_TOKEN | Long-lived Page Access Token | `EAA...` | Tùy chọn (bắt buộc cho FB publish) |

## DATABASE_URL / DIRECT_URL Format

### PostgreSQL Local (dev/self-host)
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/diecast360
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/diecast360
```

### PostgreSQL Neon (Production)
```bash
# Runtime (pooling)
DATABASE_URL=postgresql://neondb_owner:your_password@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
# Prisma migrate/introspect (direct, no pooler)
DIRECT_URL=postgresql://neondb_owner:your_password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Lưu ý:
- `DATABASE_URL` dùng cho app runtime.
- `DIRECT_URL` dùng cho Prisma CLI để tránh lỗi với pooler (đặc biệt Neon/pgBouncer).

## Ghi nhớ

- Dev/demo dùng local storage; cần đảm bảo `UPLOAD_DIR` được tạo và writable.
- Thay đổi env phải được phản ánh vào config server và docs nếu có biến mới.
- Khi chuyển đổi database, cần chạy lại migration và có thể cần migrate data.
- Không chỉnh sửa migration đã apply. Nếu cần thay đổi schema, tạo migration mới.
- Nếu phát hiện môi trường đã apply checksum migration cũ, cần revert migration về đúng blob đã apply trước khi deploy tiếp.

## Yêu cầu HTTPS cho Production

> **Quan trọng:** Khi deploy lên production, bắt buộc phải bật HTTPS trước ingress/reverse proxy:
>
> - `COOKIE_SECURE=true` — cookie auth chỉ gửi qua HTTPS, ngăn chặn session hijacking.
> - `FACEBOOK_PAGE_ACCESS_TOKEN` được gửi trong **request body** đến Graph API (không phải URL param) để tránh token bị ghi vào access log của server. Tuy nhiên reverse proxy (Nginx, Caddy...) mặc định không log request body — cần đảm bảo config log không bật `$request_body`. HTTPS ngăn body bị sniff trên đường truyền.
> - Thiếu HTTPS trong production là lỗ hổng bảo mật nghiêm trọng.


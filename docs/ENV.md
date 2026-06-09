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
| NODE_ENV | Môi trường runtime | `development` / `production` | Production bật kiểm tra cookie/CORS và yêu cầu HTTPS cookie |
| PORT | Cổng backend listen | `3000` | Mặc định `3000` |
| HOST | Địa chỉ backend bind | `0.0.0.0` | Mặc định trong code là `0.0.0.0`; dùng `127.0.0.1` khi chỉ expose qua tunnel/proxy local |
| TRUST_PROXY | Số hop proxy tin cậy trước app | `1` | `1` = Nginx/Cloudflare đơn hop; `2` = CDN+LB; `0` = không proxy (dev direct). Ảnh hưởng `req.ip` dùng cho rate limit và CAPTCHA `remoteip`. Sai số hop có thể cho phép client giả mạo IP qua `X-Forwarded-For`. |
| JWT_SECRET | Secret ký access token | `change-me-to-random-32-char-jwt-secret` | Bắt buộc, đủ entropy và tối thiểu 32 ký tự |
| JWT_ALLOW_AUTHORIZATION_BEARER | Cho phép đọc access JWT từ header `Authorization: Bearer` | `true` (mặc định) | Đặt `false` khi chỉ dùng web + cookie HttpOnly để thu hẹp kênh lộ token (XSS không đọc được cookie nhưng có thể đọc header nếu JS chèn được fetch tùy biến). |
| JWT_EXPIRES_IN | TTL access token | `15m` | Chuỗi thời gian (ms, s, m, h...) |
| REFRESH_TOKEN_EXPIRES_IN | TTL refresh token | `7d` | Dùng để tính `expires_at` |
| UPLOAD_DIR | Thư mục lưu file local | `./uploads` | Khi `STORAGE_DRIVER=local` phải tồn tại/ghi được. Khi `STORAGE_DRIVER=r2`, thư mục không dùng cho đọc media (upload qua S3 API); vẫn có thể để mặc định cho dev. |
| MAX_UPLOAD_MB | Giới hạn kích thước upload | `10` | Áp dụng cho ảnh thường và frame spinner |
| MAX_SPINNER_FRAMES | Giới hạn số frame spinner ở backend | `48` | Backend upload guard; frontend có biến riêng `VITE_MAX_SPINNER_FRAMES` |
| ALLOWED_MIME | MIME type cho upload | `image/jpeg,image/png,image/webp` | Server validate trước khi lưu |
| BACKEND_URL | Base public URL của backend | `http://localhost:3000` | Dùng để ghép signed media URL (`/api/v1/media?...`); production nên đặt URL public của API. |
| PUBLIC_BASE_URL | Base public URL cũ | `http://localhost:5173` | Legacy/doc compatibility; code signed media hiện đọc `BACKEND_URL`. |
| FRONTEND_URL | Frontend origin cho CORS | `http://localhost:5173` | Phải khớp với origin frontend |
| COOKIE_SECRET | Secret ký cookies | random 32+ chars | Bắt buộc, đổi trong production |
| COOKIE_SECURE | Chỉ gửi cookies qua HTTPS | `false` (dev) / `true` (prod) | Bật khi deploy HTTPS |
| COOKIE_SAME_SITE | SameSite attribute cho cookies | `lax` (dev) / `strict` hoặc `none` (prod) | Dùng **`none`** khi frontend và API **khác domain**; bắt buộc `COOKIE_SECURE=true` |
| SECURITY_HSTS_DISABLED | Tắt header HSTS dù production + HTTPS cookie | `false` (mặc định) | Chỉ đặt `true` khi cần rollback khẩn cấp; HSTS được bật khi `NODE_ENV=production` và `COOKIE_SECURE=true`. Header bảo mật khác (CSP API, `X-Content-Type-Options`, frame) do Helmet trong `main.ts`. |
| FRONTEND_URLS | Danh sách origin frontend bổ sung | `https://preview.example.com,https://admin.example.com` | Tùy chọn; tách bằng dấu phẩy. Backend tự thêm biến thể `localhost`/`127.0.0.1` cùng port từ `FRONTEND_URL`. |
| CORS_ALLOW_LAN | Cho phép origin LAN private trong dev | `true` (dev LAN) / `false` (prod) | Chỉ dùng khi test UI qua Vite `--host`; production boot sẽ reject nếu `true`. |
| MEDIA_SIGNING_SECRET | Secret ký URL media | random 32+ chars | Tùy chọn nhưng khuyến nghị; nếu bỏ trống dùng `JWT_SECRET`, làm xoay JWT có thể vô hiệu link ảnh cũ. |
| MEDIA_URL_TTL_MS | TTL signed media URL | `604800000` | Tùy chọn; mặc định 7 ngày. |
| STORAGE_DRIVER | Backend lưu object: `local` hoặc `r2` | `local` | Với `r2` cần đủ biến `R2_*` (xem mục Object storage). |
| R2_ACCOUNT_ID | Cloudflare account id (segment endpoint S3) | `abc123...` | Bắt buộc khi `STORAGE_DRIVER=r2` |
| R2_ACCESS_KEY_ID | R2 S3 API access key | `...` | Bắt buộc khi `STORAGE_DRIVER=r2`; rotate định kỳ |
| R2_SECRET_ACCESS_KEY | R2 S3 API secret | `...` | **Không** commit; chỉ env/secret manager |
| R2_BUCKET | Tên bucket R2 | `diecast360-media` | Bắt buộc khi `STORAGE_DRIVER=r2` |
| R2_PUBLIC_BASE_URL | (Tuỳ chọn) CDN/public base nếu không dùng presigned | — | Thường để trống; app ưu tiên presigned GET |
| FACEBOOK_PAGE_ID | Facebook Page ID cho publish | `123456789` | Tùy chọn (bắt buộc cho FB publish) |
| FACEBOOK_PAGE_ACCESS_TOKEN | Long-lived Page Access Token | `EAA...` | Tùy chọn (bắt buộc cho FB publish) |
| FACEBOOK_GRAPH_API_VERSION | Version Graph API | `v21.0` | Tùy chọn; code có default |
| OPENAI_API_KEY | OpenAI API key | `sk-...` | Tùy chọn; cần cho AI description, Facebook copy, AI import |
| OPENAI_MODEL | Model OpenAI | `gpt-5.2` hoặc model triển khai chọn | Tùy chọn; code có default khi không set |
| PINECONE_API_KEY | Pinecone API key | `...` | Tùy chọn; cần cho semantic/vector search |
| PINECONE_INDEX | Pinecone index | `diecast360` | Tùy chọn; code có default |
| THROTTLE_TTL | TTL rate limit global | `60000` | Tùy chọn; Nest Throttler đọc theo ms |
| THROTTLE_LIMIT | Số request trong TTL | `100` | Tùy chọn; default code là `100` |
| CAPTCHA_ENABLED | Bật xác minh CAPTCHA cho login | `false` | Tùy chọn; đặt `true` để bật; cần `CAPTCHA_SECRET_KEY` + frontend `VITE_*` |
| CAPTCHA_PROVIDER | Nhà cung cấp CAPTCHA | `cloudflare` | `cloudflare` (Turnstile) hoặc `google` (reCAPTCHA v3); khớp với `VITE_CAPTCHA_PROVIDER` |
| CAPTCHA_SECRET_KEY | Secret key từ dashboard CAPTCHA | `...` | Bắt buộc khi `CAPTCHA_ENABLED=true`; **không commit** |
| CAPTCHA_MIN_SCORE | Ngưỡng score tối thiểu (Google v3) | `0.5` | Tùy chọn; chỉ dùng với `CAPTCHA_PROVIDER=google`; 0.0–1.0 |
| AUTH_EMAIL_RATE_LIMIT | Số lần thử login / email / window | `10` | Chống brute-force đổi IP. **In-memory per-process** — không chia sẻ giữa replica, reset khi restart. Phù hợp Pi single-instance; cần Redis nếu scale horizontal (#239). |
| AUTH_EMAIL_RATE_WINDOW_MS | Window email rate limit (ms) | `900000` | 15 phút |
| AUTH_LOCKOUT_THRESHOLD | Số lần sai liên tiếp trước khi khóa | `5` | Chỉ user tồn tại |
| AUTH_LOCKOUT_DURATION_MS | Thời gian khóa tạm (ms) | `1800000` | 30 phút |
| EMAIL_PROVIDER | Provider gửi email | `mock` hoặc `resend` | `mock` chỉ log token ra console (dev); `resend` gọi Resend API thật. Rate limit 3/email/h là **in-memory per-process** (giống `AUTH_EMAIL_RATE_LIMIT`); phù hợp Pi single-instance, cần Redis nếu scale horizontal (#239). |
| RESEND_API_KEY | API key của Resend | `re_...` | Bắt buộc khi `EMAIL_PROVIDER=resend`; **không commit** |
| EMAIL_FROM | Địa chỉ gửi email | `noreply@diecast360.vn` | Tùy chọn; mặc định `noreply@diecast360.vn` |
| SECURITY_ALERTS_ENABLED | Gửi cảnh báo Telegram | `false` | Runtime ops |
| TELEGRAM_BOT_TOKEN | Bot token @BotFather | — | Không commit |
| TELEGRAM_CHAT_ID | Chat nhận alert | — | |
| SECURITY_ALERT_COOLDOWN_MS | Cooldown dedupe alert | `300000` | 5 phút |

## Frontend build-time env

Các biến `VITE_*` được đọc lúc Vite start/build; đổi giá trị cần restart dev server hoặc build lại.

| Variable | Mục đích | Ví dụ / mặc định | Ghi chú |
|----------|----------|------------------|---------|
| VITE_API_BASE_URL | Base URL API cho frontend | `auto`, rỗng hoặc `https://api.example.com/api/v1` | Rỗng/`auto` gọi same-origin `/api/v1`; local dev dùng proxy Vite, production tách domain phải dùng URL tuyệt đối |
| VITE_ADMIN_SEMANTIC_SEARCH_ENABLED | Bật UI semantic search trong admin items | `false` | Chỉ bật khi backend/vector search đã cấu hình |
| VITE_PUBLIC_PREORDER_SHOP_ID | Shop mặc định cho trang `/preorders` public | UUID shop | Hữu ích cho single-tenant deploy khi URL không có `?shop_id=` |
| VITE_PUBLIC_CATALOG_SHOP_ID | Shop mặc định cho catalog `/` public | UUID hoặc slug shop | Production public catalog cần shop scope nếu khách không có JWT active shop |
| VITE_MAX_SPINNER_FRAMES | Giới hạn frame spinner ở UI | `48` | Phải khớp hoặc nhỏ hơn `MAX_SPINNER_FRAMES` backend |
| VITE_CAPTCHA_ENABLED | Bật CAPTCHA ở frontend | `false` | **Phải đồng bộ** với `CAPTCHA_ENABLED` backend để tránh lệch hành vi FE/BE |
| VITE_CAPTCHA_PROVIDER | Provider CAPTCHA cho frontend | `cloudflare` | `cloudflare` hoặc `google`; phải khớp với `CAPTCHA_PROVIDER` backend |
| VITE_CAPTCHA_SITE_KEY | Site key từ dashboard CAPTCHA | `...` | Dùng khi `VITE_CAPTCHA_ENABLED=true`; nếu thiếu thì frontend sẽ không render CAPTCHA |

## Object storage (Cloudflare R2)

Khi `STORAGE_DRIVER=r2`, backend dùng S3-compatible API (`@aws-sdk/client-s3`) với endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, `region: auto`, `forcePathStyle: true`. Object key trùng đường dẫn tương đối trong DB (`images/...`, `spinner/...`, v.v.).

- **Bảo mật:** Tạo R2 API token tối thiểu quyền (read/write trên một bucket). Không bật public bucket list nếu không cần. Rotate key khi nghi ngờ lộ; cập nhật env trên mọi replica trước khi revoke key cũ.
- **Presigned URL:** `getFileUrl` trả link có thời hạn; client nên refetch JSON khi ảnh hết hạn (TTL `MEDIA_URL_TTL_MS`).
- **Proxy `/api/v1/media`:** Vẫn xác thực `d`/`s` rồi stream object từ R2 — hữu ích cho link đã lưu/cache; không đọc file từ `UPLOAD_DIR` ở chế độ R2.

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
> - Nếu dùng `COOKIE_SAME_SITE=none` cho UI/API khác domain, browser bắt buộc `COOKIE_SECURE=true`; backend cũng kiểm tra điều này khi `NODE_ENV=production`.
> - `CORS_ALLOW_LAN` phải tắt trong production; chỉ set các origin thật qua `FRONTEND_URL` / `FRONTEND_URLS`.
> - `FACEBOOK_PAGE_ACCESS_TOKEN` được gửi trong **request body** đến Graph API (không phải URL param) để tránh token bị ghi vào access log của server. Tuy nhiên reverse proxy (Nginx, Caddy...) mặc định không log request body — cần đảm bảo config log không bật `$request_body`. HTTPS ngăn body bị sniff trên đường truyền.
> - Thiếu HTTPS trong production là lỗ hổng bảo mật nghiêm trọng.

# ENV – Diecast360

Các biến bắt buộc (tham chiếu `.env.example`). Không hardcode vào code; validate khi khởi động.

## Chọn Database

Diecast360 hỗ trợ 2 loại database:

| Database | Khuyến nghị cho | RAM sử dụng |
|----------|-----------------|-------------|
| **SQLite** (mặc định) | Raspberry Pi, demo, cá nhân, 1-10 users | ~0MB (embedded) |
| **PostgreSQL** | Production, nhiều users đồng thời | ~200-400MB |

## Biến môi trường

| Variable | Mục đích | Ví dụ | Ghi chú |
|----------|----------|-------|---------|
| DATABASE_URL | Kết nối Database | Xem bên dưới | Bắt buộc |
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

## DATABASE_URL Format

### SQLite (Mặc định - Khuyến nghị cho low-memory)
```bash
DATABASE_URL=file:./dev.db
```

Ưu điểm:
- Không cần cài đặt database server
- Tiết kiệm ~200-400MB RAM
- Phù hợp Raspberry Pi, demo, cá nhân

Nhược điểm:
- Không hỗ trợ concurrent writes tốt
- Giới hạn 1-10 users đồng thời

### PostgreSQL (Production)
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/diecast360
```

Ưu điểm:
- Hỗ trợ nhiều users đồng thời
- Concurrent writes tốt
- Phù hợp production

Nhược điểm:
- Cần cài đặt PostgreSQL server
- Tiêu tốn ~200-400MB RAM

## Ghi nhớ

- Dev/demo dùng local storage; cần đảm bảo `UPLOAD_DIR` được tạo và writable.
- Thay đổi env phải được phản ánh vào config server và docs nếu có biến mới.
- Khi chuyển đổi database, cần chạy lại migration và có thể cần migrate data.

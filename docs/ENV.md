# ENV – Diecast360

Các biến bắt buộc (tham chiếu `.env.example`). Không hardcode vào code; validate khi khởi động.

| Variable | Mục đích | Ví dụ | Ghi chú |
| --- | --- | --- | --- |
| DATABASE_URL | Kết nối PostgreSQL | `postgresql://postgres:postgres@localhost:5432/diecast360` | Dùng cho Prisma. |
| JWT_SECRET | Secret ký access token | `super-secret` | Bắt buộc, đủ entropy. |
| JWT_EXPIRES_IN | TTL access token | `15m` | Chuỗi thời gian (ms, s, m, h...). |
| REFRESH_TOKEN_EXPIRES_IN | TTL refresh token | `7d` | Dùng để tính `expires_at`. |
| UPLOAD_DIR | Thư mục lưu file local | `./uploads` | Phải tồn tại/ghi được; mount volume khi chạy container. |
| MAX_UPLOAD_MB | Giới hạn kích thước upload | `10` | Áp dụng cho ảnh thường và frame spinner. |
| ALLOWED_MIME | MIME type cho upload | `image/jpeg,image/png` | Server validate trước khi lưu. |
| PUBLIC_BASE_URL | Base public URL để render link ảnh | `http://localhost:5173` | Dùng để ghép URL ảnh/thumbnail trả về API. |

Ghi nhớ:
- Dev/demo dùng local storage; cần đảm bảo `UPLOAD_DIR` được tạo và writable.
- Thay đổi env phải được phản ánh vào config server và docs nếu có biến mới.

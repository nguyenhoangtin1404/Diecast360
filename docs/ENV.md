# Environment Variables

## Required
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD
- JWT_SECRET

---

## Optional
- REDIS_URL
- LOG_LEVEL

---

## Rules
- Không commit file .env
- Không hardcode giá trị

---

## Cấu hình mẫu
- Xem `.env.example` để copy nhanh và thay giá trị thật.
- Giá trị gợi ý:
  - `LOG_LEVEL=info`
  - `DB_PORT=5432` (tuỳ DB)
  - `DB_HOST=localhost` khi chạy local

## Quy trình khai báo
1. Copy `.env.example` thành `.env`.
2. Điền giá trị thật cho tất cả biến `Required`.
3. Kiểm tra ứng dụng đọc đúng biến trước khi commit code liên quan.

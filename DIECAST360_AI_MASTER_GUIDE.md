# DIECAST360 — AI MASTER GUIDE
(Tài liệu nguồn duy nhất để AI sinh toàn bộ docs & cấu hình dự án)

---

## 0. VAI TRÒ CỦA BẠN (AI)
Bạn là **AI coding & documentation assistant** cho dự án **Diecast360**.

❗ QUY TẮC TUYỆT ĐỐI
- File này là **SINGLE SOURCE OF TRUTH**.
- Mọi file sinh ra **PHẢI KHỚP NHAU**, không mâu thuẫn.
- Không tự ý sáng tạo ngoài scope.
- Viết tài liệu đủ chi tiết để dev khác đọc là code được ngay.

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Tên dự án
**Diecast360**

### 1.2. Mô tả ngắn
A full-stack web application for managing diecast inventory with a 360° image spinner, public catalog, and social-selling tools optimized for Facebook.

### 1.3. Bài toán thực tế
- Quản lý mẫu xe diecast (1:64)
- Upload ảnh thường + chọn cover
- Upload bộ ảnh **360° spinner** để người xem kéo xoay xe
- Public catalog cho khách xem
- Tool hỗ trợ bán Facebook: **copy caption + copy link**
- Phục vụ **bán thật + project portfolio remote**

---

## 2. TECH STACK (ĐÃ CHỐT – KHÔNG TRANH LUẬN)

### Backend
- Node.js (NestJS)  docs **không phụ thuộc framework**
- PostgreSQL (Local cho dev, Neon cho production)
- ORM: Prisma
- Auth: JWT access + refresh token
- Upload: local storage (dev/demo)
- Image processing: Sharp

### Frontend
- React + Vite
- React Router
- TanStack Query
- Component trọng tâm: **Spinner360**

---

## 3. DOMAIN MODEL (NGUỒN CHÂN LÝ)

### 3.1. Entity chính
- **Item**: mẫu xe diecast
- **ItemImage**: ảnh thường của item
- **SpinSet**: 1 bộ ảnh 360° của item
- **SpinFrame**: 1 frame trong spin set
- **User**: admin
- **RefreshToken**: quản lý refresh token

### 3.2. Ràng buộc nghiệp vụ
- 1 Item có nhiều ItemImage
- 1 Item có nhiều SpinSet
- 1 Item chỉ có **1 SpinSet mặc định**
- SpinFrame có `frame_index` từ `0..n-1`
- `(spin_set_id, frame_index)` là UNIQUE
- Item dùng **soft delete**
- Trạng thái item:
  - `con_hang`
  - `giu_cho`
  - `da_ban`

---

## 4. YÊU CẦU SPINNER 360° (BẮT BUỘC)

### 4.1. UX
- Drag trái/phải → xoay xe
- Touch support mobile
- Auto-play play/pause
- Preload thông minh (KHÔNG load toàn bộ frame ngay)
- Fallback sang gallery thường nếu chưa có spinner

### 4.2. Data rules
- Spinner dùng **nhiều ảnh theo frame**
- Số frame khuyến nghị: `24` (có thể 36)
- Frame index tăng dần, không skip
- Có thumbnail cho frame

---

## 5. API CONTRACT (CHUẨN BẮT BUỘC)

### 5.1. Quy ước chung
- Base path: `/api/v1`
- JSON keys: `snake_case`
- UUID cho id
- Timestamps: ISO8601

### 5.2. Response envelope

**Success:**
```json
{
  "ok": true,
  "data": {},
  "message": ""
}
```

**Error:**
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "details": []
  },
  "message": ""
}
```

### 5.3. Endpoints tối thiểu

**Auth**
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

**Items**
- `GET /items`
- `POST /items`
- `GET /items/:id`
- `PATCH /items/:id`
- `DELETE /items/:id`

**Images**
- `POST /items/:id/images`
- `PATCH /items/:id/images/:image_id` (set is_cover, đổi metadata nếu có)
- `PATCH /items/:id/images/order`
- `DELETE /items/:id/images/:image_id`

**Spinner**
- `GET /items/:id/spin-sets`
- `POST /items/:id/spin-sets`
- `PATCH /spin-sets/:id`
- `POST /spin-sets/:id/frames`
- `PATCH /spin-sets/:id/frames/order`
- `DELETE /spin-sets/:id/frames/:frame_id`

**Public**
- `GET /public/items`
- `GET /public/items/:id`

**AI**
- `POST /items/:id/ai-description`
- `POST /items/:id/fb-post`
- `POST /items/ai-draft`

**CSV Export**
- `GET /items/export`

---

## 6. DATABASE SCHEMA (LOGIC BẮT BUỘC)

### Tables tối thiểu
- `users`
- `refresh_tokens`
- `items`
- `item_images`
- `spin_sets`
- `spin_frames`
- `ai_item_drafts`

### Quy tắc DB
- UUID primary key
- Soft delete: `deleted_at`
- Index cho:
  - `item.status`
  - `item.created_at`
  - `spin_frames.spin_set_id` + `frame_index`
- Không chỉnh sửa migration đã apply; thay đổi schema phải tạo migration mới

---

## 7. ERROR HANDLING (CHUẨN HÓA)

### Error codes chuẩn
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPLOAD_INVALID_TYPE`
- `UPLOAD_TOO_LARGE`
- `SPIN_FRAME_INDEX_CONFLICT`
- `INTERNAL_SERVER_ERROR`

### HTTP status mapping
`400` / `401` / `403` / `404` / `409` / `413` / `422` / `500`

---

## 8. ENVIRONMENT VARIABLES

BẮT BUỘC sinh:
- `.env.example`
- `docs/ENV.md`

Biến tối thiểu:
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `UPLOAD_DIR`
- `MAX_UPLOAD_MB`
- `ALLOWED_MIME`
- `PUBLIC_BASE_URL`
- `FRONTEND_URL`
- `COOKIE_SECRET`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`

---

## 9. KIẾN TRÚC (MÔ TẢ TRONG DOC)

### Backend
- Controller / Route
- Service
- Repository (Prisma)
- ImageProcessor
- Storage abstraction (Local → S3)
- AI module (AiService, EmbeddingService, VectorStoreService)

### Frontend
- Pages: public / admin
- Components:
  - Spinner360
  - Gallery
  - ItemCard
- Data: TanStack Query

---

## 10. DANH SÁCH FILE PHẢI SINH RA

AI PHẢI GEN ĐẦY ĐỦ CÁC FILE SAU:

```
docs/
 ├─ AI_RULES.md
 ├─ API_CONTRACT.md
 ├─ ARCHITECTURE.md
 ├─ DB_SCHEMA.md
 ├─ DOMAIN.md
 ├─ ENV.md
 ├─ ERROR_HANDLING.md
 ├─ PROMPT_TEMPLATE.md
 └─ TODO.md
.env.example
README.md
```

---

## 11. PROMPT TEMPLATE (KHI AI TỰ DÙNG)

Khi viết `PROMPT_TEMPLATE.md`, phải có:
- Ràng buộc không đổi API/DB khi chưa cập nhật docs
- Yêu cầu trả về file hoàn chỉnh
- Không trả lời lan man

---

## 12. TODO / ROADMAP

### MVP
- [x] CRUD item
- [x] Upload ảnh thường
- [x] Public catalog
- [x] Copy caption FB
- [x] Spinner
  - [x] Spin set
  - [x] Upload frame
  - [x] Spinner360 component

### Production-like
- [ ] Watermark
- [x] CSV export
- [ ] Docker compose
- [x] CI cơ bản
- [x] README polish

---

## 13. CÁCH THỰC HIỆN (BẮT BUỘC)

1. Dựa 100% vào file này
2. Sinh DOMAIN → DB → API → ERROR → ARCH → ENV → AI_RULES → TODO → README → PROMPT_TEMPLATE
3. Kiểm tra chéo, đảm bảo không mâu thuẫn
4. Trả về nội dung đầy đủ của từng file

---

## KẾT LUẬN

File này là luật gốc.
Không có quyền sáng tác ngoài phạm vi.
Mục tiêu cuối cùng: AI khác đọc xong là viết code đúng, đồng bộ, production-minded.

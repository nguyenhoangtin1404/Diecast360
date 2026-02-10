# API Contract – Diecast360

## Quy ước chung
- Base path: `/api/v1`.
- JSON keys: `snake_case`.
- Tất cả response bọc theo envelope:
  - Success:
    ```json
    {"ok": true, "data": {}, "message": ""}
    ```
  - Error:
    ```json
    {"ok": false, "error": {"code": "ERROR_CODE", "details": []}, "message": ""}
    ```
- Auth: HttpOnly Cookie (chính) hoặc Bearer Access Token (fallback) cho endpoint admin; chi tiết xem `COOKIE_AUTH.md`. Public endpoints không cần auth.
- ID: UUID.
- Upload: `multipart/form-data`, field file là `file` (ảnh thường) hoặc `frame` (ảnh spinner). Server dùng Sharp tạo thumbnail.

## Data shape
- `Item`: `{ id, name, description, scale, brand, car_brand, model_brand, condition, price, original_price, status, is_public, fb_post_content, cover_image_url, created_at, updated_at, deleted_at? }`.
- `ItemImage`: `{ id, item_id, url, thumbnail_url, is_cover, display_order, created_at }`.
- `SpinFrame`: `{ id, spin_set_id, frame_index, image_url, thumbnail_url, created_at }`.
- `SpinSet`: `{ id, item_id, label, is_default, frames: SpinFrame[], created_at, updated_at }`.
- Pagination: `{ page, page_size, total, total_pages }`.

## Auth
### POST /api/v1/auth/login
- Body JSON: `{ "email": "string", "password": "string" }`.
- Response 200: `data: { access_token, refresh_token, user }`.
- Errors: `AUTH_INVALID_CREDENTIALS (401)`, `VALIDATION_ERROR (422)`.

### POST /api/v1/auth/refresh
- Body JSON: `{ "refresh_token": "string" }`.
- Response 200: `data: { access_token, refresh_token }`.
- Errors: `AUTH_TOKEN_EXPIRED (401)`, `AUTH_FORBIDDEN (403)` nếu token bị revoke.

### POST /api/v1/auth/logout
- Body JSON: `{ "refresh_token": "string" }`.
- Response 200: `data: {}`.

### GET /api/v1/auth/me
- Auth: Bearer access token.
- Response 200: `data: { user }`.

## Items (admin)
### GET /api/v1/items
- Query: `page` (default 1), `page_size` (default 20), `status` (optional), `is_public` (optional), `q` (search theo tên).
- Response 200: `data: { items: Item[], pagination }` (mỗi item gồm cover_url + has_default_spin_set boolean).

### POST /api/v1/items
- Body JSON (snake_case):
  ```json
  {
    "name": "",
    "description": "",
    "scale": "1:64",
    "brand": "",
    "status": "con_hang",
    "is_public": false
  }
  ```
- Response 201: `data: { item }` (images/spin_sets rỗng).
- Errors: `VALIDATION_ERROR (422)`.

### GET /api/v1/items/:id
- Response 200: `data: { item, images: ItemImage[], spin_sets: SpinSet[] }` (frames sắp xếp theo `frame_index`).
- Errors: `NOT_FOUND (404)`.

### PATCH /api/v1/items/:id
- Body JSON: các field cho phép cập nhật `name/description/scale/brand/status/is_public`.
- Response 200: `data: { item }`.
- Errors: `VALIDATION_ERROR (422)`, `NOT_FOUND (404)`.

### DELETE /api/v1/items/:id
- Soft delete item.
- Response 200: `data: {}`.

## Item Images (admin)
### POST /api/v1/items/:id/images
- Content-Type: multipart/form-data, fields: `file` (bắt buộc), `is_cover` (optional boolean).
- Response 201: `data: { image: ItemImage }`.
- Errors: `UPLOAD_INVALID_TYPE (400)`, `UPLOAD_TOO_LARGE (413)`, `NOT_FOUND (404)` nếu item không tồn tại.

### PATCH /api/v1/items/:id/images/:image_id
- Body JSON: `{ "is_cover": true/false, "display_order": number }` (ít nhất 1 field).
- Setting `is_cover=true` sẽ bỏ cờ cover ở ảnh khác.
- Response 200: `data: { image: ItemImage }`.

### PATCH /api/v1/items/:id/images/order
- Body JSON: `{ "image_ids": ["uuid", ...] }` theo thứ tự mong muốn.
- Server cập nhật `display_order` liên tục từ 0.
- Response 200: `data: { images: ItemImage[] }`.

### DELETE /api/v1/items/:id/images/:image_id
- Xóa ảnh; nếu cover bị xóa → cover chuyển sang ảnh đầu tiên còn lại (nếu có).
- Response 200: `data: {}`.

## Spinner (admin)
### GET /api/v1/items/:id/spin-sets
- Response 200: `data: { spin_sets: SpinSet[] }` (mỗi set có danh sách frames đã sort `frame_index`).

### POST /api/v1/items/:id/spin-sets
- Body JSON: `{ "label": "", "is_default": false }`.
- Response 201: `data: { spin_set }`.
- Nếu `is_default=true`, server bỏ cờ default ở spin set khác của item.

### PATCH /api/v1/spin-sets/:id
- Body JSON: `{ "label": "", "is_default": true/false }`.
- Response 200: `data: { spin_set }`.
- Errors: `NOT_FOUND (404)`.

### POST /api/v1/spin-sets/:id/frames
- Content-Type: multipart/form-data.
- Fields: `frame_index` (optional int, mặc định append ở cuối), `frame` (bắt buộc, 1 file/1 request).
- Response 201: `data: { frame: SpinFrame }`.
- Errors: `SPIN_FRAME_INDEX_CONFLICT (409)` khi trùng `frame_index`, `UPLOAD_INVALID_TYPE/UPLOAD_TOO_LARGE`, `NOT_FOUND`.

### PATCH /api/v1/spin-sets/:id/frames/order
- Body JSON: `{ "frame_ids": ["uuid", ...] }` theo thứ tự mới.
- Server gán lại `frame_index` bắt đầu 0, không bỏ số.
- Response 200: `data: { frames: SpinFrame[] }`.

### DELETE /api/v1/spin-sets/:id/frames/:frame_id
- Xóa frame, server thu gọn `frame_index` còn lại.
- Response 200: `data: {}`.

## CSV Export (admin)
### GET /api/v1/items/export
- Response 200: `Content-Type: text/csv`, file CSV chứa danh sách item + trạng thái.

## AI (admin)
### POST /api/v1/items/:id/ai-description
- Body JSON: `{ "custom_instructions": "string (optional)" }`.
- Response 200: `data: { description }` (AI-generated description cho item).

### POST /api/v1/items/:id/fb-post
- Body JSON: `{ "custom_instructions": "string (optional)" }`.
- Response 200: `data: { content }` (AI-generated Facebook post cho item).

### POST /api/v1/items/ai-draft
- Content-Type: multipart/form-data, field `images` (1+ file ảnh, max 10MB, jpeg/png/webp).
- Response 200: `data: { draftId, aiJson, confidence, images }`.
- AI phân tích ảnh sản phẩm, tạo draft item với confidence scores.

## Public
### GET /api/v1/public/items
- Query: `page`, `page_size`, `status` (optional), `q`.
- Chỉ trả item `is_public=true` và chưa soft delete.
- Response 200: `data: { items: Item[], pagination }` (kèm `has_spinner` và `cover_image_url`).

### GET /api/v1/public/items/:id
- Response 200: `data: { item, images: ItemImage[], spinner: SpinSet|null }`.
- `spinner` lấy spin set default (nếu có). Nếu `null` → client dùng gallery ảnh thường.
- Errors: `NOT_FOUND (404)`.

## Validation chính
- Email: định dạng email, bắt buộc, unique.
- Password: bắt buộc ở login (server tự kiểm tra hash).
- Item: `name` bắt buộc; `status` chỉ nhận 3 giá trị quy định; `scale` không được rỗng; `is_public` boolean.
- Upload: chỉ nhận `ALLOWED_MIME`, kích thước ≤ `MAX_UPLOAD_MB`.
- Spinner: `frame_index` phải trong khoảng 0..n và không trùng; order phải đủ tất cả `frame_ids` hiện có.

## Lưu ý response
- URL trả về cho ảnh/frame phải là public URL (ghép `PUBLIC_BASE_URL` + path lưu trữ).
- Không trả password_hash/token_hash.
- Khi thay đổi API/DB, phải cập nhật docs trước rồi mới code.

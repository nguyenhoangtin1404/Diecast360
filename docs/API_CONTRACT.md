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
- `Item`: `{ id, name, description, scale, brand, car_brand, model_brand, condition, price, original_price, status, is_public, fb_post_content, cover_image_url, fb_post_url?, fb_posted_at?, fb_posts_count?, created_at, updated_at, deleted_at? }`.
- `FacebookPost`: `{ id, item_id, post_url, content, posted_at, created_at }`.
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
- Query: `page` (default 1), `page_size` (default 20), `status` (optional), `is_public` (optional), `q` (search theo tên), `car_brand` (optional), `model_brand` (optional), `condition` (optional), `fb_status=posted|not_posted` (optional).
- Response 200: `data: { items: Item[], pagination }`.
- Admin item list trả thêm:
  - `cover_image_url`
  - `has_default_spin_set`
  - `fb_post_url`: link Facebook mới nhất của item hoặc `null`
  - `fb_posted_at`: thời điểm post Facebook mới nhất hoặc `null`
  - `fb_posts_count`: tổng số Facebook post đã lưu cho item

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
- Response 200: `data: { item, images: ItemImage[], spin_sets: SpinSet[], facebook_posts: FacebookPost[] }` (frames sắp xếp theo `frame_index`, `facebook_posts` sắp xếp mới nhất trước).
- Errors: `NOT_FOUND (404)`.

### PATCH /api/v1/items/:id
- Body JSON: các field cho phép cập nhật `name/description/scale/brand/car_brand/model_brand/condition/price/original_price/status/is_public/fb_post_content`.
- Response 200: `data: { item }`.
- Errors: `VALIDATION_ERROR (422)`, `NOT_FOUND (404)`.

### POST /api/v1/items/:id/facebook-posts
- Body JSON: `{ "post_url": "https://facebook.com/...", "content": "string (optional)" }`.
- `content` là snapshot caption tại thời điểm lưu link; nếu omitted server có thể fallback sang `item.fb_post_content`.
- Response 201: `data: { post: FacebookPost }`.
- Example request:
  ```json
  {
    "post_url": "https://www.facebook.com/share/p/abc123",
    "content": "🔥 MiniGT Skyline R34 cực đẹp, full box, còn hàng!"
  }
  ```
- Example response:
  ```json
  {
    "ok": true,
    "data": {
      "post": {
        "id": "fb-post-1",
        "item_id": "item-123",
        "post_url": "https://www.facebook.com/share/p/abc123",
        "content": "🔥 MiniGT Skyline R34 cực đẹp, full box, còn hàng!",
        "posted_at": "2026-03-13T10:20:30.000Z",
        "created_at": "2026-03-13T10:20:30.000Z"
      }
    },
    "message": ""
  }
  ```
- Errors: `VALIDATION_ERROR (422)`, `NOT_FOUND (404)`.

### POST /api/v1/items/:id/facebook-posts/publish
- Tự động đăng bài lên Facebook Page qua Graph API.
- Body JSON: `{ "content": "string (optional)" }`.
- Nếu `content` omitted, sử dụng `item.fb_post_content` làm caption.
- Response 201: `data: { post: FacebookPost }`.
- Example request:
  ```json
  {
    "content": "🔥 MiniGT Skyline R34 mới về, form đẹp!"
  }
  ```
- Example response:
  ```json
  {
    "ok": true,
    "data": {
      "post": {
        "id": "fb-post-auto-1",
        "item_id": "item-123",
        "post_url": "https://www.facebook.com/123456789_987654321",
        "content": "🔥 MiniGT Skyline R34 mới về, form đẹp!",
        "posted_at": "2026-03-16T10:00:00.000Z",
        "created_at": "2026-03-16T10:00:00.000Z"
      }
    },
    "message": ""
  }
  ```
- Errors:
  - `NOT_FOUND (404)`: item không tồn tại.
  - `VALIDATION_ERROR (422)`: chưa có nội dung hoặc chưa cấu hình Facebook.
  - `FACEBOOK_AUTH_ERROR (401)`: token không hợp lệ hoặc đã hết hạn.
  - `FACEBOOK_PERMISSION_ERROR (403)`: token không có quyền publish.
  - `RATE_LIMIT_EXCEEDED (429)`: vượt giới hạn gọi Facebook API.
  - `FACEBOOK_PUBLISH_ERROR (502)`: lỗi không xác định từ Facebook.

### DELETE /api/v1/items/:id/facebook-posts/:postId
- Xóa 1 Facebook post record khỏi lịch sử item.
- Response 200: `data: {}`.
- Example response:
  ```json
  {
    "ok": true,
    "data": {},
    "message": ""
  }
  ```
- Errors: `NOT_FOUND (404)`.

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
- Response 200:
  ```json
  {
    "short_description": "...",
    "long_description": "...",
    "bullet_specs": ["..."],
    "meta_title": "...",
    "meta_description": "..."
  }
  ```
- Lưu ý: payload trên sẽ nằm trong envelope chuẩn `data: { ... }`.
- Example request:
  ```json
  {
    "custom_instructions": "Nhấn mạnh tình trạng mới và độ hiếm cho collector."
  }
  ```
- Example response:
  ```json
  {
    "ok": true,
    "data": {
      "short_description": "MiniGT Skyline R34 bản collector, tình trạng mới, hộp đẹp, phù hợp trưng bày.",
      "long_description": "Mẫu MiniGT Skyline R34 dành cho người chơi diecast đang tìm một bản sưu tầm đẹp mắt, tình trạng mới...",
      "bullet_specs": [
        "Brand: MiniGT",
        "Model: Skyline R34",
        "Scale: 1:64"
      ],
      "meta_title": "MiniGT Skyline R34 1:64 cho collector",
      "meta_description": "MiniGT Skyline R34 tỷ lệ 1:64, tình trạng mới, phù hợp sưu tầm và trưng bày."
    },
    "message": ""
  }
  ```
- Errors:
  - `NOT_FOUND (404)`: item không tồn tại.
  - `VALIDATION_ERROR (422)`: API key AI thiếu hoặc request gửi tới provider không hợp lệ.
  - `RATE_LIMIT_EXCEEDED (429)`: vượt giới hạn gọi AI provider.
  - `INTERNAL_SERVER_ERROR (500)`: provider lỗi hoặc trả về payload không parse/validate được.

### POST /api/v1/items/:id/fb-post
- Body JSON: `{ "custom_instructions": "string (optional)" }`.
- Response 200: `data: { content }` (AI-generated Facebook post cho item).
- Example request:
  ```json
  {
    "custom_instructions": "Viết ngắn gọn, giọng casual, có CTA inbox."
  }
  ```
- Example response:
  ```json
  {
    "ok": true,
    "data": {
      "content": "🔥 MiniGT Skyline R34 mới về, form đẹp, hộp đẹp, cực hợp anh em collector. Inbox để chốt nhanh! #diecast #mohinh #collector"
    },
    "message": ""
  }
  ```
- Errors:
  - `NOT_FOUND (404)`: item không tồn tại.
  - `VALIDATION_ERROR (422)`: API key AI thiếu hoặc request gửi tới provider không hợp lệ.
  - `RATE_LIMIT_EXCEEDED (429)`: vượt giới hạn gọi AI provider.
  - `INTERNAL_SERVER_ERROR (500)`: provider lỗi hoặc không trả nội dung usable.

### POST /api/v1/items/ai-draft
- Content-Type: multipart/form-data, field `images` (1+ file ảnh, max 10MB, jpeg/png/webp).
- Response 200: `data: { draftId, aiJson, confidence, images }`.
- AI phân tích ảnh sản phẩm, tạo draft item với confidence scores.
- Nếu lưu file draft thành công nhưng tạo DB record thất bại, server phải cleanup các file draft đã ghi để tránh orphaned storage state.
- Example request:
  - `multipart/form-data`
  - field `images`: `box.jpg`, `bottom.jpg`, `overview.jpg`
- Example response:
  ```json
  {
    "ok": true,
    "data": {
      "draftId": "draft-123",
      "aiJson": {
        "brand": "MiniGT",
        "car_brand": "Nissan",
        "model_brand": "Skyline R34",
        "scale": "1:64",
        "color": "Blue",
        "product_code": "MGT-009"
      },
      "confidence": {
        "brand": 0.94,
        "model_brand": 0.89,
        "scale": 0.73
      },
      "images": [
        "https://cdn.example.com/uploads/drafts/img1.jpg",
        "https://cdn.example.com/uploads/drafts/img2.jpg",
        "https://cdn.example.com/uploads/drafts/img3.jpg"
      ]
    },
    "message": ""
  }
  ```
- Errors:
  - `VALIDATION_ERROR (422)`: API key AI thiếu hoặc provider request không hợp lệ.
  - `RATE_LIMIT_EXCEEDED (429)`: vượt giới hạn gọi AI provider.
  - `UPLOAD_INVALID_TYPE (400)`: file không đúng định dạng hỗ trợ.
  - `UPLOAD_TOO_LARGE (413)`: file vượt giới hạn kích thước.
  - `INTERNAL_SERVER_ERROR (500)`: provider trả payload lỗi, storage lỗi, hoặc draft persistence lỗi.

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

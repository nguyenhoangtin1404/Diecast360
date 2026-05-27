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
- CSRF: với cookie auth, mọi request thay đổi trạng thái (`POST`/`PATCH`/`DELETE`) cần header `X-CSRF-Token` khớp cookie đọc được `csrf_token`, trừ `POST /api/v1/auth/login`. Lấy/rotate token qua `GET /api/v1/auth/csrf`.
- ID: UUID.
- Upload: `multipart/form-data`, field file là `file` (ảnh thường) hoặc `frame` (ảnh spinner). Server dùng Sharp tạo thumbnail.
- RBAC tenant: `shop_admin` có quyền đọc/ghi trong active shop; `shop_staff` hiện là read-only cho các HTTP method mutating (`POST`/`PATCH`/`DELETE`) trừ route nào được đánh dấu exception trong code.

## Data shape
- `ItemStatus`: `"con_hang" | "giu_cho" | "da_ban" | "preorder"`. Transition rules: `con_hang`/`giu_cho` → any; `da_ban` → `con_hang` only (re-stock, tự set quantity=1); `da_ban → preorder`/`giu_cho` bị chặn; `preorder` → `con_hang` (hàng về, tự trigger cập nhật đơn `WAITING_FOR_GOODS→ARRIVED`) hoặc `preorder` → `da_ban` (nhà cung cấp hủy, quantity=0).
- `Item`: `{ id, shop_id?, name, description, scale, brand, car_brand, model_brand, condition, price, original_price, preorder_price?, status: ItemStatus, quantity, attributes, notes?, is_public, fb_post_content, preorder_closes_at?, cover_image_url, fb_post_url?, fb_posted_at?, fb_posts_count?, created_at, updated_at, deleted_at? }`. `preorder_closes_at` — ISO-8601 hoặc `null`; chỉ có ý nghĩa khi `status = "preorder"`. `preorder_price` — giá áp dụng khi preorder đang mở; `null` hoặc thiếu = dùng `price` thông thường. Luôn được lưu trong DB bất kể status (không tự xóa khi item đổi status); catalog quyết định hiển thị giá nào.
- `attributes`: object phẳng `Record<string, string | number | boolean | null>`, tối đa 50 key, key phải được trim và không được dùng các tên dự phòng như `__proto__`, `constructor`, `prototype`.
- `FacebookPost`: `{ id, item_id, post_url, content, posted_at, created_at }`.
- `User`: `{ id, email, full_name, role, platform_role?, is_active?, allowed_shop_ids: string[], shop_roles?, allowed_shops?, active_shop_id? }`.
- `Shop`: `{ id, name, slug, is_active, contact_json?, appearance_json?, loyalty_json?, created_at, updated_at, _count? }`.
- `ItemImage`: `{ id, item_id, url, thumbnail_url, is_cover, display_order, created_at }`.
- `SpinFrame`: `{ id, spin_set_id, frame_index, image_url, thumbnail_url, created_at }`.
- `SpinSet`: `{ id, item_id, label, is_default, frames: SpinFrame[], created_at, updated_at }`.
- `PreOrderStatus`: `PENDING_CONFIRMATION | WAITING_FOR_GOODS | ARRIVED | PAID | REFUNDED | CANCELLED`.
- `PreOrder`: `{ id, shop_id, item_id, user_id?, member_id?, status, quantity, unit_price?, total_amount?, deposit_amount, paid_amount, expected_arrival_at?, expected_delivery_at?, cover_image_url?, note?, created_at, updated_at, cancelled_at?, completed_at? }`.
- `Member`: `{ id, shop_id, full_name, email?, phone?, points_balance, tier_id?, tier?, created_at, updated_at }`.
- `MembershipTier`: `{ id, shop_id, name, rank, min_points, created_at, updated_at }`.
- `InventoryTransaction`: `{ id, shop_id, item_id, actor_user_id?, reversal_of_id?, type, quantity, delta, resulting_quantity, reason, note?, created_at }`.
- Pagination: `{ page, page_size, total, total_pages }`.

## Health
### GET /api/v1/health
- Public, không auth, không CSRF; dùng cho liveness + deploy probe.
- Response 200: qua envelope chuẩn, `data` hiện chứa payload controller `{ ok: true, status: "healthy" }`.
- Response 503 khi DB probe `SELECT 1` lỗi.

## Auth
### GET /api/v1/auth/csrf
- Public safe method; issue cookie đọc được `csrf_token` và trả cùng giá trị để client gửi lại trong header `X-CSRF-Token` cho request mutating sau đó.
- Response 200: `data: { csrf_token }`.

### POST /api/v1/auth/login
- Body JSON: `{ "email": "string", "password": "string" }`.
- CSRF: exempt để bootstrap phiên đăng nhập.
- Response 200: set cookie HttpOnly `access_token`, HttpOnly `refresh_token` (path `/api/v1/auth`) và cookie đọc được `csrf_token`; `data: { user, message }`. Token không trả trong body.
- Response header: `X-Trace-Id` — UUIDv7 định danh request này; có mặt trên cả response thành công lẫn thất bại (kể cả validation, sai credential, rate limit). Timestamp có thể suy ra từ giá trị này (48-bit ms prefix).
- Mọi lần gọi endpoint này đều ghi một bản ghi vào `login_audit_logs` với `trace_id`, `email`, `ip_address`, `user_agent`, `status` (`success`|`failed`) và `failure_reason` khi thất bại.
- `failure_reason` khi thất bại: `validation_error` (422/400), `invalid_credentials` (401), `rate_limited` (429), `internal_error` (lỗi khác).
- Errors: `AUTH_INVALID_CREDENTIALS (401)`, `VALIDATION_ERROR (422)`.

### POST /api/v1/auth/refresh
- Auth: đọc `refresh_token` từ cookie path `/api/v1/auth`.
- CSRF: cần `X-CSRF-Token`.
- Response 200: rotate refresh/access cookies, issue lại `csrf_token`; `data: { message }`.
- Errors: `AUTH_TOKEN_EXPIRED (401)`, `AUTH_FORBIDDEN (403)` nếu token bị revoke.

### POST /api/v1/auth/logout
- Auth: đọc `refresh_token` từ cookie nếu có, revoke token, clear `access_token`, `refresh_token`, `csrf_token`.
- CSRF: cần `X-CSRF-Token`.
- Response 200: `data: { message }`.

### GET /api/v1/auth/me
- Auth: Bearer access token hoặc Cookie.
- Response 200: `data: { user }`. `user` gồm (không giới hạn): `allowed_shop_ids`, `shop_roles` (`{ shop_id, role }[]`), `allowed_shops` (`[{ id, name, slug, is_active, role }]`), `active_shop_id` (từ JWT khi đã switch shop).

### POST /api/v1/auth/switch-shop
- Body JSON: `{ "shop_id": "UUID" }`.
- CSRF: cần `X-CSRF-Token` khi dùng cookie auth.
- Thay đổi `active_shop_id` trong session, server issue lại HTTP-only cookie mới.
- Response 200: `data: { active_shop: { id, name, slug, is_active, role }, message?: string }`.
- Errors: `VALIDATION_ERROR`/HTTP 400 nếu `shop_id` không phải UUID; `AUTH_FORBIDDEN (403)` nếu user không thuộc shop hoặc shop không active.

## Shops (Platform Super)
### GET /api/v1/admin/shops
- Auth: `platform_role = platform_super`.
- Response 200: envelope chuẩn `ok`, `message`; **`data` là trực tiếp `Shop[]`** (mảng shop, không bọc `{ shops: ... }`). Mỗi phần tử gồm trường shop (`id`, `name`, `slug`, `is_active`, `created_at`, `updated_at`) và **`_count`**: `{ items: number, user_roles: number }`.
- Errors: `AUTH_FORBIDDEN (403)` nếu không phải platform super.

### GET /api/v1/admin/shops/:id
- Auth: `platform_role = platform_super`.
- Response 200: `data` là **một** `Shop` (cùng shape `_count` như trên).
- Errors: `NOT_FOUND` nếu không tồn tại.

### POST /api/v1/admin/shops
- Auth: `platform_role = platform_super`.
- Body JSON: `{ "name": "string", "slug": "string (optional)" }`. Nếu bỏ qua `slug`, server tạo slug duy nhất từ `name` (chữ thường, dấu gạch ngang).
- Response 201: `data` là **bản ghi `Shop`** vừa tạo (không bọc `{ shop: ... }`).

### PATCH /api/v1/admin/shops/:id
- Auth: `platform_role = platform_super`.
- Body JSON: `{ "name": "string (optional)", "is_active": "boolean (optional)" }`.
- Response 200: `data` là **bản ghi `Shop`** sau cập nhật.

### PATCH /api/v1/admin/shops/:id/deactivate
- Auth: `platform_role = platform_super`.
- Response 200: `data` là **bản ghi `Shop`** với `is_active: false`.

### GET /api/v1/admin/shops/:id/members
- Auth: `platform_role = platform_super`.
- Query: `page` (default `1`), `page_size` (default `20`, max `100`).
- Response 200: `data: { members, pagination }` với:
  - `members`: mảng bản ghi `user_shop_roles`: `{ user_id, shop_id, role, user: { id, email, full_name, role, is_active } }[]`
  - `pagination`: `{ page, page_size, total, total_pages }`

### GET /api/v1/admin/shops/:id/items
- Auth: `platform_role = platform_super`.
- Query: `page`, `page_size`, `q`, `status`.
- Response 200: `data: { items, pagination }` scoped theo shop.

### GET /api/v1/admin/shops/:id/audit-logs
- Auth: `platform_role = platform_super`.
- Query: `page`, `page_size`, `action`.
- Response 200: `data: { logs, pagination }`.

### POST /api/v1/admin/shops/:id/members
- Auth: `platform_role = platform_super`.
- Body JSON (option):
  - Add existing user by id: `{ "user_id": "UUID", "role": "shop_admin|shop_staff" }`
  - Add existing or create new user by email:
    - `{ "email": "string", "password": "string (optional but required when user does not exist)", "full_name": "string (optional)", "role": "shop_admin|shop_staff" }`
  - (Nếu thiếu cả `user_id` lẫn `email`, server trả lỗi validation.)
- Behavior: server gán user vào shop với role đã chọn (default `shop_admin`) bằng upsert theo cặp `(user_id, shop_id)`.
- Response 200: `data` là bản ghi `user_shop_roles` sau khi upsert (`user_id`, `shop_id`, `role`).
- Errors: `NOT_FOUND (404)` nếu shop hoặc user không tồn tại; `VALIDATION_ERROR (422)` nếu body không hợp lệ.

### POST /api/v1/admin/shops/:id/members/:userId/reset-password
- Auth: `platform_role = platform_super`.
- Body JSON: `{ "password": "string" }`.
- Response 200: reset mật khẩu user trong shop và ghi audit log.

### PATCH /api/v1/admin/shops/:id/members/:userId/active
- Auth: `platform_role = platform_super`.
- Body JSON: `{ "is_active": true|false }`.
- Response 200: cập nhật trạng thái tài khoản và ghi audit log.

## Shop settings (tenant)
Các route dưới đây yêu cầu JWT đã gắn `active_shop_id` hợp lệ.

### GET /api/v1/shop-settings
- Auth: `shop_admin` hoặc `shop_staff`.
- Response 200: `data` gồm shop hiện tại, `contact`, `appearance`, `loyalty`.

### PATCH /api/v1/shop-settings
- Auth: `shop_admin`.
- Body JSON: `{ "contact": {...}, "appearance": {...}, "loyalty": {...} }` (field optional theo DTO).
- Response 200: settings sau cập nhật.

### POST /api/v1/shop-settings/branding-upload
- Auth: `shop_admin`; throttled.
- Content-Type: `multipart/form-data`; field `file`, body `kind=logo|favicon`.
- Response 201: URL/path asset branding đã upload.

## Categories
### GET /api/v1/categories
- Public optional JWT.
- Query: `type=car_brand|model_brand`, `shop_id` optional, `is_active` optional.
- Response 200: global categories + category theo shop explicit/JWT khi có context.

### POST /api/v1/categories
- Auth: `platform_role = platform_super`.
- Tạo category global (`shop_id = null`).

### POST /api/v1/categories/shop
- Auth: `shop_admin` với active shop.
- Tạo category scoped theo shop hiện tại.

### GET/PATCH/PATCH toggle/DELETE /api/v1/categories/:id
- `GET` public optional JWT.
- `PATCH`, `PATCH :id/toggle`, `DELETE` cho platform super hoặc `shop_admin`; platform super thao tác global/shop, shop admin chỉ category trong tenant hiện tại.

## Items (admin)
Các route dưới đây yêu cầu JWT đã gắn **active shop** (`active_shop_id`). `shop_admin` ghi được; `shop_staff` chỉ đọc theo guard chung. Nếu user chưa gọi `POST /auth/switch-shop` cho shop hợp lệ, server trả **HTTP 400** với message hướng dẫn switch shop (không dùng 403 vì đây là thiếu context tenant, không phải từ chối quyền).

### GET /api/v1/items
- Query: `page` (default 1), `page_size` (default 20), `status` (optional), `is_public` (optional), `q` (search theo tên), `car_brand` (optional), `model_brand` (optional), `condition` (optional), `fb_status=posted|not_posted` (optional), `preorder_open=true` (optional — lọc chỉ item `status=preorder` có cửa sổ đặt hàng còn mở, tức `preorder_closes_at IS NULL OR preorder_closes_at > NOW()`).
- Response 200: `data: { items: Item[], pagination }`.
- Admin item list trả thêm:
  - `cover_image_url`
  - `has_default_spin_set`
  - `fb_post_url`: link Facebook mới nhất của item hoặc `null`
  - `fb_posted_at`: thời điểm post Facebook mới nhất hoặc `null`
  - `fb_posts_count`: tổng số Facebook post đã lưu cho item

### GET /api/v1/items/search
- Query: `q` (optional). Nếu thiếu `q`, server fallback về list item tenant hiện tại.
- Response 200: semantic/vector search nếu Pinecone được cấu hình; nếu không dùng fallback service hiện tại.

### POST /api/v1/items
- Body JSON (snake_case):
  ```json
  {
    "name": "",
    "description": "",
    "scale": "1:64",
    "brand": "",
    "status": "con_hang",
    "quantity": 1,
    "attributes": {
      "color": "red",
      "limited": true
    },
    "is_public": false
  }
  ```
- `quantity` là integer `>= 0`. Nếu `status = "da_ban"` server sẽ ép `quantity = 0` bất kể payload gửi lên. Nếu `status = "preorder"` quantity giữ nguyên giá trị yêu cầu (không ép về 0).
- `attributes` là object phẳng; nested object/array không hợp lệ.
- Response 201: `data: { item }` (images/spin_sets rỗng).
- Errors: `VALIDATION_ERROR (422)`.

### GET /api/v1/items/:id
- Response 200: `data: { item, images: ItemImage[], spin_sets: SpinSet[], facebook_posts: FacebookPost[] }` (frames sắp xếp theo `frame_index`, `facebook_posts` sắp xếp mới nhất trước).
- Errors: `NOT_FOUND (404)`.

### GET /api/v1/items/:id/qr
- Auth: admin (JwtAuthGuard + TenantGuard + RolesGuard — shop_admin hoặc shop_staff).
- Tạo mã QR cho sản phẩm theo tenant. Nếu `qr_token` chưa tồn tại, server sinh token 16-char hex ngẫu nhiên, lưu vào DB (unique), rồi trả về. Token được giữ cố định — in QR một lần, dùng lâu dài.
- Response 200: `data: { token: string, resolve_url: string, image_data_url: string }`.
  - `token`: mã định danh ngắn.
  - `resolve_url`: URL đầy đủ nhúng trong QR (trỏ đến `GET /public/qr/:token`).
  - `image_data_url`: chuỗi `data:image/png;base64,...` — client render thẳng vào `<img src>` hoặc dùng làm href để tải PNG.
- Errors: `NOT_FOUND (404)` khi item không thuộc tenant, `INTERNAL_SERVER_ERROR (500)` khi không thể tạo token unique sau 3 lần thử.

### PATCH /api/v1/items/:id
- Body JSON: các field cho phép cập nhật `name/description/scale/brand/car_brand/model_brand/condition/price/original_price/preorder_price/status/quantity/attributes/is_public/fb_post_content/preorder_closes_at`. `preorder_closes_at` nhận ISO-8601 string hoặc `null`; khi `status` rời `preorder` service tự xóa trường này bất kể payload. `preorder_price` — giá preorder; **luôn được lưu trong DB** bất kể status (admin theo dõi được); catalog hiển thị giá này khi preorder đang mở, ngược lại dùng `price`.
- Invariant: item `da_ban` luôn có `quantity = 0`; client không thể giữ stock > 0 khi đã bán.
- Khi PATCH chuyển hoặc đặt `status = "da_ban"`, server ghi `quantity = 0` (bỏ qua `quantity` khác 0 trong body nếu có).
- Khi item đã `da_ban` và body **không** gửi `quantity`, server có thể **không** cập nhật cột `quantity` trong DB (vẫn 0); nếu body có `quantity`, server vẫn ép về `0` trước khi lưu.
- Khi PATCH chuyển `status` từ `da_ban` sang `con_hang` mà body **không** gửi `quantity`, server tự động set `quantity = 1`.
- Khi PATCH chuyển `status` từ `preorder` sang `con_hang`, server tự động cập nhật tất cả đơn pre-order của item đang ở `WAITING_FOR_GOODS` sang `ARRIVED` (trong cùng transaction).
- Khi PATCH chuyển `status` từ `preorder` sang `da_ban` (nhà cung cấp hủy): server ép `quantity = 0`, tự động hủy các đơn có `paid_amount = 0` (chưa thu cọc) sang `CANCELLED`. Các đơn đã có cọc (`paid_amount > 0`) giữ nguyên để admin xử lý thủ công.
- Transition không hợp lệ (ví dụ `da_ban → preorder`) trả về `ITEM_STATUS_TRANSITION_INVALID (422)`.
- Response 200: `data: { item, preorders_arrived_count: number, preorders_pending_count: number, preorders_auto_cancelled_count: number, preorders_with_deposit_count: number }`. Các count field luôn có giá trị (0 nếu không có auto-trigger). `preorders_pending_count` là số đơn `PENDING_CONFIRMATION` còn lại sau khi `preorder → con_hang` (không bị auto-advance, cần xử lý thủ công).

### PATCH /api/v1/items/:id/close-preorder
- Auth: JWT + active shop (**shop_admin only** — shop_staff bị từ chối 403).
- Đóng sớm cửa sổ preorder bằng cách set `preorder_closes_at = NOW()`. Thao tác atomic (transaction).
- Lỗi `VALIDATION_ERROR (422)` nếu item không phải `status = "preorder"` hoặc preorder đã đóng rồi.
- Response 200: `data: { item }`.

### PATCH /api/v1/items/:id/reopen-preorder
- Auth: JWT + active shop (**shop_admin only** — shop_staff bị từ chối 403).
- Mở lại preorder đã đóng bằng cách xóa `preorder_closes_at` (open-ended). Admin có thể đặt lại deadline qua PATCH thông thường. Thao tác atomic (transaction).
- Lỗi `VALIDATION_ERROR (422)` nếu item không phải `status = "preorder"` hoặc preorder chưa đóng.
- Response 200: `data: { item }`.

### GET /api/v1/preorders/admin/campaigns/:itemId/summary
- Auth: JWT + active shop (shop_admin hoặc shop_staff).
- Response 200: `data: { pending: number, waiting: number, arrived: number, total: number, cancelable: number, with_deposit: number }`.
  - `pending`: đơn `PENDING_CONFIRMATION`; `waiting`: đơn `WAITING_FOR_GOODS`; `arrived`: đơn `ARRIVED`.
  - `total`: tổng ba trạng thái trên.
  - `cancelable`: đơn `PENDING_CONFIRMATION | WAITING_FOR_GOODS` có `paid_amount = 0` (sẽ bị tự hủy nếu item chuyển sang `da_ban`).
  - `with_deposit`: đơn `PENDING_CONFIRMATION | WAITING_FOR_GOODS` có `paid_amount > 0` (cần xử lý thủ công).
- Dùng để hiển thị campaign widget trong admin item detail và populate modal xác nhận trước `preorder → da_ban`.

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
- Query: `page`, `page_size`, `status` (optional), `q`, `car_brand`, `model_brand`, `condition=new|old`, `preorder_open=true` (optional — xem mô tả tương tự `GET /items`), `sort_by=name|price|created_at`, `sort_order=asc|desc`.
- Response item shape gồm thêm `preorder_closes_at` (ISO-8601 hoặc `null`) và `preorder_price` (number hoặc `null`).
- **`shop_id` (optional):** giới hạn catalog theo một shop. Giá trị hợp lệ:
  - UUID của `Shop.id`, hoặc
  - Chuỗi **khớp chính xác** `Shop.slug` (phân biệt hoa thường).
- Shop phải `is_active: true`. Slug/UUID không tồn tại hoặc shop không active → **`NOT_FOUND (404)`**, message ổn định (ví dụ shop không tìm thấy).
- **Ưu tiên:** Nếu request có `shop_id` hợp lệ, server **bỏ qua** `active_shop_id` từ JWT khi lọc catalog (tránh lệch tenant khi admin đang switch shop trong cùng trình duyệt).
- **Khi bỏ qua `shop_id`:** Nếu có JWT với `active_shop_id` thì lọc theo shop đó. Nếu là khách anonymous:
  - `NODE_ENV=production`: trả `PUBLIC_SHOP_REQUIRED (422)` để tránh aggregate toàn bộ shop.
  - Non-production: vẫn có thể trả aggregate public để tiện dev/test.
  Single-tenant deploy nên set `VITE_PUBLIC_CATALOG_SHOP_ID` để frontend luôn gửi shop scope.

### GET /api/v1/public/qr/:token
- Public, không auth, không CSRF.
- Resolve token QR → redirect 302 về trang chi tiết sản phẩm trên frontend.
- Redirect target: `{FRONTEND_URL}/items/:item_id?shop_id=:shop_id&source=qr&action=view`.
- Validate: token tồn tại + item chưa xóa mềm + `is_public = true` + shop đang active.
- Errors: `NOT_FOUND (404)` khi token không hợp lệ, item không còn public, hoặc shop không active. Không dùng redirect khi có lỗi — trả JSON lỗi bình thường để client / scanner hiển thị thông báo thân thiện.
- Contract mở rộng: query `action` trong redirect URL có thể là `view` (MVP), `add_to_cart`, `checkout` (future). Frontend đọc `action` nhưng fallback về `view` nếu chưa hỗ trợ.

### GET /api/v1/public/items/:id
- Query: **`shop_id` (optional)** — cùng quy tắc như `GET /public/items` (UUID hoặc slug, shop active, 404 nếu không resolve được).
- **Ưu tiên** giống list: `shop_id` query ghi đè `active_shop_id` của JWT cho việc lọc theo shop.
- Response 200: `data: { item, images: ItemImage[], spinner: SpinSet|null }`.
- `spinner` lấy spin set default (nếu có). Nếu `null` → client dùng gallery ảnh thường.
- Errors: `NOT_FOUND (404)` khi item không tồn tại, không public, đã xóa mềm, hoặc **không thuộc shop** đã chọn khi đang lọc theo shop.

### GET /api/v1/public/shops/:shopId/contact
- Public optional JWT.
- `shopId` là UUID hoặc slug shop active. Nếu không resolve được → `NOT_FOUND`.
- Production áp dụng cùng rule scope như catalog; contact luôn shop-scoped, không có aggregate.
- Response 200: `data: { shop: { id, name, slug }, contact, appearance }`.

## Preorders
Các route admin yêu cầu JWT + `active_shop_id`; `shop_admin` ghi được, `shop_staff` chỉ đọc theo guard chung.

### POST /api/v1/preorders
- Body JSON: `{ "item_id": "uuid", "member_id": "uuid", "user_id?": "uuid", "quantity": 1, "unit_price?": 0, "deposit_amount?": 0, "paid_amount?": 0, "expected_arrival_at?": "ISO", "expected_delivery_at?": "ISO", "note?": "string", "cover_image_url?": "https://..." }`.
- Response 201: `data: { pre_order }`.

### PATCH /api/v1/preorders/:id
- Body JSON: các field cho phép cập nhật từ create DTO, ngoại trừ status.
- Không cho đổi member/item/amount khi đơn đã `PAID`, `REFUNDED`, hoặc `CANCELLED`.
- Response 200: `data: { pre_order }`.

### PATCH /api/v1/preorders/:id/status
- Body JSON: `{ "status": "PENDING_CONFIRMATION|WAITING_FOR_GOODS|ARRIVED|PAID|REFUNDED|CANCELLED" }`.
- State machine: `PENDING_CONFIRMATION → WAITING_FOR_GOODS|CANCELLED → ARRIVED|CANCELLED → PAID|CANCELLED → REFUNDED`; `REFUNDED` và `CANCELLED` terminal.
- Khi `PAID`/`REFUNDED`, service cập nhật member points ledger theo loyalty settings nếu có member.

### GET /api/v1/preorders/admin
- Query: `status`, `item_id`, `page`, `page_size`.
- Response 200: `data: { pre_orders, pagination }`.

### GET /api/v1/preorders/admin/summary
- Response 200: summary dashboard cho pre-order trong tenant hiện tại.

### GET /api/v1/preorders/admin/campaigns/:itemId/participants
- Query: `status`, `page`, `page_size`.
- Response 200: participants/pre-orders theo campaign item.

### GET /api/v1/preorders/public
- Public.
- Query bắt buộc: `shop_id` (UUID). Optional: `status`, `item_id`, `page`, `page_size`.
- Response 200: public cards cho pre-order của shop.

### GET /api/v1/preorders/my-orders
- Auth: JWT + active shop.
- Query: `status`, `item_id`, `page`, `page_size`.
- Response 200: đơn pre-order của user hiện tại trong tenant.

## Inventory
Các route yêu cầu JWT + active shop; `shop_admin` ghi được, `shop_staff` chỉ đọc theo guard chung.

### POST /api/v1/inventory/items/:itemId/transactions
- Body JSON: `{ "type": "stock_in|stock_out|adjustment", "quantity": 1, "reason": "string", "note?": "string", "adjustment_delta?": 0, "allow_negative_stock?": false }`.
- Response 201: transaction vừa tạo và quantity item sau cập nhật.

### GET /api/v1/inventory/items/:itemId/transactions
- Query: `page`, `page_size`, `type`.
- Response 200: `data: { transactions, pagination }`.

### GET /api/v1/inventory/items/:itemId/transactions/reconciliation
- Response 200: reconciliation giữa item quantity hiện tại và ledger.

### POST /api/v1/inventory/items/:itemId/transactions/:transactionId/reverse
- Body JSON: `{ "reason": "string", "note?": "string" }`.
- Response 201: transaction đảo chiều.

## Reports
Các route yêu cầu JWT + active shop; role `shop_admin` hoặc `shop_staff`.

### GET /api/v1/reports/summary
- Query: `range=7d|30d|90d`.
- Response 200: `{ range, from, to, summary }`, gồm stock in/out/adjustment, pre-order created/paid, revenue, Facebook post count, current stock, active preorders.

### GET /api/v1/reports/trends
- Query: `range=7d|30d|90d`, `bucket=day|week`.
- Response 200: `{ range, bucket, from, to, series }`.

## Members
Các route yêu cầu JWT + active shop; `shop_admin` ghi được, `shop_staff` chỉ đọc theo guard chung.

### GET/POST /api/v1/members
- `GET` query: `q`, `page`, `page_size`.
- `POST` body: `{ "full_name": "string", "email?": "email", "phone?": "string" }`.

### GET/PATCH/DELETE /api/v1/members/:id
- `PATCH` body: field member optional (`full_name`, `email`, `phone`, `tier_id`).
- `DELETE` xóa member trong tenant hiện tại.

### GET /api/v1/members/:id/ledger
- Query: `page`, `page_size`.
- Response 200: `data: { ledger, pagination }`.

### POST /api/v1/members/:id/points-adjustments
- Body JSON: `{ "type": "earn|redeem|adjust", "points": 1, "reason": "string", "note?": "string" }`.
- `earn`/`redeem` yêu cầu points dương; `adjust` cho phép số âm/dương nhưng không được `0`.

### GET/POST/PATCH/DELETE /api/v1/members/tiers
- `GET /tiers`: list tier.
- `POST /tiers`: `{ "name": "string", "rank": 1, "min_points": 0 }`.
- `PATCH /tiers/:tierId`: field optional.
- `DELETE /tiers/:tierId`: xóa tier trong tenant.

## Validation chính
- Email: định dạng email, bắt buộc, unique.
- Password: bắt buộc ở login (server tự kiểm tra hash).
- Item: `name` bắt buộc; `status` chỉ nhận 3 giá trị quy định; `scale` không được rỗng; `is_public` boolean; `quantity` là số nguyên `>= 0`; `attributes` phải là flat object hợp lệ.
- Preorder: `quantity >= 1`; `member_id` bắt buộc khi tạo admin; `status` chỉ nhận `PreOrderStatus` và phải đi qua transition hợp lệ.
- Member points: `earn`/`redeem` dùng points dương; `adjust` cho phép số âm/dương nhưng không được `0`.
- Upload: chỉ nhận `ALLOWED_MIME`, kích thước ≤ `MAX_UPLOAD_MB`.
- Spinner: `frame_index` phải trong khoảng 0..n và không trùng; order phải đủ tất cả `frame_ids` hiện có.

## Lưu ý response
- **Lưu trữ media (`STORAGE_DRIVER`):**
  - `local` (mặc định): URL ảnh/frame trong JSON thường là signed media URL dạng `GET /api/v1/media?d=...&s=...` (backend ghép từ `BACKEND_URL` + `/api/v1`, ký bằng `MEDIA_SIGNING_SECRET` hoặc fallback `JWT_SECRET`). TTL mặc định 7 ngày (`MEDIA_URL_TTL_MS`).
  - `r2`: Cùng payload DB (đường dẫn tương đối như `images/...`). API thường trả **presigned GET** trỏ thẳng R2; TTL căn `MEDIA_URL_TTL_MS`. Endpoint `GET /api/v1/media?d=&s=` vẫn được hỗ trợ: sau khi xác thực chữ ký, backend **proxy** object từ R2 (không đọc `UPLOAD_DIR`) để tương thích link cũ trong cache/CDN.
- Không trả password_hash/token_hash.
- Khi thay đổi API/DB, phải cập nhật docs trước rồi mới code.

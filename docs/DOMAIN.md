# Domain – Diecast360

## Bối cảnh
- Ứng dụng web giúp admin quản lý kho xe diecast tỉ lệ 1:64, đăng catalog công khai và cung cấp viewer 360° để khách xoay xe.
- Hỗ trợ bán trên Facebook qua thao tác copy caption + copy link từ trang admin.
- Mọi quy tắc dưới đây là nguồn nghiệp vụ cho API/DB/UX; khi đổi domain phải đồng bộ `DB_SCHEMA.md`, `API_CONTRACT.md`, `ERROR_HANDLING.md`, `ARCHITECTURE.md`, `ENV.md` và README.

## Thực thể & trách nhiệm
### Item
- Mẫu xe diecast thuộc một shop; thuộc tính chính: `id (uuid)`, `shop_id`, `name`, `description`, `scale` (mặc định "1:64"), `brand` (tùy chọn), `car_brand`, `model_brand`, `condition`, `price`, `original_price`, `status`, `quantity`, `attributes`, `notes`, `is_public`, `fb_post_content` (nội dung bài FB), `qr_token` (token QR định danh; NULL cho đến khi admin tạo mã QR lần đầu), `created_at`, `updated_at`, `deleted_at` (soft delete).
- Quan hệ: nhiều `ItemImage`, nhiều `SpinSet`; duy nhất 1 `SpinSet` được gắn cờ `is_default`.
- Giá trị trạng thái: `con_hang`, `giu_cho`, `da_ban`, `preorder` (item đang trong giai đoạn pre-order, chưa về hàng; hiển thị trên trang `/preorders` công khai) (lưu ý khi hiển thị catalog/sao chép caption).
- Ảnh cover lấy từ `ItemImage.is_cover = true`, fallback ảnh đầu tiên theo `display_order`.

### ItemImage
- Ảnh thường của item, lưu đường dẫn file + thumbnail để hiển thị gallery.
- Thuộc tính: `id`, `item_id`, `file_path`, `thumbnail_path`, `is_cover`, `display_order`, `created_at`.
- Mỗi item chỉ có 1 cover; `display_order` xác định thứ tự trong gallery.

### SpinSet
- Bộ ảnh 360° của một item.
- Thuộc tính: `id`, `item_id`, `label` (mô tả ngắn), `is_default`, `created_at`, `updated_at`.
- Một item có nhiều spin set nhưng chỉ được 1 `is_default = true`. Khi đánh dấu default, các spin set khác phải bỏ cờ default.

### SpinFrame
- 1 frame trong spin set, đại diện cho 1 góc chụp.
- Thuộc tính: `id`, `spin_set_id`, `frame_index` (0..n-1, không bỏ số), `file_path`, `thumbnail_path`, `created_at`, `updated_at`.
- Ràng buộc: `(spin_set_id, frame_index)` UNIQUE; `frame_index` liên tục sau khi reorder.

### Shop / User / RBAC
- `Shop` là tenant dữ liệu, có `name`, `slug`, `is_active`, `contact_json`, `appearance_json`, `loyalty_json`.
  - `loyalty_json` structure: `{ vnd_per_point: number, preorder_points_basis: 'paid_amount' | 'total_amount' }`. `vnd_per_point` là số VND cần chi để được 1 điểm (integer ≥1, default 1000 — tức 1 điểm / 1.000 VND). `preorder_points_basis` xác định cơ sở tính điểm khi PAID: `paid_amount` (mặc định) hoặc `total_amount`.
- `User` có `email`, `password_hash`, `full_name`, `role` legacy, `platform_role`, `is_active`.
- `UserShopRole` gán user vào shop với vai trò `shop_admin` hoặc `shop_staff`; `shop_staff` là read-only cho mutating API theo guard chung; `platform_super` thao tác quản trị nền tảng không cần active tenant.
- `ShopAuditLog` ghi thay đổi nhạy cảm: thêm admin/staff, reset password, active/inactive user, update/deactivate/activate shop, đổi role.
- **Switch active shop:** Khi user gọi `POST /api/v1/auth/switch-shop`, server xác minh user có `UserShopRole` tại shop yêu cầu và shop đang active, sau đó phát JWT mới với claim `active_shop_id` cập nhật và set lại HttpOnly cookie. `TenantGuard` đọc `active_shop_id` từ JWT để scope mọi query — không có session state phía server.

### RefreshToken
- Lưu refresh token đã phát hành để hỗ trợ revoke.
- Thuộc tính: `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at` (nullable), `created_at`.
- TTL mặc định: access token **15 phút**, refresh token **7 ngày** (lưu trong `expires_at`). Bị revoke sau `POST /auth/logout` hoặc password reset (tất cả refresh token của user bị revoke).

### AiItemDraft
- Bản nháp item do AI phân tích từ ảnh chụp sản phẩm.
- Thuộc tính: `id (uuid)`, `images_json` (JSON paths ảnh), `extracted_text` (text trích xuất), `ai_json` (dữ liệu item do AI phân tích), `confidence_json` (confidence scores), `status` (`PENDING|CONFIRMED|REJECTED`), `created_at`, `updated_at`.
- Quy trình: Upload ảnh → AI phân tích → tạo draft PENDING → user xác nhận hoặc hủy.

### Category
- Danh mục `car_brand` / `model_brand`; có category global (`shop_id = null`) và category riêng theo shop.
- Public/admin dropdown merge global + category theo shop được resolve từ query `shop_id` hoặc JWT active shop.

### InventoryTransaction
- Ledger nhập/xuất/điều chỉnh tồn kho theo shop và item.
- Mỗi transaction lưu `type`, `quantity`, `delta`, `resulting_quantity`, `reason`, `note`, `actor_user_id`; transaction đảo chiều dùng `reversal_of_id`.

### PreOrder
- Đơn pre-order thuộc shop, item, optional user và member.
- Thuộc tính chính: `status`, `quantity`, `unit_price`, `total_amount`, `deposit_amount`, `paid_amount`, `expected_arrival_at`, `expected_delivery_at`, `cover_image_url`, `note`, `cancelled_at`, `completed_at`.
- Trạng thái: `PENDING_CONFIRMATION`, `WAITING_FOR_GOODS`, `ARRIVED`, `PAID`, `REFUNDED`, `CANCELLED`.
- Transition hợp lệ: `PENDING_CONFIRMATION → WAITING_FOR_GOODS|CANCELLED → ARRIVED|CANCELLED → PAID|CANCELLED → REFUNDED`; `REFUNDED` và `CANCELLED` là terminal.

### Member / MembershipTier / MemberPointsLedger
- Member thuộc shop, có `full_name`, optional `email`/`phone`, `points_balance`, optional tier.
- Tier có `name`, `rank`, `min_points`; unique theo shop.
- Points ledger ghi `earn`, `redeem`, `adjust`, `balance_after`, `reference_type/reference_id`. Pre-order paid/refund có thể tạo ledger theo `loyalty_json`.

### QrToken
- Token 16-ký tự hex (`crypto.randomBytes(8).toString('hex')`) dùng làm định danh duy nhất cho QR code của item.
- Được tạo lazily: chỉ sinh ra khi admin lần đầu gọi `GET /api/v1/items/:id/qr`.
- Token là **bất biến** sau khi đã được tạo — không thay đổi hay tái tạo, đảm bảo QR code in vật lý vẫn hoạt động lâu dài.
- Khi quét QR code, backend redirect về `FRONTEND_URL/items/:item_id?shop_id=:shop_id&source=qr&action=view`.
- Frontend hiển thị banner "Bạn đang xem sản phẩm qua mã QR" khi URL có `source=qr`.

## Quy tắc nghiệp vụ
- Soft delete: item dùng `deleted_at`; dữ liệu đã xóa mềm không xuất hiện ở danh sách admin/public.
- Spinner:
  - Tối thiểu 1 spin set default mới cho phép hiển thị spinner; nếu chưa có → fallback gallery ảnh thường.
  - Số frame khuyến nghị 24 (tối đa mặc định 48 theo `MAX_SPINNER_FRAMES` / `VITE_MAX_SPINNER_FRAMES`); `frame_index` tăng dần, không bỏ số.
  - Có thumbnail cho frame (dùng Sharp).
- Ảnh thường:
  - Upload nhiều ảnh; có thể đổi cover và sắp xếp thứ tự.
  - Xóa ảnh phải cập nhật cover nếu ảnh cover bị xóa (chọn ảnh đầu tiên còn lại).
- Public catalog: chỉ hiển thị item `is_public = true` và chưa bị soft delete; trạng thái hiển thị nguyên giá trị (`con_hang/giu_cho/da_ban/preorder`). Production yêu cầu `shop_id` hoặc JWT có active shop để tránh aggregate nhiều shop.
- Social selling: UI cần cung cấp thao tác copy caption/link dựa trên dữ liệu item (không thay đổi dữ liệu gốc).
- Pre-order: lifecycle phải đi qua state machine; không cập nhật trạng thái tùy ý.
- Giá preorder (`preorder_price`): giá đặc biệt áp dụng trong thời gian cửa sổ preorder còn mở (tức `preorder_closes_at IS NULL OR preorder_closes_at > NOW()`). Sau khi cửa sổ đóng, catalog hiển thị `price` thông thường. Giá trị **không bị xóa khi item đổi status** — luôn được lưu trong DB để admin theo dõi. Admin luôn thấy đủ cả 3 giá: gốc, bán, pre-order. Catalog tự quyết định hiển thị giá nào dựa theo trạng thái preorder.
- Cửa sổ đặt cọc: `preorder_opens_at` (mốc mở) và `preorder_closes_at` (mốc đóng). Khi item chuyển sang `preorder`, `preorder_opens_at` được gán bằng `created_at` của sản phẩm; tạo mới với `status=preorder` gán bằng thời điểm tạo. Thanh countdown UI dùng hai mốc này.
- Đóng/mở lại preorder: admin có thể đóng sớm cửa sổ preorder qua `PATCH /items/:id/close-preorder` (set `preorder_closes_at = NOW()`). Để mở lại, dùng `PATCH /items/:id/reopen-preorder` (xóa `preorder_closes_at`, set `preorder_opens_at = NOW()` — đợt mới tính từ lúc bấm mở lại, không dùng `created_at`). Các hành động này không thay đổi `status` item. Admin tự đặt deadline mới qua PATCH thông thường sau khi mở lại.
- Item status transition rules: `con_hang`/`giu_cho` → `preorder`/`da_ban`/nhau (được phép); `da_ban` → `con_hang` (nhập lại hàng, server tự set quantity=1 nếu không gửi); `da_ban` → `preorder`/`giu_cho` không được phép; `preorder` → `con_hang` (hàng về, tự động cập nhật các đơn `WAITING_FOR_GOODS → ARRIVED`); `preorder` → `da_ban` (nhà cung cấp hủy mẫu, đặt quantity=0). Quantity không bị ép về 0 khi chuyển sang `preorder`. Inventory transactions được phép trên item `preorder`.
- Item status transition decisions:
  - `PENDING_CONFIRMATION` khi `preorder → con_hang`: **không** tự động advance. Lý do: đơn chưa được shop xác nhận nên admin phải xem xét thủ công. Response trả `preorders_pending_count` để UI cảnh báo.
  - Đơn đã cọc (`paid_amount > 0`) khi `preorder → da_ban`: **không** tự động hủy. Lý do: đã thu tiền khách, phải liên hệ hoàn tiền thủ công. Nếu sau đó admin làm `da_ban → con_hang`, các đơn này giữ nguyên trạng thái.
  - `giu_cho → preorder`: được phép. Admin có thể mở campaign cho item đang reserved. Không có guard tự động — admin tự kiểm tra holds trước khi chuyển.
- Member points: mọi thay đổi điểm phải đi qua ledger để có audit trail. Ledger type: `earn` (auto khi PAID), `redeem` (admin áp dụng điểm vào đơn), `adjust` (manual cộng/trừ).
- Tier auto-evaluate: sau **mỗi** thay đổi ledger, hệ thống so sánh `points_balance` với `min_points` của tất cả tier trong shop. **Upgrade và downgrade đều xảy ra tự động** khi số dư vượt/dưới threshold. Trade-off: tier phản ánh số dư thực tế, không phải điểm tích lũy lifetime — shop cần thông báo rõ chính sách này cho khách hàng.
- Rate limiting: `POST /auth/forgot-password` tối đa 10 request/IP/giờ (429 Too Many Requests) và 3 request/email/giờ (silent reject — vẫn trả 200 để tránh enumeration). Window là sliding 1 giờ.
- QR code:
  - Token chỉ được tạo nếu item thuộc về tenant đang request (TenantGuard enforcement).
  - Nếu hai request đồng thời cùng tạo token, race condition được xử lý bằng `updateMany WHERE qr_token IS NULL`; người thua đọc lại token của người thắng từ DB.
  - Item `is_public = false` vẫn cho phép tạo/hiển thị QR trong admin — banner cảnh báo được hiển thị để nhắc admin bật public trước khi in QR.
  - QR resolve endpoint (`GET /api/v1/public/qr/:token`) không yêu cầu auth; redirect 302 về frontend với `source=qr`.

## Luồng chính
- Admin
  - Tạo item → upload ảnh thường → đặt cover + reorder → tạo spin set → upload frame → reorder frame → đặt default spin set → bật `is_public` để xuất bản.
  - Quản lý trạng thái kho (con_hang/giu_cho/da_ban), xóa mềm item, inventory ledger, pre-order, member points, báo cáo, shop settings và phiên đăng nhập (access/refresh token).
  - Tạo mã QR cho item: vào bước 5 wizard → backend sinh token (nếu chưa có) → hiển thị ảnh QR + link resolve + nút tải PNG + nút copy link.
- Public
  - Xem danh sách item công khai, xem chi tiết item, pre-order cards, đơn của tôi và trang liên hệ theo shop.
  - Nếu item có spin set default → dùng Spinner360 với drag/touch/autoplay/preload thông minh; nếu không → hiển thị gallery ảnh thường.

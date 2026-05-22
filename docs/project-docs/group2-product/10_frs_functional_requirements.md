---
title: Functional Requirements Specification (FRS)
version: 1.0
created: 2026-05-22
author: BA/PO Team
project: Diecast360
---

# Functional Requirements Specification — Diecast360

## Quy ước

- **Priority:** Must (M) = bắt buộc MVP | Should (S) = quan trọng nhưng có thể hoãn | Could (C) = nice-to-have
- **AC:** Acceptance Criteria
- Mọi endpoint admin yêu cầu HttpOnly Cookie + CSRF token trên mutation

---

## Module 1: Authentication & Authorization

### FR-001 — Đăng nhập bằng Email/Password

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | Tất cả user |

**Mô tả:** Người dùng đăng nhập bằng email và password. Hệ thống trả về HttpOnly cookie (access token + refresh token).

**Acceptance Criteria:**
1. Đăng nhập thành công với email/password hợp lệ → set HttpOnly cookie, trả về user info
2. Đăng nhập sai password ≥ 5 lần → tài khoản bị khóa tạm thời 15 phút
3. Password phải hash bằng bcrypt (cost factor ≥ 12)
4. Login response không bao giờ trả về raw password hoặc hash
5. CSRF token KHÔNG yêu cầu cho `POST /auth/login`

---

### FR-002 — Refresh Token

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | Tất cả user đã đăng nhập |

**Mô tả:** Hệ thống tự động refresh access token khi hết hạn bằng refresh token.

**AC:**
1. Access token hết hạn → client gọi refresh endpoint → nhận access token mới
2. Refresh token hết hạn → redirect về login
3. Logout phải invalidate cả access và refresh token

---

### FR-003 — Phân quyền RBAC

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | Hệ thống (TenantGuard) |

**Mô tả:** Hệ thống phân quyền theo role: `platform_super` (toàn platform), `shop_admin` (read/write trong shop), `shop_staff` (read-only trên mutation).

**AC:**
1. `shop_staff` gọi bất kỳ `POST/PATCH/DELETE` → 403 Forbidden
2. `shop_admin` chỉ truy cập dữ liệu của shop mình (TenantGuard)
3. `platform_super` không cần `active_shop_id`
4. Request không có token hợp lệ → 401 Unauthorized
5. Token hợp lệ nhưng sai tenant → 403 Forbidden

---

### FR-004 — CSRF Protection

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | Hệ thống |

**Mô tả:** Mọi mutation (`POST/PATCH/DELETE`) ngoài login phải kèm header `X-CSRF-Token`.

**AC:**
1. Mutation thiếu `X-CSRF-Token` → 403
2. CSRF token được issue sau khi login thành công
3. CSRF token rotate sau mỗi 24 giờ

---

## Module 2: Item Management

### FR-010 — Tạo Item mới

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Shop admin tạo item với đầy đủ thông tin: name, brand, car_brand, model_brand, scale (default 1:64), condition, price, status (mặc định con_hang), quantity, is_public (mặc định false), fb_post_content.

**AC:**
1. Tạo thành công với tên và giá → trả về item với ID mới
2. `status = da_ban` khi tạo → bắt buộc `quantity = 0`
3. `price` âm hoặc không phải số → validation error 422
4. `name` trống → validation error 422
5. Item mới tự động gán `shop_id` từ active tenant

---

### FR-011 — Xem danh sách Item (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin, shop_staff |

**Mô tả:** Xem danh sách item của shop với filter và pagination.

**AC:**
1. Trả về chỉ item của shop hiện tại (không cross-tenant)
2. Filter hoạt động đúng: status, is_public, brand, khoảng giá
3. Tìm kiếm theo tên (case-insensitive, substring)
4. Item đã soft-delete (`deleted_at != null`) không xuất hiện mặc định
5. Pagination: mặc định 20 item/trang, có thể điều chỉnh

---

### FR-012 — Cập nhật Item

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Sửa thông tin item. Không được phép sửa `quantity` trực tiếp — phải qua InventoryTransaction.

**AC:**
1. Cập nhật thành công các trường text/giá → 200 OK với data mới
2. Thay đổi status → `da_ban`: nếu `quantity > 0` → 422 lỗi
3. Thay đổi `quantity` trực tiếp → 422 lỗi (phải qua inventory transaction)
4. Chỉ shop_admin của đúng shop mới được sửa

---

### FR-013 — Soft Delete Item

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Xóa mềm item (set `deleted_at`). Item không biến mất khỏi lịch sử giao dịch.

**AC:**
1. Xóa thành công → `deleted_at` được set, item không còn trong danh sách mặc định
2. Pre-order liên quan đến item bị xóa vẫn tồn tại và có thể xem
3. Có thể restore item (set `deleted_at = null`) bởi admin

---

### FR-014 — Publish/Unpublish Item

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Toggle `is_public` để kiểm soát hiển thị trên public catalog.

**AC:**
1. Set `is_public = true` → item xuất hiện trên public catalog trong < 5 giây
2. Set `is_public = false` → item biến mất khỏi public catalog
3. shop_staff không thể thay đổi `is_public`

---

## Module 3: Media Management

### FR-020 — Upload Ảnh Item

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Upload nhiều ảnh cho item qua `multipart/form-data`, field `file`.

**AC:**
1. Upload thành công JPEG/PNG/WebP ≤ 10MB → trả về URL ảnh
2. Upload file > 10MB → 413 Payload Too Large
3. Upload định dạng không hỗ trợ (PDF, video...) → 415 Unsupported Media Type
4. Tối đa 20 ảnh/item; vượt quá → 422 với message rõ ràng
5. Ảnh đầu tiên upload tự động trở thành cover nếu chưa có cover

---

### FR-021 — Sắp xếp và xóa Ảnh

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**AC:**
1. Drag-and-drop sắp xếp lại `display_order` → lưu thành công
2. Đánh dấu ảnh khác làm cover → ảnh cũ tự động bỏ cover
3. Xóa ảnh đang là cover → ảnh tiếp theo tự động trở thành cover
4. Xóa ảnh → file vật lý được cleanup async

---

### FR-022 — Tạo SpinSet

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Tạo bộ ảnh 360° cho item.

**AC:**
1. Tạo SpinSet với label → thành công, trả về spin_set_id
2. Spin set đầu tiên của item tự động là `is_default = true`
3. Khi set SpinSet khác làm default → SpinSet cũ tự động bỏ default
4. Không có SpinSet nào là default → lấy SpinSet cũ nhất làm default tự động

---

### FR-023 — Upload SpinFrame

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Upload các frame cho SpinSet qua `multipart/form-data`, field `frame`.

**AC:**
1. Upload hàng loạt frame → tự động assign `frame_index` liên tục từ 0
2. `frame_index` phải unique trong SpinSet — vi phạm → 409 Conflict
3. Tối đa 36 frames/SpinSet; vượt quá → 422
4. Tối thiểu 12 frames để SpinSet được coi là hợp lệ (warning nếu ít hơn)
5. Xóa frame giữa → tự động renumber các frame sau

---

### FR-024 — Signed Media URL

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | Hệ thống |

**Mô tả:** Mọi URL media đều là signed URL với TTL. Không bao giờ expose đường dẫn thực.

**AC:**
1. `GET /api/v1/media?d=...&s=...` với chữ ký hợp lệ → trả về file
2. Chữ ký sai hoặc hết hạn → 403
3. TTL mặc định: 24 giờ cho ảnh item, 1 giờ cho spinner frame

---

## Module 4: Public Catalog

### FR-030 — Xem Public Catalog

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | End Customer (anonymous) |

**Mô tả:** Khách xem catalog công khai của shop qua slug.

**AC:**
1. `GET /api/v1/public/shops/{slug}/items` → trả về items `is_public=true`, `deleted_at=null`
2. Shop không tồn tại hoặc không active → 404
3. Không trả về item của shop khác (tenant isolation)
4. Không yêu cầu authentication
5. Hỗ trợ filter: status, brand, khoảng giá; search theo tên

---

### FR-031 — Xem Chi tiết Item (Public)

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | End Customer (anonymous) |

**Mô tả:** Xem trang chi tiết item với ảnh và spinner 360°.

**AC:**
1. Trả về đầy đủ thông tin item công khai (không bao gồm fb_post_content)
2. Nếu có SpinSet default → trả về URLs của tất cả SpinFrame (ordered by frame_index)
3. Không có SpinSet → trả về danh sách ItemImage ordered by display_order
4. Item `is_public = false` → 404 với anonymous request
5. Item soft-deleted → 404

---

### FR-032 — SEO & Share

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Should |
| **Actor** | End Customer |

**AC:**
1. Trang chi tiết item có Open Graph tags (og:title, og:image, og:description)
2. og:image là ảnh cover của item
3. Canonical URL đúng theo slug shop

---

## Module 5: Pre-Order Management

### FR-040 — Tạo Pre-Order (Customer)

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | End Customer (anonymous hoặc đã login member) |

**Mô tả:** Khách tạo pre-order từ trang chi tiết item.

**AC:**
1. Item `con_hang` hoặc `giu_cho` → có thể pre-order
2. Item `da_ban` → không thể pre-order, nút bị disable với message rõ
3. Pre-order yêu cầu: tên khách, SĐT; email optional
4. Tạo thành công → status `PENDING_CONFIRMATION`, trả về order ID
5. Nếu khách là member (SĐT match) → pre-order tự động liên kết với member

---

### FR-041 — State Machine Pre-Order (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Admin thay đổi trạng thái pre-order theo state machine.

**AC:**
1. Chỉ cho phép transition hợp lệ: `PENDING_CONFIRMATION → WAITING_FOR_GOODS|CANCELLED`, `WAITING_FOR_GOODS → ARRIVED|CANCELLED`, `ARRIVED → PAID|CANCELLED`, `PAID → REFUNDED`
2. Transition không hợp lệ → 422 với message "Invalid status transition"
3. `REFUNDED` và `CANCELLED` là terminal — không thể chuyển tiếp
4. Mỗi transition ghi log với user và timestamp

---

### FR-042 — Xem Danh sách Pre-Order (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin, shop_staff |

**AC:**
1. Filter theo status, theo item, theo ngày, theo tên/SĐT khách
2. Chỉ thấy pre-order của shop mình
3. Sort mặc định: mới nhất trước
4. Export CSV (Could)

---

### FR-043 — Auto-Cộng điểm khi PAID

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | Hệ thống (tự động) |

**AC:**
1. Pre-order → PAID và có member_id → tự động tính điểm theo loyalty_json của shop
2. Điểm được ghi vào MemberPointsLedger với `reference_type='pre_order'`, `reference_id=order_id`
3. Member tier tự động nâng nếu tổng điểm vượt threshold
4. Pre-order → CANCELLED sau khi PAID → tự động trừ điểm (tạo ledger entry âm)

---

## Module 6: Inventory Management

### FR-050 — Tạo Inventory Transaction

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**Mô tả:** Admin nhập/xuất/điều chỉnh tồn kho thông qua ledger.

**AC:**
1. `stock_in` với quantity dương → tăng `items.quantity` tương ứng
2. `stock_out` với quantity dương → giảm `items.quantity`; không cho phép âm
3. `adjustment` → set quantity về giá trị mới (có thể tăng hoặc giảm)
4. Mọi transaction ghi: loại, quantity_before, quantity_after, user, timestamp, note
5. Item `da_ban` không thể `stock_in`

---

### FR-051 — Xem Lịch sử Tồn kho

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin, shop_staff |

**AC:**
1. Xem lịch sử transaction theo item, có filter theo loại và ngày
2. Mỗi dòng hiển thị: loại, delta, quantity_before, quantity_after, user, timestamp, note
3. Không thể sửa hoặc xóa transaction đã tạo (immutable ledger)

---

### FR-052 — Low Stock Alert

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Should |
| **Actor** | shop_admin |

**AC:**
1. Khi `quantity ≤ low_stock_threshold` (cấu hình per-shop) → hiển thị badge cảnh báo trong admin
2. Dashboard có widget "Sắp hết hàng" liệt kê các item low stock
3. Email alert tùy chọn (Could)

---

## Module 7: Member & Loyalty

### FR-060 — Quản lý Member

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**AC:**
1. Tạo member: tên (bắt buộc), SĐT (bắt buộc, unique per shop), email (optional), ngày sinh (optional)
2. SĐT trùng trong cùng shop → 409 Conflict
3. Xem danh sách member với filter: tier, SĐT, tên
4. Xóa member chỉ được khi không có pre-order non-terminal → nếu có → 422 với message

---

### FR-061 — Membership Tier

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin (cấu hình) / Hệ thống (tự động) |

**AC:**
1. Shop cấu hình tier: tên, điểm threshold, benefits mô tả
2. Member tier tự động nâng khi total_points ≥ tier threshold
3. Tier không tự động hạ — chỉ admin có thể hạ tier thủ công
4. Hiển thị tier badge trên profile member

---

### FR-062 — Điều chỉnh Điểm thủ công

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**AC:**
1. Admin cộng/trừ điểm thủ công với lý do bắt buộc
2. Trừ điểm không được làm điểm âm → 422 nếu điểm hiện tại < điểm trừ
3. Mỗi thay đổi → tạo ledger entry với `reference_type='manual'`
4. Lịch sử điều chỉnh có thể audit

---

### FR-063 — Xem Lịch sử Điểm

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**AC:**
1. Xem ledger theo member: loại, điểm, balance sau, reference, timestamp
2. Filter theo loại (earn/deduct/manual), theo ngày
3. Tổng điểm hiện tại khớp với sum của tất cả ledger entry

---

## Module 8: AI Features

### FR-070 — AI Phân tích Ảnh → Draft

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Should |
| **Actor** | shop_admin |

**Mô tả:** Upload ảnh mô hình → AI trả về bản nháp thông tin item.

**AC:**
1. Upload 1 ảnh → AI phân tích → trả về AiItemDraft trong ≤ 30 giây
2. Draft gồm: name, brand, car_brand, model_brand, condition, description (ước lượng)
3. Khi AI API lỗi → thông báo lỗi thân thiện, không crash app
4. Draft có trạng thái `PENDING` sau khi tạo

---

### FR-071 — Xác nhận hoặc Từ chối Draft

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Should |
| **Actor** | shop_admin |

**AC:**
1. Admin xem draft, sửa bất kỳ trường nào
2. Confirm draft → tạo Item thực từ thông tin draft (status = CONFIRMED)
3. Reject draft → ghi lý do, set status REJECTED, không tạo item
4. Draft PENDING có thể edit tự do; draft CONFIRMED/REJECTED thì readonly

---

### FR-072 — AI Gợi ý Caption Facebook

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Could |
| **Actor** | shop_admin |

**AC:**
1. Từ thông tin item đã có → AI generate caption Facebook theo template shop
2. Admin có thể regenerate hoặc sửa tay trước khi copy
3. Caption đã approve lưu vào `fb_post_content` của item

---

## Module 9: Social Selling

### FR-080 — Copy Caption Facebook

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**AC:**
1. Click "Copy Caption" → clipboard nhận nội dung đầy đủ (tên, giá, link, contact)
2. Template caption có thể cấu hình per-shop
3. Toast notification xác nhận copy thành công
4. Caption tự động include link public catalog item

---

### FR-081 — Copy Link Item

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**AC:**
1. Click "Copy Link" → clipboard nhận URL public catalog item
2. URL có format: `https://[domain]/s/[shop_slug]/items/[item_id]`

---

### FR-082 — Lưu Facebook Post Log

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Should |
| **Actor** | shop_admin |

**AC:**
1. Admin nhập link bài đăng Facebook sau khi đăng → lưu vào FacebookPost
2. Mỗi item có thể liên kết nhiều FacebookPost (đăng nhiều lần)
3. Xem lịch sử bài đăng theo item: link, ngày đăng, ghi chú

---

## Module 10: Platform Administration

### FR-090 — Quản lý Shop (Tenant)

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | platform_super |

**AC:**
1. Tạo shop: tên, slug (unique, validate format), contact_json, appearance_json
2. Sửa cấu hình shop bất kỳ trường nào
3. Vô hiệu hóa shop → admin của shop đó không thể đăng nhập, public catalog trả 404
4. Slug phải unique; duplicate slug → 409

---

### FR-091 — Quản lý User & Role

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | platform_super |

**AC:**
1. Tạo user với email/password
2. Gán user vào shop với role cụ thể (shop_admin, shop_staff)
3. Một user có thể là shop_admin ở shop A và shop_staff ở shop B
4. Xóa role của user khỏi shop → user mất quyền truy cập shop đó
5. Không thể xóa role của user cuối cùng có shop_admin trong shop

---

### FR-092 — Cấu hình Loyalty per Shop

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Must |
| **Actor** | shop_admin |

**AC:**
1. Cấu hình earn rate: ví dụ 1 điểm / 10,000 VND
2. Cấu hình tier: tên, threshold điểm, mô tả benefit
3. Tối thiểu 1 tier (default); tối đa 5 tier
4. Thay đổi earn rate → áp dụng cho đơn hàng từ thời điểm thay đổi, không hồi tố

---

## Module 11: Reporting & Dashboard

### FR-100 — Dashboard Tổng quan

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Should |
| **Actor** | shop_admin |

**AC:**
1. Widget: tổng item (theo trạng thái), tổng pre-order (theo trạng thái), tổng member
2. Widget: doanh thu ước tính tháng này (sum giá PAID orders trong tháng)
3. Widget: top 5 item pre-order nhiều nhất
4. Data refresh ≤ 5 phút (near-realtime)

---

### FR-101 — Báo cáo Pre-Order

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Should |
| **Actor** | shop_admin |

**AC:**
1. Biểu đồ số lượng pre-order theo ngày/tuần/tháng
2. Phân bổ theo trạng thái (pie chart)
3. Lọc theo khoảng thời gian
4. Export CSV

---

### FR-102 — Báo cáo Tồn kho

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Should |
| **Actor** | shop_admin |

**AC:**
1. Danh sách item sắp hết hàng (quantity ≤ threshold)
2. Item không có giao dịch trong 30 ngày (slow-moving)
3. Giá trị tồn kho ước tính = sum(quantity × price)

---

### FR-103 — Báo cáo Member

| Thuộc tính | Giá trị |
|------------|---------|
| **Priority** | Could |
| **Actor** | shop_admin |

**AC:**
1. Tăng trưởng member theo tháng
2. Phân bổ member theo tier
3. Top 10 member điểm cao nhất
4. Member sinh nhật trong tháng (để chăm sóc)

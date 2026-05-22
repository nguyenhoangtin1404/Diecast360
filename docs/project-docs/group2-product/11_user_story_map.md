---
title: User Story Map
version: 1.0
created: 2026-05-22
author: BA/PO Team
project: Diecast360
---

# User Story Map — Diecast360

## Cấu trúc

```
Epic (Backbone)
  └── User Activity (Spine)
        └── User Story
              └── Task (implementation)
```

---

## Epic 1: Catalog Management

**Mục tiêu:** Shop admin quản lý toàn bộ vòng đời của item diecast

### Activity 1.1 — Tạo Item

| Story | Task |
|-------|------|
| US-001: Là shop admin, tôi muốn tạo item mới với thông tin cơ bản để bắt đầu quản lý sản phẩm | T1: Thiết kế form tạo item (fields: name, brand, car_brand, model_brand, scale, condition, price, status, quantity) |
| | T2: Validate input server-side (required fields, price >= 0, da_ban → quantity=0) |
| | T3: API `POST /api/v1/items` + auto-assign shop_id từ TenantGuard |
| | T4: Unit test validation logic |
| US-002: Là shop admin, tôi muốn nhập nội dung caption Facebook ngay khi tạo item để chuẩn bị bán hàng | T1: Thêm field `fb_post_content` (textarea) vào form |
| | T2: Preview caption inline |

### Activity 1.2 — Xem & Tìm kiếm Item

| Story | Task |
|-------|------|
| US-003: Là shop admin, tôi muốn xem danh sách item với filter đa điều kiện để quản lý hiệu quả | T1: UI list item với filter panel (status, brand, price range) |
| | T2: Search realtime theo tên (debounce 300ms) |
| | T3: Pagination (20 items/page) |
| | T4: API filter + search server-side |
| US-004: Là shop staff, tôi muốn xem tồn kho hiện tại của từng item để hỗ trợ khách hàng | T1: Column "Tồn kho" trong bảng item |
| | T2: Low stock badge (màu đỏ) khi quantity <= threshold |

### Activity 1.3 — Cập nhật & Xóa Item

| Story | Task |
|-------|------|
| US-005: Là shop admin, tôi muốn sửa thông tin item để cập nhật giá hoặc mô tả | T1: Form edit inline hoặc modal |
| | T2: Validate da_ban invariant khi đổi status |
| | T3: API `PATCH /api/v1/items/:id` |
| US-006: Là shop admin, tôi muốn xóa mềm item để ẩn nó mà không mất lịch sử | T1: Nút "Xóa" với confirm dialog |
| | T2: API soft delete (set deleted_at) |
| | T3: Option "Xem item đã xóa" trong filter |

### Activity 1.4 — Publish / Unpublish

| Story | Task |
|-------|------|
| US-007: Là shop admin, tôi muốn publish/unpublish item với 1 click để kiểm soát catalog công khai | T1: Toggle switch `is_public` trong list |
| | T2: Optimistic UI update |
| | T3: Toast notification xác nhận |

---

## Epic 2: Media & 360° Viewer

**Mục tiêu:** Upload và quản lý media chất lượng cao, tạo trải nghiệm xem 360°

### Activity 2.1 — Upload & Quản lý Ảnh

| Story | Task |
|-------|------|
| US-010: Là shop admin, tôi muốn upload nhiều ảnh cùng lúc để tiết kiệm thời gian | T1: Multi-file upload với drag-and-drop |
| | T2: Progress bar theo từng file |
| | T3: API `POST /api/v1/items/:id/images` (multipart) |
| | T4: Validate kích thước và định dạng |
| US-011: Là shop admin, tôi muốn đặt ảnh cover để hiển thị đẹp trên catalog | T1: Click để set cover, chỉ 1 cover tại 1 thời điểm |
| | T2: Visual indicator (star/badge) trên ảnh cover |
| US-012: Là shop admin, tôi muốn sắp xếp lại thứ tự ảnh để trình bày đẹp hơn | T1: Drag-and-drop reorder trong image gallery |
| | T2: API `PATCH /api/v1/items/:id/images/reorder` |

### Activity 2.2 — Tạo SpinSet 360°

| Story | Task |
|-------|------|
| US-013: Là shop admin, tôi muốn tạo bộ ảnh 360° để khách xem mô hình từ mọi góc | T1: UI tạo SpinSet (đặt tên, chọn là default) |
| | T2: API `POST /api/v1/items/:id/spin-sets` |
| | T3: Logic auto-default nếu là SpinSet đầu tiên |
| US-014: Là shop admin, tôi muốn upload hàng loạt SpinFrame theo đúng thứ tự | T1: Batch upload frame với sorting tự động theo tên file |
| | T2: Preview thumbnails sau upload |
| | T3: Validation: frame_index liên tục, max 36 frame |
| | T4: API `POST /api/v1/spin-sets/:id/frames` (multipart) |
| US-015: Là shop admin, tôi muốn xóa và tái sắp xếp frame để sửa khi upload nhầm | T1: Xóa frame riêng lẻ với confirm |
| | T2: Drag-and-drop reorder frames |
| | T3: Auto-renumber frame_index sau khi thay đổi |

### Activity 2.3 — Preview Spinner

| Story | Task |
|-------|------|
| US-016: Là shop admin, tôi muốn preview spinner 360° ngay trong admin để kiểm tra trước khi publish | T1: Spinner component nhúng trong trang edit item |
| | T2: Drag để xoay mô hình |
| | T3: Loading indicator khi load frames |

---

## Epic 3: Public Storefront

**Mục tiêu:** Khách hàng khám phá và tương tác với catalog của shop

### Activity 3.1 — Duyệt Catalog

| Story | Task |
|-------|------|
| US-020: Là khách hàng, tôi muốn xem catalog của shop để tìm mô hình yêu thích | T1: Trang catalog `/s/[slug]` với grid item |
| | T2: Filter bar (status, brand, price range) |
| | T3: Search input real-time |
| | T4: Infinite scroll hoặc pagination |
| US-021: Là khách hàng, tôi muốn thấy trạng thái hàng rõ ràng để biết còn có thể đặt không | T1: Badge status màu sắc (Còn hàng xanh, Đã bán đỏ, Giữ chỗ vàng) |
| | T2: Số lượng tồn kho hiển thị (optional theo config shop) |

### Activity 3.2 — Xem Chi tiết

| Story | Task |
|-------|------|
| US-022: Là khách hàng, tôi muốn xem mô hình từ 360° để đánh giá chất lượng trước khi mua | T1: SpinViewer component với mouse/touch drag |
| | T2: Fallback gallery nếu không có SpinSet |
| | T3: Lazy load frames (load frame hiện tại ± 3) |
| | T4: Mobile: swipe gesture |
| US-023: Là khách hàng, tôi muốn xem đầy đủ thông tin item để quyết định mua | T1: Layout trang chi tiết: spinner/gallery + thông tin |
| | T2: Share button (copy link) |

---

## Epic 4: Pre-Order System

**Mục tiêu:** Quản lý đơn hàng đặt trước minh bạch, từ tạo đến hoàn tất

### Activity 4.1 — Tạo Pre-Order

| Story | Task |
|-------|------|
| US-030: Là khách hàng, tôi muốn đặt hàng trước để không lỡ sản phẩm yêu thích | T1: Form pre-order: tên, SĐT, ghi chú |
| | T2: Validate item còn có thể order |
| | T3: API `POST /api/v1/public/pre-orders` |
| | T4: Trang xác nhận với order ID |
| US-031: Là khách hàng là member, tôi muốn pre-order tự động liên kết tài khoản để tích điểm | T1: Lookup member bằng SĐT khi tạo pre-order |
| | T2: Hiển thị "Đơn này sẽ tích X điểm" khi khách là member |

### Activity 4.2 — Xử lý Pre-Order (Admin)

| Story | Task |
|-------|------|
| US-032: Là shop admin, tôi muốn xem danh sách pre-order và filter theo trạng thái để xử lý đơn | T1: Bảng pre-order với filter status |
| | T2: Sort theo ngày, theo tên khách |
| | T3: Highlight đơn cần xử lý (PENDING_CONFIRMATION lâu nhất) |
| US-033: Là shop admin, tôi muốn cập nhật trạng thái đơn theo đúng flow để đảm bảo quy trình | T1: Dropdown chọn status mới (chỉ show transition hợp lệ) |
| | T2: Confirm dialog với note tùy chọn |
| | T3: API enforce state machine |
| | T4: Ghi log transition với user + timestamp |

### Activity 4.3 — Tự động hóa

| Story | Task |
|-------|------|
| US-034: Là shop admin, tôi muốn điểm tự động cộng khi PAID để không phải làm thủ công | T1: Hook khi transition → PAID: tính điểm |
| | T2: Tạo MemberPointsLedger entry |
| | T3: Update member tier nếu cần |

---

## Epic 5: Inventory Management

**Mục tiêu:** Theo dõi tồn kho chính xác qua ledger bất biến

### Activity 5.1 — Nhập/Xuất Kho

| Story | Task |
|-------|------|
| US-040: Là shop admin, tôi muốn nhập hàng vào kho để cập nhật tồn kho sau khi nhận hàng | T1: Form nhập kho: chọn item, quantity, note |
| | T2: API `POST /api/v1/inventory-transactions` (type: stock_in) |
| | T3: Cập nhật items.quantity atomically |
| US-041: Là shop admin, tôi muốn ghi nhận hàng xuất để kho luôn đúng | T1: Form xuất kho tương tự nhập kho |
| | T2: Validate: quantity_out <= quantity hiện tại |
| US-042: Là shop admin, tôi muốn điều chỉnh tồn kho khi kiểm kê để sửa sai lệch | T1: Form điều chỉnh: nhập số lượng thực tế |
| | T2: Hệ thống tự tính delta và ghi transaction type: adjustment |

### Activity 5.2 — Theo dõi & Cảnh báo

| Story | Task |
|-------|------|
| US-043: Là shop admin, tôi muốn xem lịch sử tồn kho để audit khi cần | T1: Timeline transactions per item |
| | T2: Export CSV lịch sử |
| US-044: Là shop admin, tôi muốn được cảnh báo khi hàng sắp hết để kịp nhập hàng | T1: Badge "Sắp hết" trong danh sách item |
| | T2: Widget "Low Stock" trên dashboard |

---

## Epic 6: Member Loyalty

**Mục tiêu:** Xây dựng cộng đồng khách hàng trung thành qua điểm tích lũy

### Activity 6.1 — Quản lý Member

| Story | Task |
|-------|------|
| US-050: Là shop admin, tôi muốn đăng ký member mới để bắt đầu tích điểm cho khách | T1: Form thêm member: tên, SĐT, email, ngày sinh |
| | T2: Validate SĐT unique per shop |
| | T3: API `POST /api/v1/members` |
| US-051: Là shop admin, tôi muốn xem profile member để hiểu lịch sử mua hàng | T1: Trang member: thông tin + điểm hiện tại + tier + lịch sử ledger + danh sách pre-order |

### Activity 6.2 — Điểm & Tier

| Story | Task |
|-------|------|
| US-052: Là shop admin, tôi muốn điều chỉnh điểm thủ công để xử lý khiếu nại hoặc thưởng | T1: Form điều chỉnh: cộng/trừ điểm + lý do bắt buộc |
| | T2: Validate không trừ vượt số dư |
| | T3: Tạo ledger entry type: manual |
| US-053: Là khách hàng, tôi muốn biết điểm tích lũy và tier của mình để theo dõi quyền lợi | T1: Trang tra cứu member public (qua SĐT) |
| | T2: Hiển thị: tier hiện tại, điểm, khoảng cách đến tier tiếp theo |

### Activity 6.3 — Cấu hình Loyalty

| Story | Task |
|-------|------|
| US-054: Là shop admin, tôi muốn cấu hình chương trình điểm để phù hợp chiến lược kinh doanh | T1: UI cấu hình: earn rate (X điểm / Y nghìn VND) |
| | T2: UI cấu hình tier: tên + threshold + mô tả |
| | T3: Lưu vào `shop.loyalty_json` |

---

## Epic 7: Social Selling

**Mục tiêu:** Giúp shop bán hàng qua Facebook nhanh và chuyên nghiệp

### Activity 7.1 — Copy & Share

| Story | Task |
|-------|------|
| US-060: Là shop admin, tôi muốn copy caption bán hàng 1 click để đăng Facebook nhanh | T1: Nút "Copy Caption" trong trang chi tiết item (admin) |
| | T2: Build caption từ template + thông tin item |
| | T3: Clipboard API, toast notification |
| US-061: Là shop admin, tôi muốn copy link item để gửi cho khách hoặc đăng kèm bài | T1: Nút "Copy Link" |
| | T2: Link format: domain/s/[slug]/items/[id] |

### Activity 7.2 — Quản lý Bài đăng

| Story | Task |
|-------|------|
| US-062: Là shop admin, tôi muốn lưu link bài đăng Facebook để tham chiếu sau này | T1: Form nhập link bài đăng sau khi post |
| | T2: API `POST /api/v1/items/:id/facebook-posts` |
| | T3: Danh sách bài đăng theo item |

### Activity 7.3 — Template Caption

| Story | Task |
|-------|------|
| US-063: Là shop admin, tôi muốn tùy chỉnh template caption để phù hợp phong cách shop | T1: UI soạn template với placeholder: {name}, {price}, {status}, {link}, {contact} |
| | T2: Preview live caption khi sửa template |
| | T3: Lưu vào shop appearance_json |

---

## Epic 8: AI Features

**Mục tiêu:** Tăng tốc tạo nội dung sản phẩm bằng AI

### Activity 8.1 — AI Draft từ Ảnh

| Story | Task |
|-------|------|
| US-070: Là shop admin, tôi muốn upload ảnh để AI tự điền thông tin item để tiết kiệm thời gian | T1: Upload ảnh → call AI API |
| | T2: Hiển thị loading state (spinner, "AI đang phân tích...") |
| | T3: Map AI response → AiItemDraft fields |
| | T4: Lưu draft với status PENDING |
| US-071: Là shop admin, tôi muốn review và sửa draft AI trước khi tạo item thật | T1: Form review draft (edit mọi field) |
| | T2: Nút "Xác nhận" → tạo Item từ draft |
| | T3: Nút "Từ chối" → nhập lý do, archive draft |

### Activity 8.2 — AI Caption

| Story | Task |
|-------|------|
| US-072: Là shop admin, tôi muốn AI gợi ý caption Facebook để không phải viết từ đầu | T1: Nút "AI Gợi ý Caption" trong trang item |
| | T2: Call AI API với context item |
| | T3: Render response vào textarea, cho phép edit |

---

## Epic 9: Platform Administration

**Mục tiêu:** Platform super admin quản lý toàn bộ hệ thống multi-tenant

### Activity 9.1 — Quản lý Shop

| Story | Task |
|-------|------|
| US-080: Là platform admin, tôi muốn tạo shop mới để onboard khách hàng mới | T1: Form tạo shop: tên, slug, contact, appearance |
| | T2: Validate slug unique |
| | T3: API `POST /api/v1/admin/shops` |
| US-081: Là platform admin, tôi muốn vô hiệu hóa shop để xử lý vi phạm hoặc chấm dứt hợp đồng | T1: Toggle active/inactive trên shop |
| | T2: Shop inactive → public catalog 404, admin login → 403 |

### Activity 9.2 — Quản lý User

| Story | Task |
|-------|------|
| US-082: Là platform admin, tôi muốn tạo và gán user vào shop với đúng quyền | T1: Form tạo user: email, password tạm |
| | T2: Form gán role vào shop |
| | T3: 1 user có thể có nhiều role ở nhiều shop |

---

## Epic 10: Reports & Analytics

**Mục tiêu:** Cung cấp insight để shop owner ra quyết định kinh doanh

### Activity 10.1 — Dashboard

| Story | Task |
|-------|------|
| US-090: Là shop admin, tôi muốn xem dashboard tổng quan để nắm bắt tình trạng kinh doanh | T1: Widget: tổng item theo status |
| | T2: Widget: pre-order theo status (doughnut chart) |
| | T3: Widget: doanh thu ước tính tháng này |
| | T4: Widget: top 5 item |

### Activity 10.2 — Báo cáo Chi tiết

| Story | Task |
|-------|------|
| US-091: Là shop admin, tôi muốn xem báo cáo pre-order theo thời gian để theo dõi xu hướng | T1: Line chart số đơn theo ngày (7/30/90 ngày) |
| | T2: Filter khoảng thời gian |
| US-092: Là shop admin, tôi muốn xem báo cáo tồn kho để lập kế hoạch nhập hàng | T1: Danh sách low stock |
| | T2: Giá trị tồn kho ước tính |
| US-093: Là shop admin, tôi muốn xem báo cáo member để biết ai là khách VIP | T1: Bảng top member theo điểm |
| | T2: Member sinh nhật tháng này |

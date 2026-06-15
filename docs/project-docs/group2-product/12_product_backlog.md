---
title: Product Backlog
version: 1.0
created: 2026-05-22
author: BA/PO Team
project: Diecast360
---

# Product Backlog — Diecast360

## Backlog Summary

| Metric | Giá trị |
|--------|---------|
| Tổng số User Stories | 64 |
| Tổng Story Points | 431 |
| Velocity ước tính | 40 points/sprint (2 tuần) |
| Số sprint ước tính | ~10 sprints |
| Thời gian hoàn thành ước tính | ~5 tháng |
| Sprint hiện tại | Sprint 7 (05/2026) |

### Phân bổ theo Priority

| Priority | Số stories | Story Points |
|----------|-----------|--------------|
| Critical | 16 | 131 |
| High | 26 | 183 |
| Medium | 14 | 84 |
| Low | 8 | 33 |

### Phân bổ theo Status

| Status | Số stories | Story Points |
|--------|-----------|--------------|
| Done | 40 | 259 |
| In Progress | 8 | 62 |
| Todo | 16 | 110 |

---

## Backlog Items

### Epic 0: Authentication & Session

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-008 | Auth | Là user, tôi muốn đăng xuất để kết thúc phiên làm việc an toàn | Critical | 2 | S1 | Done |
| US-009 | Auth | Là user, tôi muốn đặt lại mật khẩu khi quên để lấy lại quyền truy cập | Critical | 5 | S2 | Done |

**Acceptance Criteria US-008:**
1. Nút "Đăng xuất" xuất hiện trong menu header khi đã đăng nhập
2. Click → gọi `POST /auth/logout`, revoke refresh token, xóa cookies
3. Redirect về `/login` với message "Bạn đã đăng xuất thành công"
4. Sau logout: truy cập URL admin → redirect về login (không cache session)

**Acceptance Criteria US-009:**
1. Link "Quên mật khẩu?" trên trang login → form nhập email
2. Submit luôn trả 200 dù email có tồn tại hay không (chống enumeration)
3. Email gửi reset link (1h TTL, SHA-256 hash, one-time use)
4. Token đã dùng → "Link không hợp lệ hoặc đã hết hạn"
5. Sau reset: tất cả refresh token cũ bị revoke
6. Rate limit: 10/IP/h, 3/email/h (silent reject trên email)

---

### Epic 1: Catalog Management

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-001 | Catalog | Là shop admin, tôi muốn tạo item diecast mới với đầy đủ thông tin để quản lý sản phẩm | Critical | 8 | S1 | Done |
| US-002 | Catalog | Là shop admin, tôi muốn xem danh sách item với filter để quản lý hiệu quả | Critical | 5 | S1 | Done |
| US-003 | Catalog | Là shop admin, tôi muốn tìm kiếm item theo tên để tìm nhanh sản phẩm cần | High | 3 | S1 | Done |
| US-004 | Catalog | Là shop admin, tôi muốn sửa thông tin item để cập nhật giá hoặc mô tả | Critical | 5 | S1 | Done |
| US-005 | Catalog | Là shop admin, tôi muốn xóa mềm item để ẩn sản phẩm không còn kinh doanh | High | 3 | S2 | Done |
| US-006 | Catalog | Là shop admin, tôi muốn publish/unpublish item bằng 1 click để kiểm soát catalog công khai | Critical | 3 | S2 | Done |
| US-007 | Catalog | Là shop admin, tôi muốn xem lịch sử thay đổi item để audit khi cần | Medium | 5 | S8 | Todo |

**Acceptance Criteria US-001:**
1. Form tạo item validate: name (required, max 200 chars), price (required, >= 0), status (required, enum)
2. Status `da_ban` khi tạo → quantity bắt buộc = 0; nếu nhập quantity > 0 → validation error
3. Tạo thành công → redirect đến trang chi tiết item, show toast "Tạo item thành công"
4. Item tự động gán shop_id từ session admin hiện tại
5. Không thể tạo item cho shop khác dù biết shop_id

**Acceptance Criteria US-002:**
1. Bảng item hiển thị: tên, brand, giá, status (badge màu), quantity, is_public (toggle), ngày tạo
2. Filter status: tất cả / con_hang / giu_cho / da_ban
3. Filter is_public: tất cả / public / private
4. Pagination 20 items/trang, hiển thị tổng số item
5. Chỉ thấy item của shop đang active (TenantGuard)

---

### Epic 2: Media & 360° Viewer

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-010 | Media | Là shop admin, tôi muốn upload nhiều ảnh cùng lúc cho item để nhanh chóng | Critical | 8 | S2 | Done |
| US-011 | Media | Là shop admin, tôi muốn đặt ảnh cover để hiển thị đại diện sản phẩm | High | 3 | S2 | Done |
| US-012 | Media | Là shop admin, tôi muốn sắp xếp lại thứ tự ảnh bằng drag-and-drop | Medium | 5 | S3 | Done |
| US-013 | Media | Là shop admin, tôi muốn tạo SpinSet 360° để khách xem mô hình từ mọi góc | Critical | 8 | S3 | Done |
| US-014 | Media | Là shop admin, tôi muốn upload hàng loạt SpinFrame và tự động sắp xếp thứ tự | Critical | 13 | S3 | Done |
| US-015 | Media | Là shop admin, tôi muốn xóa và reorder SpinFrame khi upload nhầm | High | 5 | S4 | Done |
| US-016 | Media | Là shop admin, tôi muốn preview spinner 360° trong admin trước khi publish | High | 8 | S4 | Done |
| US-017 | Media | Là shop admin, tôi muốn đặt SpinSet default để kiểm soát spinner nào hiển thị | High | 3 | S4 | Done |

**Acceptance Criteria US-014:**
1. Batch upload: chọn nhiều file ảnh cùng lúc (Ctrl+click hoặc drag folder)
2. Auto-sort theo tên file (alphabetical) để xác định frame_index
3. Progress bar cho từng file, total progress
4. File > 10MB hoặc sai định dạng → báo lỗi từng file, không block các file khác
5. Sau upload: frame_index tự động gán 0, 1, 2... liên tục
6. `(spin_set_id, frame_index)` unique constraint: nếu vi phạm → rollback và báo lỗi

---

### Epic 3: Public Storefront

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-020 | Storefront | Là khách hàng, tôi muốn xem catalog của shop để khám phá sản phẩm | Critical | 8 | S2 | Done |
| US-021 | Storefront | Là khách hàng, tôi muốn filter sản phẩm theo brand và giá để tìm nhanh | High | 5 | S3 | Done |
| US-022 | Storefront | Là khách hàng, tôi muốn xem mô hình 360° để đánh giá trước khi mua | Critical | 13 | S4 | Done |
| US-023 | Storefront | Là khách hàng, tôi muốn xem gallery ảnh fallback khi không có spinner | High | 5 | S4 | Done |
| US-024 | Storefront | Là khách hàng, tôi muốn share link item để giới thiệu bạn bè | Medium | 2 | S5 | Done |
| US-025 | Storefront | Là khách hàng, tôi muốn xem thông tin liên hệ shop để hỏi thêm | Medium | 3 | S5 | Done |

**Acceptance Criteria US-022:**
1. SpinViewer load 24 frames trong < 3s trên kết nối 4G (6Mbps)
2. Mouse drag: drag phải → xoay thuận chiều kim đồng hồ; drag trái → ngược lại
3. Touch (mobile): swipe gesture tương tự drag
4. Loading skeleton hiển thị trong khi load frames
5. Nếu bất kỳ frame nào lỗi → fallback gallery, không show spinner bị hỏng
6. SpinViewer chỉ load frames khi user scroll đến section đó (intersection observer)

---

### Epic 4: Pre-Order System

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-030 | Pre-Order | Là khách hàng, tôi muốn đặt hàng trước để không lỡ sản phẩm yêu thích | Critical | 8 | S3 | Done |
| US-031 | Pre-Order | Là khách hàng là member, tôi muốn pre-order tự động liên kết tài khoản để tích điểm | High | 5 | S5 | Done |
| US-032 | Pre-Order | Là shop admin, tôi muốn xem danh sách pre-order và filter để quản lý đơn hàng | Critical | 8 | S3 | Done |
| US-033 | Pre-Order | Là shop admin, tôi muốn cập nhật trạng thái pre-order theo đúng state machine | Critical | 8 | S4 | Done |
| US-034 | Pre-Order | Là shop admin, tôi muốn điểm tự động cộng khi PAID để không làm thủ công | High | 5 | S5 | Done |
| US-035 | Pre-Order | Là shop admin, tôi muốn xem lịch sử thay đổi trạng thái của đơn để audit | High | 3 | S6 | Done |
| US-036 | Pre-Order | Là shop admin, tôi muốn thêm note nội bộ vào đơn để ghi chú xử lý | Medium | 3 | S7 | In Progress |
| US-037 | Pre-Order | Là shop admin, tôi muốn export danh sách pre-order ra CSV để báo cáo | Medium | 5 | S8 | Todo |
| US-038 | Pre-Order | Là shop admin, tôi muốn mở campaign pre-order với cửa sổ thời gian để bán trước khi hàng về | High | 8 | S6 | Done |
| US-039 | Pre-Order | Là shop admin, tôi muốn theo dõi đặt cọc và thanh toán của từng đơn để quản lý tài chính | High | 5 | S5 | Done |

**Acceptance Criteria US-033:**
1. Dropdown status chỉ hiện các transition hợp lệ từ trạng thái hiện tại
2. Click transition → confirm dialog "Xác nhận chuyển sang [status]?"
3. Transition không hợp lệ (gọi API trực tiếp) → 422 với message "Invalid status transition"
4. Sau transition: hiển thị badge status mới, cập nhật timeline lịch sử
5. `CANCELLED` và `REFUNDED` là terminal: dropdown không hiện bất kỳ option nào

**Acceptance Criteria US-038:**
1. Chuyển item sang status `preorder` → form hiện thêm preorder_price, expected_arrival_at, preorder_closes_at
2. `preorder_opens_at` tự động = NOW() (không cần admin nhập)
3. Item xuất hiện trên `/preorders` khi is_public = true, với countdown đến preorder_closes_at
4. `PATCH /items/:id/close-preorder` → set preorder_closes_at = NOW(); nút "Đặt hàng" ẩn trên public
5. `PATCH /items/:id/reopen-preorder` → xóa preorder_closes_at, set preorder_opens_at = NOW()
6. `preorder → con_hang`: WAITING_FOR_GOODS auto-advance → ARRIVED; PENDING_CONFIRMATION không tự advance
7. `preorder → da_ban`: đơn có paid_amount > 0 không tự hủy; response trả số lượng đơn cần xử lý

**Acceptance Criteria US-039:**
1. Pre-order có fields: unit_price, total_amount, deposit_amount, paid_amount
2. remaining = max(0, total_amount - paid_amount) — computed, không lưu riêng
3. deposit_amount và paid_amount có thể set khi tạo pre-order; cập nhật sau tạo qua PATCH endpoint (frontend hiện chưa có UI riêng để edit sau tạo — gap đã biết)
4. paid_amount > total_amount → API từ chối 422 "paid_amount must be <= total_amount"
5. Receipt view hiển thị đầy đủ: tên khách, item, unit_price, total, deposit, paid, remaining

---

### Epic 5: Inventory Management

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-040 | Inventory | Là shop admin, tôi muốn nhập hàng vào kho để cập nhật tồn kho | Critical | 5 | S4 | Done |
| US-041 | Inventory | Là shop admin, tôi muốn ghi nhận hàng xuất kho để tồn kho chính xác | High | 5 | S4 | Done |
| US-042 | Inventory | Là shop admin, tôi muốn điều chỉnh tồn kho khi kiểm kê thực tế | High | 5 | S5 | Done |
| US-043 | Inventory | Là shop admin, tôi muốn xem lịch sử giao dịch kho để audit | High | 3 | S5 | Done |
| US-044 | Inventory | Là shop admin, tôi muốn được cảnh báo khi hàng sắp hết để kịp nhập | Medium | 5 | S6 | Done |
| US-045 | Inventory | Là shop admin, tôi muốn cấu hình ngưỡng cảnh báo low stock per item | Low | 3 | S9 | Todo |

**Acceptance Criteria US-040:**
1. Form: chọn item (autocomplete), nhập quantity (dương), nhập note (optional)
2. Submit → `stock_in` transaction, `items.quantity` tăng atomically
3. Item `da_ban` → không thể nhập kho (form disable + message)
4. Ledger ghi: type=stock_in, quantity_before, quantity_after, user_id, timestamp, note
5. Không cho phép sửa hoặc xóa transaction sau khi tạo

---

### Epic 6: Member Loyalty

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-050 | Loyalty | Là shop admin, tôi muốn đăng ký member mới để bắt đầu tích điểm | High | 5 | S5 | Done |
| US-051 | Loyalty | Là shop admin, tôi muốn xem profile member với đầy đủ lịch sử | High | 5 | S5 | Done |
| US-052 | Loyalty | Là shop admin, tôi muốn điều chỉnh điểm thủ công để xử lý khiếu nại | High | 5 | S6 | Done |
| US-053 | Loyalty | Là shop admin, tôi muốn cấu hình tier và earn rate phù hợp shop | High | 8 | S6 | Done |
| US-054 | Loyalty | Là khách hàng, tôi muốn tra cứu điểm qua SĐT để biết quyền lợi | Medium | 5 | S7 | In Progress |
| US-055 | Loyalty | Là shop admin, tôi muốn xem báo cáo member để biết khách VIP | Medium | 5 | S8 | Todo |
| US-056 | Loyalty | Là shop admin, tôi muốn xóa member không còn active | Low | 3 | S9 | Todo |
| US-057 | Loyalty | Là shop admin, tôi muốn áp dụng điểm thành tiền giảm giá khi khách thanh toán | High | 5 | S6 | Done |

**Acceptance Criteria US-053:**
1. Cấu hình earn rate: nhập "X điểm cho mỗi Y nghìn VND" (ví dụ 1 điểm / 10,000 VND)
2. Cấu hình tier: tối thiểu 1 tier, tối đa 5; mỗi tier có: tên, threshold_points, description
3. Lưu cấu hình → áp dụng ngay cho đơn hàng mới (không hồi tố)
4. Xem preview: "Đơn 500,000 VND → X điểm"
5. Thay đổi tier threshold → chỉ ảnh hưởng đến upgrade từ thời điểm đó, không recompute lịch sử

**Acceptance Criteria US-057:**
1. Admin mở chi tiết pre-order hoặc profile member → nút "Dùng điểm" chỉ hiển thị khi `points_balance > 0`
2. Nhập số điểm muốn redeem → hệ thống hiển thị giá trị discount tương đương (`points × loyalty_json.vnd_per_point` VND) trước khi xác nhận
3. Số điểm yêu cầu > `points_balance` → "Số dư không đủ (có: X, cần: Y)", không cho xác nhận
4. Xác nhận → tạo `MemberPointsLedger` (type: `redeem`, `reference_type: pre_order`, `reference_id: pre_order_id`); `points_balance` giảm đúng số điểm
5. Tier auto-evaluate ngay sau redeem: nếu `points_balance` mới < `min_points` tier hiện tại → tự động downgrade

---

### Epic 7: Social Selling

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-060 | Social | Là shop admin, tôi muốn copy caption bán hàng 1 click để đăng Facebook nhanh | Critical | 5 | S2 | Done |
| US-061 | Social | Là shop admin, tôi muốn copy link item để gửi cho khách | High | 2 | S2 | Done |
| US-062 | Social | Là shop admin, tôi muốn lưu link bài đăng Facebook để tham chiếu | Medium | 3 | S6 | Done |
| US-063 | Social | Là shop admin, tôi muốn tùy chỉnh template caption theo phong cách shop | Medium | 5 | S7 | In Progress |

**Acceptance Criteria US-060:**
1. Nút "Copy Caption" xuất hiện trong trang chi tiết item (admin view)
2. Click → Clipboard API copy nội dung caption
3. Toast notification "Đã copy caption!" hiện 2 giây
4. Caption bao gồm: tên item, giá (format VND), trạng thái, link public catalog, thông tin liên hệ shop
5. Nếu Clipboard API không khả dụng → hiện dialog với text để user copy thủ công

---

### Epic 8: AI Features

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-070 | AI | Là shop admin, tôi muốn upload ảnh để AI tạo draft thông tin item tự động | High | 13 | S6 | Done |
| US-071 | AI | Là shop admin, tôi muốn review và sửa AI draft trước khi tạo item thật | High | 8 | S6 | Done |
| US-072 | AI | Là shop admin, tôi muốn từ chối AI draft với lý do để cải thiện AI | Medium | 3 | S7 | In Progress |
| US-073 | AI | Là shop admin, tôi muốn AI gợi ý caption Facebook từ thông tin item | Low | 8 | S9 | Todo |

**Acceptance Criteria US-070:**
1. Upload 1 ảnh JPEG/PNG ≤ 5MB → call AI API trong background
2. Loading indicator "AI đang phân tích..." với progress animation
3. Kết quả trả về trong ≤ 30 giây; nếu quá 30s → timeout, show "AI hết thời gian, vui lòng thử lại"
4. AiItemDraft gồm: name (string), brand (string), car_brand (string), model_brand (string), condition (enum), description (text)
5. Khi AI API lỗi (5xx, network) → hiện lỗi thân thiện, log error, không crash

---

### Epic 9: Platform Administration

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-080 | Platform | Là platform admin, tôi muốn tạo shop mới để onboard khách hàng | Critical | 5 | S1 | Done |
| US-081 | Platform | Là platform admin, tôi muốn vô hiệu hóa shop để xử lý vi phạm | High | 3 | S1 | Done |
| US-082 | Platform | Là platform admin, tôi muốn tạo user và gán vào shop với đúng quyền | Critical | 8 | S1 | Done |
| US-083 | Platform | Là platform admin, tôi muốn xem log hoạt động toàn platform để giám sát | Medium | 8 | S9 | Todo |
| US-084 | Platform | Là shop admin, tôi muốn cấu hình thông tin shop (tên, logo, contact) | High | 5 | S2 | Done |
| US-085 | Platform | Là user có nhiều shop role, tôi muốn chuyển qua lại giữa các shop mà không cần đăng xuất | High | 3 | S2 | Done |

**Acceptance Criteria US-082:**
1. Tạo user: email (unique toàn platform), password tạm (8+ chars, phải đổi khi login lần đầu)
2. Gán role: chọn shop, chọn role (shop_admin / shop_staff)
3. 1 user có thể có nhiều role tại nhiều shop
4. Không thể xóa role shop_admin cuối cùng của shop (phải còn ít nhất 1 admin)
5. User bị xóa role → không thể truy cập shop đó (403 ngay lập tức, không cần logout)

**Acceptance Criteria US-085:**
1. Header hiển thị tên shop đang active; dropdown "Chọn shop" liệt kê các shop mà user có `UserShopRole` (hiện tại frontend chưa lọc inactive shops ở client — shop inactive sẽ fail ở bước validate server)
2. Chọn shop khác → hệ thống validate: shop active + user có `UserShopRole` trong shop đó
3. Validate thành công → phát JWT mới với `active_shop_id` mới, set lại HttpOnly cookie (không logout/login lại)
4. Dashboard reload tự động; mọi API call tiếp theo filter theo shop mới (TenantGuard đọc `active_shop_id` từ JWT)
5. Shop bị inactive sau khi dropdown load → switch thất bại: "Shop đang tạm ngưng, không thể chuyển"

---

### Epic 10: Reports & Analytics

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-090 | Reports | Là shop admin, tôi muốn xem dashboard tổng quan để nắm tình trạng kinh doanh | High | 8 | S7 | In Progress |
| US-091 | Reports | Là shop admin, tôi muốn xem biểu đồ pre-order theo thời gian để theo dõi xu hướng | Medium | 5 | S8 | Todo |
| US-092 | Reports | Là shop admin, tôi muốn xem báo cáo tồn kho để lập kế hoạch nhập hàng | Medium | 5 | S8 | Todo |
| US-093 | Reports | Là shop admin, tôi muốn xem top member để chăm sóc khách VIP | Medium | 3 | S9 | Todo |
| US-094 | Reports | Là shop admin, tôi muốn export báo cáo ra PDF/Excel để trình bày | Low | 5 | S10 | Todo |

**Acceptance Criteria US-090:**
1. Dashboard có 5 widget: Tổng Item (by status), Pre-Order (by status, doughnut), Doanh thu ước tính tháng, Top 5 Item, Low Stock alert
2. Data refresh mỗi 5 phút (polling) hoặc khi user reload
3. Doanh thu ước tính = tổng giá các pre-order PAID trong tháng hiện tại
4. Top 5 Item = item có nhiều pre-order nhất (tất cả thời gian)
5. Dashboard load trong < 2 giây

---

### Epic 11: QR Code

| ID | Epic | User Story | Priority | Points | Sprint | Status |
|----|------|-----------|----------|--------|--------|--------|
| US-095 | QR Code | Là shop admin, tôi muốn tạo mã QR cho item để dán lên sản phẩm vật lý | Low | 3 | S9 | Done |
| US-096 | QR Code | Là khách hàng, tôi muốn quét QR trên sản phẩm để xem catalog online ngay | Low | 2 | S9 | Done |

**Acceptance Criteria US-095:**
1. Tab/bước "Mã QR" trong trang chi tiết item (admin view)
2. Click "Tạo mã QR" → backend sinh qr_token (16-hex, race-safe via updateMany WHERE qr_token IS NULL)
3. Hiển thị: ảnh QR, link resolve, nút "Tải PNG", nút "Copy link"
4. Token bất biến — không thay đổi dù item update; QR in vật lý không bao giờ hỏng
5. Banner cảnh báo nếu item chưa is_public: "Bật công khai trước khi in QR"

**Acceptance Criteria US-096:**
1. `GET /public/qr/:token` — không cần auth, redirect 302 → item detail với ?source=qr&action=view
2. Frontend hiển thị banner "Bạn đang xem sản phẩm qua mã QR" khi URL có source=qr
3. Token không tồn tại → 404 friendly "Mã QR không hợp lệ"

---

## Sprint Assignment Summary

| Sprint | Dates | Stories | Points | Theme |
|--------|-------|---------|--------|-------|
| S1 | Oct 2025 | US-001~004, US-008, US-080~082 | 44 | Core CRUD + Auth |
| S2 | Nov 2025 | US-005~006, US-009, US-010~011, US-020, US-060~061, US-084~085 | 49 | Media + Public + Social + Auth |
| S3 | Nov 2025 | US-007(skip), US-012~013, US-021, US-030, US-032 | 39 | SpinSet + Pre-order |
| S4 | Dec 2025 | US-014~017, US-022~023, US-033, US-040~041 | 47 | 360° Viewer + Inventory |
| S5 | Dec 2025 | US-031, US-034, US-039, US-042~043, US-050~051 | 38 | Points + Member + Financial |
| S6 | Jan 2026 | US-035, US-038, US-044, US-052~053, US-057, US-062, US-070~071 | 60 | Loyalty + Campaign + AI |
| S7 | Feb 2026 | US-036, US-054, US-063, US-072, US-090 | 29 | Polish + Dashboard |
| S8 | Mar 2026 | US-007, US-037, US-055, US-091~092 | 26 | Reports |
| S9 | Apr 2026 | US-045, US-056, US-073, US-083, US-093, US-095~096 | 32 | Analytics + QR + Cleanup |
| S10 | May 2026 | US-094 + bug fixes + performance | 18 | Stabilization |

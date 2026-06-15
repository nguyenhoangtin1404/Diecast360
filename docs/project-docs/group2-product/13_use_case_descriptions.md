---
title: Use Case Descriptions
version: 1.0
created: 2026-05-22
author: BA/PO Team
project: Diecast360
---

# Use Case Descriptions — Diecast360

## Quy ước

- **Actor chính:** Người khởi tạo use case
- **Actor phụ:** Hệ thống hoặc actor khác tham gia
- **Preconditions:** Điều kiện phải thỏa mãn trước khi UC bắt đầu
- **Postconditions:** Trạng thái hệ thống sau khi UC thành công

---

## UC-01: Login / Authentication

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-01 |
| **Tên** | Đăng nhập vào hệ thống |
| **Actor chính** | Shop Admin, Shop Staff, Platform Super |
| **Actor phụ** | Authentication Service |
| **Priority** | Must |

**Preconditions:**
- User có tài khoản hợp lệ trong hệ thống
- User chưa đăng nhập (không có cookie hợp lệ)

**Main Flow:**
1. User truy cập trang login (`/login`)
2. User nhập email và password
3. User click "Đăng nhập"
4. Hệ thống validate email/password
5. Hệ thống tạo access token và refresh token
6. Hệ thống set HttpOnly cookie (access_token, refresh_token)
7. Hệ thống issue CSRF token
8. Hệ thống redirect đến dashboard

**Alternative Flows:**

*AF-01: User đã đăng nhập*
- Bước 1: Hệ thống phát hiện cookie hợp lệ → redirect trực tiếp đến dashboard, bỏ qua form login

*AF-02: Token hết hạn trong session*
- Bước bất kỳ: Access token hết hạn → hệ thống tự động call refresh endpoint → tiếp tục session

**Exception Flows:**

*EF-01: Sai email hoặc password*
- Bước 4: Validation thất bại → hiển thị "Email hoặc mật khẩu không đúng" (không tiết lộ trường nào sai)
- Sau 5 lần thất bại liên tiếp → khóa tài khoản 15 phút, hiển thị thông báo

*EF-02: Tài khoản bị vô hiệu hóa*
- Bước 4: Tài khoản inactive → "Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản trị"

*EF-03: Shop bị vô hiệu hóa*
- Bước 8: Shop của user inactive → "Shop đang tạm ngưng hoạt động"

**Postconditions:**
- User được xác thực, có session hợp lệ
- Cookie HttpOnly được set
- CSRF token được lưu trong session

---

## UC-02: Manage Items (CRUD)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-02 |
| **Tên** | Quản lý Item Diecast |
| **Actor chính** | Shop Admin |
| **Actor phụ** | TenantGuard, InventoryService |
| **Priority** | Must |

**Preconditions:**
- Shop Admin đã đăng nhập
- Active shop đã được chọn

**Main Flow (Tạo Item):**
1. Admin click "Thêm sản phẩm mới"
2. Hệ thống hiển thị form tạo item
3. Admin nhập: name, brand, car_brand, model_brand, scale (default 1:64), condition, original_price, price, status, quantity, fb_post_content
   - **Status options:** `con_hang` | `giu_cho` | `da_ban` | `preorder`
   - Chọn `preorder`: hiện thêm trường `preorder_price` (giá ưu đãi, optional) và `expected_arrival_at` (ngày về hàng dự kiến, optional)
4. Admin click "Lưu"
5. Hệ thống validate input
6. Hệ thống tạo item với `shop_id` từ active tenant
7. Hệ thống trả về item đã tạo, redirect đến trang chi tiết

**Main Flow (Cập nhật Item):**
1. Admin vào trang chi tiết item
2. Admin click "Chỉnh sửa"
3. Admin sửa các trường cần thiết
4. Admin click "Lưu thay đổi"
5. Hệ thống validate và kiểm tra invariant (da_ban → quantity=0)
6. Hệ thống lưu thay đổi

**Alternative Flows:**

*AF-01: Tạo item với status da_ban*
- Bước 3: Admin chọn status = da_ban
- Bước 3: Field quantity tự động set về 0 và disable

*AF-02: Publish ngay khi tạo*
- Bước 3: Admin check "Publish ngay" → `is_public = true` ngay sau khi tạo

*AF-03: Tạo item với status preorder (campaign)*
- Bước 3: Admin chọn status = preorder → hiện thêm: `preorder_price`, `expected_arrival_at`, `preorder_closes_at` (deadline đặt hàng)
- Bước 6: Hệ thống gán `preorder_opens_at = created_at` của item mới tạo
- Item xuất hiện trên trang `/preorders` công khai sau khi publish (xem UC-18)

**Exception Flows:**

*EF-01: Vi phạm invariant da_ban*
- Bước 5: status=da_ban nhưng quantity > 0 → "Hàng đã bán phải có số lượng = 0"

*EF-02: Thiếu field bắt buộc*
- Bước 5: name hoặc price trống → highlight field lỗi với message cụ thể

*EF-03: Thay đổi quantity trực tiếp*
- Bước 5: Phát hiện request thay đổi quantity không qua inventory → 422 "Vui lòng dùng chức năng nhập/xuất kho"

*EF-04: Transition không hợp lệ*
- Cập nhật item từ `da_ban` → `preorder` hoặc `giu_cho` → bị chặn; "Transition trạng thái không hợp lệ"
- Transition `da_ban` → `con_hang` được phép (tự động set quantity=1 nếu không gửi)

**Postconditions:**
- Item được tạo/cập nhật với đúng thông tin
- Nếu `is_public = true`: item xuất hiện trên public catalog
- Item status `preorder`: item xuất hiện thêm trên trang `/preorders` công khai
- Audit log ghi nhận thao tác

---

## UC-03: Upload & Manage Images

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-03 |
| **Tên** | Upload và quản lý hình ảnh item |
| **Actor chính** | Shop Admin |
| **Actor phụ** | StorageService |
| **Priority** | Must |

**Preconditions:**
- Item đã tồn tại
- Admin có quyền với item này

**Main Flow:**
1. Admin vào tab "Hình ảnh" của item
2. Admin click "Upload ảnh" hoặc drag files vào vùng upload
3. Hệ thống validate file (định dạng, kích thước)
4. Hệ thống upload file lên storage (local/R2)
5. Hệ thống tạo ItemImage với signed URL
6. Ảnh hiển thị trong gallery của item
7. Ảnh đầu tiên tự động trở thành cover nếu chưa có cover

**Alternative Flows:**

*AF-01: Thay đổi cover*
- Bước sau: Admin click icon "Đặt làm cover" trên ảnh bất kỳ
- Ảnh cũ bỏ `is_cover`, ảnh mới được `is_cover = true`

*AF-02: Reorder ảnh*
- Admin drag-and-drop ảnh trong gallery
- Hệ thống cập nhật `display_order` của tất cả ảnh

*AF-03: Xóa ảnh*
- Admin click icon xóa → confirm dialog
- Xóa thành công: file cleanup async, ItemImage record xóa
- Nếu xóa ảnh cover → ảnh tiếp theo (display_order nhỏ nhất) trở thành cover mới

**Exception Flows:**

*EF-01: File vượt kích thước*
- Bước 3: File > 10MB → "File [tên] vượt giới hạn 10MB, đã bỏ qua"

*EF-02: Định dạng không hỗ trợ*
- Bước 3: File .gif, .pdf, .mp4 → "Định dạng [ext] không được hỗ trợ"

*EF-03: Vượt giới hạn số ảnh*
- Bước 4: Đã có 20 ảnh → "Tối đa 20 ảnh mỗi item, vui lòng xóa bớt"

**Postconditions:**
- ItemImage được tạo với `item_id`, `storage_path`, `display_order`, `is_cover`
- Cover ảnh luôn có đúng 1 ảnh (hoặc 0 nếu không có ảnh nào)

---

## UC-04: Create & Manage 360° Spinner

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-04 |
| **Tên** | Tạo và quản lý SpinSet 360° |
| **Actor chính** | Shop Admin |
| **Actor phụ** | StorageService |
| **Priority** | Must |

**Preconditions:**
- Item đã tồn tại
- Admin có quyền với item này

**Main Flow:**
1. Admin vào tab "360° Spinner" của item
2. Admin click "Tạo SpinSet mới"
3. Admin nhập label (ví dụ "Góc chính diện", "Góc nghiêng")
4. Hệ thống tạo SpinSet; nếu là SpinSet đầu tiên → `is_default = true`
5. Admin chọn "Upload Frames"
6. Admin chọn nhiều file ảnh (sắp xếp đúng thứ tự góc quay)
7. Hệ thống sort theo tên file → gán `frame_index` 0, 1, 2...
8. Hệ thống upload từng frame lên storage
9. Frames hiển thị trong danh sách với thumbnail

**Alternative Flows:**

*AF-01: Thay đổi default SpinSet*
- Admin click "Đặt làm default" trên SpinSet khác
- SpinSet cũ: `is_default = false`; SpinSet mới: `is_default = true`

*AF-02: Xóa SpinFrame*
- Admin click xóa frame → confirm → frame bị xóa
- Hệ thống auto-renumber: các frame sau giảm frame_index đi 1

*AF-03: Reorder frames*
- Admin drag-and-drop frame → cập nhật frame_index toàn bộ SpinSet

**Exception Flows:**

*EF-01: frame_index bị trùng*
- Hệ thống phát hiện duplicate → rollback, báo lỗi "Lỗi trùng thứ tự frame, vui lòng thử lại"

*EF-02: Vượt giới hạn frame*
- Upload thêm khi đã có 36 frame → "SpinSet đã đủ 36 frame tối đa"

*EF-03: SpinSet bị xóa khi đang là default và còn SpinSet khác*
- Hệ thống tự động promote SpinSet cũ nhất còn lại thành default

**Postconditions:**
- SpinSet và SpinFrame được tạo với frame_index liên tục 0..n-1
- Luôn có đúng 1 SpinSet là default (hoặc 0 nếu không có SpinSet nào)

---

## UC-05: Publish Item to Public Catalog

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-05 |
| **Tên** | Publish/Unpublish item |
| **Actor chính** | Shop Admin |
| **Priority** | Must |

**Preconditions:**
- Item tồn tại và chưa soft-deleted
- Admin có quyền

**Main Flow:**
1. Admin xem danh sách item hoặc chi tiết item
2. Admin toggle switch "Hiển thị công khai" (is_public)
3. Hệ thống cập nhật `is_public = true`
4. Toast: "Item đã được công khai"
5. Item xuất hiện trên public catalog trong ≤ 5 giây

**Alternative Flows:**

*AF-01: Unpublish*
- Admin toggle → is_public = false
- Item biến mất khỏi public catalog

**Exception Flows:**

*EF-01: Item bị soft-deleted*
- Toggle không khả dụng, item không thể publish khi đã xóa

**Postconditions:**
- `is_public` được cập nhật đúng
- Public catalog phản ánh trạng thái mới

---

## UC-06: Browse Public Catalog (Customer)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-06 |
| **Tên** | Khách hàng duyệt catalog công khai |
| **Actor chính** | End Customer (anonymous) |
| **Priority** | Must |

**Preconditions:**
- Shop tồn tại và active
- Shop có ít nhất 1 item public

**Main Flow:**
1. Khách truy cập `/s/[shop_slug]`
2. Hệ thống kiểm tra shop slug hợp lệ và active
3. Hệ thống trả về danh sách item: `is_public=true`, `deleted_at=null`
4. Khách xem grid sản phẩm với: ảnh cover, tên, giá, status badge
5. Khách dùng filter (brand, status, giá) hoặc search tên
6. Khách click vào item → xem chi tiết (UC-07)

**Alternative Flows:**

*AF-01: Không có item nào*
- Bước 3: Empty state "Shop chưa có sản phẩm công khai"

*AF-02: Tìm kiếm không có kết quả*
- Bước 5: "Không tìm thấy sản phẩm phù hợp"

**Exception Flows:**

*EF-01: Shop không tồn tại*
- Bước 2: 404 page "Shop không tồn tại"

*EF-02: Shop inactive*
- Bước 2: 404 page "Shop hiện không hoạt động"

**Postconditions:**
- Không có side effect; read-only operation
- Analytics view count tăng (Could)

---

## UC-07: View Item Detail with 360° Viewer (Customer)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-07 |
| **Tên** | Xem chi tiết item với SpinViewer 360° |
| **Actor chính** | End Customer (anonymous) |
| **Priority** | Must |

**Preconditions:**
- Item tồn tại, `is_public=true`, `deleted_at=null`
- Item thuộc shop active

**Main Flow:**
1. Khách click vào item từ catalog
2. Hệ thống load trang chi tiết item
3. Hệ thống kiểm tra: có SpinSet default không?
4. Nếu có → tải SpinViewer với URL signed của tất cả frames (ordered by frame_index)
5. Hệ thống hiển thị: SpinViewer + tên, giá, mô tả, status badge, thông tin shop
6. Khách drag/swipe SpinViewer để xem 360°
7. Khách click "Đặt hàng" → UC-08

**Alternative Flows:**

*AF-01: Không có SpinSet*
- Bước 3: Không có SpinSet → hiển thị gallery ảnh thường
- Bước 4: Gallery với image slideshow

*AF-02: SpinSet có nhưng frame load lỗi*
- Bước 4: Frame nào lỗi → fallback sang gallery ảnh thường
- Log lỗi phía server

*AF-03: Item da_ban*
- Bước 5: Hiển thị badge "Đã bán" → nút "Đặt hàng" bị disable

**Exception Flows:**

*EF-01: Item không public*
- Trả về 404 (không tiết lộ item tồn tại)

**Postconditions:**
- SpinViewer render đúng với frame_index 0..n-1
- Khách có thể xem đầy đủ thông tin để quyết định mua

---

## UC-08: Create Pre-Order (Customer)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-08 |
| **Tên** | Khách hàng tạo pre-order |
| **Actor chính** | End Customer |
| **Actor phụ** | MemberService, NotificationService |
| **Priority** | Must |

**Preconditions:**
- Item `is_public=true`, status là `con_hang`, `giu_cho`, hoặc `preorder` (và cửa sổ đặt hàng còn mở)
- Shop active

**Main Flow:**
1. Khách click "Đặt hàng trước" trên trang chi tiết item
2. Hệ thống hiển thị form pre-order
3. Khách nhập: họ tên, số điện thoại, số lượng (mặc định 1), ghi chú (optional)
   - Item status `preorder` và cửa sổ còn mở: form hiển thị `preorder_price` thay vì `price`
   - Nếu shop yêu cầu đặt cọc: hiển thị `deposit_amount` cần thanh toán trước
4. Khách click "Xác nhận đặt hàng"
5. Hệ thống lookup SĐT trong bảng member của shop
6. Hệ thống tạo pre-order với status `PENDING_CONFIRMATION`
7. Nếu tìm thấy member: liên kết pre-order với member_id
8. Hệ thống trả về: order ID, thông tin đơn hàng, hướng dẫn tiếp theo
9. Trang xác nhận: "Đặt hàng thành công! Mã đơn: [ORDER_ID]"

**Alternative Flows:**

*AF-01: Khách là member*
- Bước 5: Tìm thấy member theo SĐT → hiển thị "Chào [tên]! Đơn này sẽ tích [X] điểm"
- Bước 7: pre-order.member_id = member.id

**Exception Flows:**

*EF-01: Item hết hàng (da_ban) khi submit*
- Bước 6: Item đã bị đổi sang da_ban trước khi submit → "Sản phẩm này đã được bán cho khách khác, xin lỗi"

*EF-02: SĐT không hợp lệ*
- Bước 4: SĐT sai định dạng Việt Nam → "Số điện thoại không hợp lệ"

*EF-03: Thiếu thông tin bắt buộc*
- Bước 4: Tên hoặc SĐT trống → highlight field lỗi

**Postconditions:**
- PreOrder được tạo với status `PENDING_CONFIRMATION`
- Nếu có member: pre-order liên kết với member
- Shop admin nhận notification (Could)

---

## UC-09: Manage Pre-Order Lifecycle (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-09 |
| **Tên** | Quản lý vòng đời pre-order |
| **Actor chính** | Shop Admin |
| **Actor phụ** | MemberPointsService, InventoryService |
| **Priority** | Must |

**Preconditions:**
- Admin đã đăng nhập
- Pre-order thuộc shop của admin

**Main Flow:**
1. Admin vào "Quản lý đơn hàng"
2. Admin xem danh sách pre-order (mặc định: tất cả trạng thái, mới nhất trước)
3. Admin filter theo trạng thái cần xử lý
4. Admin click vào đơn cần xử lý
5. Admin xem chi tiết: thông tin khách, item, trạng thái hiện tại, lịch sử transition; thông tin tài chính: `total_amount`, `deposit_amount`, `paid_amount`, `remaining` (= max(0, total - paid))
6. Admin chọn trạng thái mới từ dropdown (chỉ hiện transition hợp lệ)
7. Hệ thống hiển thị confirm dialog
8. Admin xác nhận
9. Hệ thống thực hiện transition, ghi log
10. Nếu transition → PAID và có member: tự động cộng điểm

**Alternative Flows:**

*AF-01: Hủy đơn (CANCELLED)*
- Bước 6: Admin chọn CANCELLED → nhập lý do hủy (optional)
- Bước 10: Nếu đơn đã cộng điểm (từng ở PAID) → tự động trừ điểm

*AF-02: Refund*
- Chỉ có thể REFUND từ PAID
- Tự động tạo ledger entry trừ điểm

*AF-03: Xuất biên lai*
- Admin click "Xem biên lai" → hiển thị receipt với: thông tin khách, item, total_amount, deposit_amount, paid_amount, remaining (xem UC-19)

**Exception Flows:**

*EF-01: Transition không hợp lệ*
- Bước 9: API từ chối → "Không thể chuyển từ [A] sang [B]"

*EF-02: Đơn của shop khác*
- Bước 4: TenantGuard → 403

**Postconditions:**
- Pre-order ở trạng thái mới
- Lịch sử transition được ghi đầy đủ
- Điểm member được điều chỉnh nếu cần

---

## UC-10: Manage Inventory Transactions

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-10 |
| **Tên** | Quản lý giao dịch tồn kho |
| **Actor chính** | Shop Admin |
| **Priority** | Must |

**Preconditions:**
- Admin đăng nhập
- Có quyền với shop

**Main Flow (Nhập kho):**
1. Admin vào "Quản lý kho" → "Nhập hàng"
2. Admin chọn item (autocomplete search)
3. Admin nhập số lượng nhập và ghi chú
4. Admin click "Xác nhận nhập kho"
5. Hệ thống tạo `InventoryTransaction` (type: stock_in)
6. Hệ thống cập nhật `items.quantity` atomically
7. Hiển thị: "Đã nhập [N] [tên item], tồn kho hiện tại: [X]"

**Exception Flows:**

*EF-01: Nhập kho item da_ban*
- Bước 2: Chọn item da_ban → form disable, "Không thể nhập kho hàng đã bán"

*EF-02: Xuất kho vượt số lượng*
- Bước 4: quantity_out > quantity_hiện_tại → "Không đủ hàng tồn kho (có: X, cần xuất: Y)"

**Postconditions:**
- Transaction ghi bất biến vào ledger (`type`, `quantity`, `delta`, `resulting_quantity`, `actor_user_id`, `created_at`, `note`)
- `items.quantity` được cập nhật đúng (atomic)
- Reversal chính thức: admin có thể tạo reversal liên kết qua `reversal_of_id`; mỗi transaction chỉ được reverse 1 lần (double-reversal bị chặn); reversal tự tạo transaction đối ứng và cập nhật `items.quantity`

---

## UC-11: Manage Members & Tiers

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-11 |
| **Tên** | Quản lý thành viên và hạng |
| **Actor chính** | Shop Admin |
| **Priority** | Must |

**Preconditions:**
- Admin đăng nhập, shop đã cấu hình loyalty

**Main Flow (Thêm member):**
1. Admin vào "Quản lý thành viên" → "Thêm thành viên"
2. Admin nhập: họ tên (bắt buộc), SĐT (bắt buộc), email, ngày sinh
3. Admin click "Lưu"
4. Hệ thống tạo member với tier thấp nhất (default tier)
5. Member xuất hiện trong danh sách

**Main Flow (Xóa member):**
1. Admin click "Xóa" trên member cần xóa
2. Hệ thống kiểm tra: có pre-order non-terminal không?
3. Không có → confirm dialog → xóa member
4. Có → "Không thể xóa: thành viên có [N] đơn đang xử lý"

**Exception Flows:**

*EF-01: SĐT trùng*
- Bước 3: SĐT đã có member → "Số điện thoại này đã đăng ký"

**Postconditions:**
- Member được tạo với điểm = 0, tier = default
- Xóa thành công: member không còn trong hệ thống; pre-order lịch sử vẫn còn

---

## UC-12: Earn / Redeem / Adjust Points

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-12 |
| **Tên** | Tích điểm, dùng điểm, điều chỉnh điểm |
| **Actor chính** | Hệ thống (auto earn) / Shop Admin (manual adjust) |
| **Priority** | Must |

**Main Flow (Auto Earn khi PAID):**
1. Pre-order transition → PAID (UC-09)
2. Hệ thống kiểm tra pre-order có member_id không
3. Có → tính điểm: points = floor(price / earn_unit) × earn_per_unit
4. Hệ thống tạo `MemberPointsLedger` (type: earn, reference: pre_order_id)
5. Hệ thống cập nhật `members.points_balance`
6. Hệ thống kiểm tra tier upgrade: nếu total_points >= next_tier.threshold → upgrade tier

**Main Flow (Redeem — Admin áp dụng điểm vào đơn hàng):**
1. Khách yêu cầu dùng điểm để giảm tiền khi thanh toán
2. Admin vào chi tiết pre-order hoặc profile member → "Dùng điểm"
3. Admin nhập số điểm muốn redeem (hệ thống kiểm tra: `points_balance >= số điểm`)
4. Hệ thống tính giá trị tương đương: `discount = points × (loyalty_json.vnd_per_point)`
5. Hệ thống tạo `MemberPointsLedger` (type: `redeem`, reason ghi rõ số pre-order liên quan; `reference_type/reference_id` không được set tự động qua API redeem hiện tại — audit trail phân biệt qua `type = redeem`)
6. Cập nhật `members.points_balance` giảm đi số điểm đã redeem
7. Admin cập nhật `paid_amount` của pre-order để phản ánh phần được giảm

**Main Flow (Manual Adjust):**
1. Admin vào profile member → "Điều chỉnh điểm"
2. Admin chọn: cộng/trừ điểm
3. Admin nhập số điểm và lý do (bắt buộc)
4. Admin click "Xác nhận"
5. Hệ thống tạo ledger entry (type: `adjust`)
6. Cập nhật points_balance

**Exception Flows:**

*EF-01: Trừ điểm vượt số dư (Redeem hoặc Adjust)*
- Bước 3: điểm yêu cầu > points_balance → "Số dư điểm không đủ (hiện có: X, yêu cầu: Y)"

**Postconditions:**
- `MemberPointsLedger` có bản ghi mới (immutable) với type `earn` / `redeem` / `adjust`
- `members.points_balance` cập nhật đúng
- Tier được auto-evaluate sau mỗi thay đổi điểm: **upgrade khi vượt threshold lên, downgrade khi điểm giảm xuống dưới threshold hiện tại** (xem ghi chú bên dưới)

> **Quyết định nghiệp vụ — Tier Auto-Downgrade:** Hệ thống tự động hạ tier khi `points_balance` giảm xuống dưới `min_points` của tier hiện tại (ví dụ: sau khi redeem hoặc refund). Điều này khác với nhiều loyalty program dùng "lifetime points" không bao giờ giảm. Trade-off: đảm bảo tier phản ánh đúng số dư thực tế nhưng có thể gây bất ngờ cho khách hàng. Shop owner cần thông báo rõ cho khách chính sách này.

---

## UC-13: Copy Caption & Post to Facebook

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-13 |
| **Tên** | Copy caption và đăng lên Facebook |
| **Actor chính** | Shop Admin |
| **Priority** | Must |

**Preconditions:**
- Item đã tồn tại (dù chưa public)
- Shop có template caption cấu hình

**Main Flow:**
1. Admin vào chi tiết item trong admin
2. Admin click "Copy Caption"
3. Hệ thống build caption từ template shop + thông tin item
4. Hệ thống copy vào clipboard (Clipboard API)
5. Toast: "Đã copy caption!"
6. Admin mở Facebook, tạo bài đăng, paste caption
7. Admin đăng bài thành công
8. Admin quay lại Diecast360, click "Lưu link bài đăng"
9. Admin nhập URL bài đăng Facebook
10. Hệ thống tạo `FacebookPost` liên kết với item

**Alternative Flows:**

*AF-01: Copy Link thay vì Caption*
- Bước 2: Admin click "Copy Link"
- Bước 3: Copy URL public catalog item vào clipboard

*AF-02: Clipboard không khả dụng*
- Bước 4: Clipboard API không hỗ trợ (HTTP, old browser) → modal hiện caption text để copy tay

**Exception Flows:**
- Không có exception flow đặc biệt; đây là thao tác UI đơn giản

**Postconditions:**
- Caption trong clipboard, sẵn sàng paste
- FacebookPost được lưu (nếu admin thực hiện bước 8-10)

---

## UC-14: AI-Generate Item Description

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-14 |
| **Tên** | AI gợi ý caption/mô tả sản phẩm |
| **Actor chính** | Shop Admin |
| **Actor phụ** | AI API (OpenAI/Gemini) |
| **Priority** | Could |

**Preconditions:**
- Item đã có thông tin cơ bản (tên, brand, giá)
- AI API key hợp lệ và có quota

**Main Flow:**
1. Admin vào trang chi tiết item
2. Admin click "AI Gợi ý Caption"
3. Hệ thống gửi context item (tên, brand, giá, condition) lên AI API
4. AI trả về caption gợi ý (< 30 giây)
5. Hệ thống hiển thị caption trong textarea có thể edit
6. Admin sửa và click "Dùng caption này" → lưu vào `fb_post_content`

**Exception Flows:**

*EF-01: AI API timeout*
- Bước 4: Quá 30 giây → "AI không phản hồi, vui lòng thử lại sau"

*EF-02: AI API lỗi*
- Bước 4: 5xx từ AI → "Tính năng AI tạm thời không khả dụng"

**Postconditions:**
- `fb_post_content` được cập nhật nếu admin xác nhận

---

## UC-15: AI-Draft Item from Photos

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-15 |
| **Tên** | AI phân tích ảnh để tạo draft item |
| **Actor chính** | Shop Admin |
| **Actor phụ** | AI API, AiItemDraftService |
| **Priority** | Should |

**Preconditions:**
- Admin đăng nhập
- AI API khả dụng

**Main Flow:**
1. Admin vào "Tạo sản phẩm" → chọn "Tạo bằng AI"
2. Admin upload ảnh mô hình (1-3 ảnh)
3. Hệ thống gửi ảnh lên AI API để phân tích
4. Hệ thống hiển thị loading "AI đang phân tích..."
5. AI trả về kết quả → hệ thống tạo `AiItemDraft` (status: PENDING)
6. Hệ thống hiển thị form review draft với tất cả fields được điền sẵn
7. Admin review, sửa các trường cần thiết
8. Admin click "Xác nhận tạo sản phẩm"
9. Hệ thống tạo Item từ thông tin draft
10. AiItemDraft status → CONFIRMED
11. Redirect đến trang chi tiết Item mới

**Alternative Flows:**

*AF-01: Từ chối draft*
- Bước 8: Admin click "Từ chối" → nhập lý do → AiItemDraft status REJECTED
- Không tạo item

*AF-02: Tạo thủ công sau khi từ chối*
- Admin có thể tạo item mới từ đầu sau khi reject draft

**Exception Flows:**

*EF-01: AI không nhận ra sản phẩm*
- Bước 5: AI trả về confidence thấp → hiển thị warning "AI không chắc chắn, vui lòng kiểm tra kỹ"
- Draft vẫn được tạo với thông tin không đầy đủ

*EF-02: AI API timeout (>30s)*
- Bước 4: Timeout → "AI phân tích quá lâu. Vui lòng thử lại hoặc tạo sản phẩm thủ công"

*EF-03: Ảnh không rõ / chất lượng kém*
- AI trả về kết quả sai → Admin phải sửa tay → UC vẫn tiếp tục như bình thường

**Postconditions:**
- AiItemDraft tồn tại với status PENDING/CONFIRMED/REJECTED
- Nếu CONFIRMED: Item mới được tạo với thông tin từ draft
- Lịch sử draft có thể audit

---

## UC-16: Logout / Session Management

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-16 |
| **Tên** | Đăng xuất và quản lý phiên đăng nhập |
| **Actor chính** | Shop Admin, Shop Staff, Platform Super |
| **Priority** | Must |

**Preconditions:**
- User đang có phiên đăng nhập hợp lệ (cookie access_token còn hiệu lực)

**Main Flow (Đăng xuất chủ động):**
1. User click "Đăng xuất" trong menu
2. Hệ thống gọi `POST /api/v1/auth/logout`
3. Hệ thống revoke refresh token hiện tại (set `revoked_at = NOW()`)
4. Hệ thống xóa HttpOnly cookies: `access_token`, `refresh_token`, `csrf_token`
5. Redirect đến trang login: "Bạn đã đăng xuất thành công"

**Alternative Flows:**

*AF-01: Access token hết hạn trong session (15 phút)*
- Hệ thống tự động gọi refresh endpoint với refresh token
- Nếu refresh thành công → phát JWT mới, session tiếp tục trong suốt
- Nếu refresh token cũng hết hạn / bị revoke → redirect đến login (session expired)

*AF-02: Đăng xuất khỏi tất cả thiết bị*
- Xảy ra tự động sau khi reset password (UC-17): tất cả refresh token của user bị revoke
- Thiết bị khác đang login → access token hết hạn → refresh fail → buộc login lại

**Exception Flows:**

*EF-01: Mạng lỗi khi gọi logout*
- HttpOnly cookie không thể bị xóa bằng JavaScript — chỉ server mới có thể clear qua `Set-Cookie: Max-Age=0`
- Nếu server call thất bại: client redirect về trang login; cookie vẫn tồn tại nhưng refresh token trên server sẽ expire sau 7 ngày
- Hành vi an toàn: token hết hạn tự nhiên là fallback đủ dùng; không có action nào ở client

**Postconditions:**
- Refresh token bị revoke — không thể dùng để phát access token mới
- Cookies bị xóa — browser không còn gửi credentials
- Audit log ghi nhận thời điểm logout

---

## UC-17: Forgot Password / Password Reset

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-17 |
| **Tên** | Quên mật khẩu và đặt lại mật khẩu |
| **Actor chính** | Shop Admin, Shop Staff, Platform Super |
| **Actor phụ** | MailService (Resend / mock) |
| **Priority** | Must |

**Preconditions:**
- User có tài khoản hợp lệ trong hệ thống
- User chưa đăng nhập

**Main Flow (Yêu cầu reset):**
1. User click "Quên mật khẩu?" trên trang login
2. User nhập địa chỉ email
3. User click "Gửi link đặt lại"
4. Hệ thống luôn trả về thông báo trung lập: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn trong vài phút" (không tiết lộ email có tồn tại hay không)
5. Nếu email hợp lệ và active: hệ thống tạo reset token (SHA-256 hash, one-time use, TTL 1 giờ)
6. Hệ thống gửi email chứa link đặt lại mật khẩu

**Main Flow (Đặt lại mật khẩu):**
1. User click link trong email
2. Hệ thống kiểm tra token: hợp lệ + chưa dùng (`used_at IS NULL`) + chưa hết hạn
3. Hệ thống hiển thị form đặt mật khẩu mới
4. User nhập mật khẩu mới (≥ 8 ký tự) và xác nhận lại
5. Hệ thống lưu mật khẩu mới (bcrypt, cost 12), đánh dấu token `used_at = NOW()`
6. Hệ thống revoke tất cả refresh token hiện tại của user
7. Redirect đến trang login: "Đặt lại mật khẩu thành công, vui lòng đăng nhập lại"

**Exception Flows:**

*EF-01: Rate limit*
- Bước 3 (Reset): Cùng IP > 10 request/giờ → 429 Too Many Requests
- Cùng email > 3 request/giờ → silent reject (vẫn trả 200 để tránh enumeration)

*EF-02: Token hết hạn hoặc đã dùng*
- Bước 2 (Đặt lại): Token không hợp lệ → "Link đặt lại không hợp lệ hoặc đã hết hạn"
- Hiển thị nút "Yêu cầu link mới"

*EF-03: Mật khẩu mới quá yếu*
- Bước 4: < 8 ký tự → "Mật khẩu phải có ít nhất 8 ký tự"

*EF-04: Gửi email thất bại*
- Bước 6: Email provider lỗi → hệ thống log lỗi nhưng vẫn trả 200 (không tiết lộ gửi thất bại)

**Postconditions:**
- Mật khẩu mới được lưu (bcrypt hash)
- Reset token bị đánh dấu `used_at = NOW()` — không thể dùng lại
- Tất cả refresh token cũ bị revoke → buộc đăng nhập lại trên thiết bị khác

---

## UC-18: Pre-order Campaign (Item status `preorder`)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-18 |
| **Tên** | Tạo và quản lý campaign đặt hàng trước theo thời gian |
| **Actor chính** | Shop Admin |
| **Actor phụ** | End Customer (xem campaign công khai) |
| **Priority** | Must |

**Preconditions:**
- Admin đã đăng nhập
- Item tồn tại với status bất kỳ, trừ `da_ban`

**Main Flow (Mở campaign preorder):**
1. Admin chọn item → "Mở Pre-order Campaign"
2. Admin nhập (tất cả optional): `preorder_price` (giá ưu đãi), `preorder_closes_at` (deadline đặt hàng)
3. Admin đổi status item → `preorder`
4. Hệ thống gán `preorder_opens_at = item.created_at` — tính từ lúc sản phẩm được tạo, không phải lúc mở campaign (cả tạo mới lẫn update path đều dùng `created_at`)
5. Pre-order đầu tiên của item xuất hiện trên trang công khai `/preorders`; trang này hiển thị các `PreOrder` row đang active (PENDING_CONFIRMATION / WAITING_FOR_GOODS) của item is_public — không phải item-based listing
6. Catalog hiển thị `preorder_price` (nếu có) trong khi cửa sổ mở

**Main Flow (Đóng campaign sớm):**
1. Admin vào item đang ở status `preorder`
2. Admin click "Đóng Campaign Sớm"
3. Hệ thống `PATCH /items/:id/close-preorder`: set `preorder_closes_at = NOW()`
4. Countdown về 0; trang public ẩn nút "Đặt hàng trước"
5. Status item vẫn là `preorder` (không tự động đổi)

**Main Flow (Mở lại campaign):**
1. Admin click "Mở lại Campaign"
2. Hệ thống `PATCH /items/:id/reopen-preorder`: xóa `preorder_closes_at`, set `preorder_opens_at = NOW()`
3. Đợt mới tính từ thời điểm bấm mở lại (không dùng `created_at` gốc)
4. Admin set deadline mới qua PATCH thông thường nếu cần

**Main Flow (Kết thúc campaign — hàng về):**
1. Admin chuyển item `preorder → con_hang`
2. Hệ thống tự động advance tất cả đơn `WAITING_FOR_GOODS → ARRIVED`
3. Đơn `PENDING_CONFIRMATION` **không** tự động advance; response trả `preorders_pending_count` → UI cảnh báo admin xem xét thủ công

**Main Flow (Hủy campaign — nhà cung cấp hủy):**
1. Admin chuyển item `preorder → da_ban`
2. Hệ thống set `quantity = 0`
3. Đơn đã có `paid_amount > 0` **không** tự động hủy; admin phải xử lý hoàn tiền thủ công

**Alternative Flows:**

*AF-01: Item giu_cho → preorder*
- Được phép; admin tự kiểm tra các hold trước khi chuyển — không có guard tự động

*AF-02: Khách xem trang campaign công khai (`/preorders`)*
- Không cần đăng nhập
- Thấy danh sách campaign đang mở: ảnh cover, tên item, countdown, preorder_price, nút "Đặt hàng trước"

**Exception Flows:**

*EF-01: Chuyển da_ban → preorder*
- Bị chặn: "Không thể mở pre-order cho item đã bán hết"

*EF-02: Cửa sổ đã đóng nhưng khách vẫn cố submit*
- Chỉ trigger khi `preorder_closes_at IS NOT NULL AND preorder_closes_at < NOW()`
- Nếu `preorder_closes_at IS NULL` (cửa sổ vô hạn), EF-02 không bao giờ kích hoạt — cửa sổ luôn mở
- Hệ thống trả 422 "Cửa sổ đặt hàng đã đóng"

**Postconditions:**
- Item ở status `preorder`, hiển thị trang `/preorders` khi `is_public = true`
- Countdown UI tính từ `preorder_opens_at` đến `preorder_closes_at`; nếu `preorder_closes_at IS NULL` → hiển thị "Không giới hạn thời gian" (không có countdown)
- Sau khi reopen (`PATCH /reopen-preorder`): `preorder_closes_at` về NULL — cửa sổ mặc định là vô hạn cho đến khi admin tự set deadline mới
- Sau khi cửa sổ đóng: catalog hiển thị `price` thông thường thay vì `preorder_price`

---

## UC-19: Pre-order Financial Tracking & Receipt

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-19 |
| **Tên** | Theo dõi tài chính pre-order và xuất biên lai |
| **Actor chính** | Shop Admin |
| **Actor phụ** | End Customer (xem biên lai) |
| **Priority** | Must |

**Preconditions:**
- Pre-order đã tồn tại (status bất kỳ non-terminal)
- Admin đã đăng nhập với quyền trong shop

**Main Flow (Ghi nhận đặt cọc):**
1. Khách liên hệ / đến shop và đặt cọc
2. Admin mở chi tiết pre-order
3. Admin nhập `deposit_amount` (tổng tiền cọc thực nhận — **ghi đè**, không cộng dồn; ví dụ: cọc đợt 1: 200k → nhập 200k; cọc thêm đợt 2: 100k → nhập 300k)
4. Hệ thống cập nhật; `remaining` = `max(0, total_amount - paid_amount)`
5. UI hiển thị tóm tắt: Tổng đơn / Đã cọc / Đã thu / Còn lại

**Main Flow (Ghi nhận thanh toán cuối):**
1. Khách đến lấy hàng và thanh toán phần còn lại
2. Admin nhập `paid_amount` (tổng đã thu, bao gồm tiền cọc trước đó)
3. Hệ thống tính `remaining = max(0, total_amount - paid_amount)`
4. Admin chuyển pre-order → PAID (xem UC-09)
5. Nếu member: điểm tự động cộng dựa trên `total_amount` (xem UC-12)

**Main Flow (Xuất biên lai):**
1. Admin click "Xem biên lai" trên pre-order
2. Hệ thống render receipt gồm: tên khách, SĐT, tên item, `unit_price`, `quantity`, `total_amount` (= `unit_price × quantity`; nếu item đang trong cửa sổ preorder khi tạo đơn, `unit_price` = `preorder_price`), `deposit_amount`, `paid_amount`, `remaining`, timestamp
3. Admin chia sẻ link biên lai hoặc in cho khách

**Alternative Flows:**

*AF-01: Admin in biên lai để trao cho khách*
- Admin dùng print/screenshot trang receipt để chia sẻ với khách
- Endpoint `GET /preorders/:id/receipt` yêu cầu auth (JwtAuthGuard + TenantGuard) — không có public receipt link; khách không thể tự xem online

**Exception Flows:**

*EF-01: paid_amount > total_amount*
- API từ chối: 422 "paid_amount must be <= total_amount" (`validateFinancials` trong service)
- Admin phải nhập giá trị đúng ≤ total_amount

**Postconditions:**
- `deposit_amount` và `paid_amount` được lưu trên pre-order
- `remaining` là computed field (`max(0, total_amount - paid_amount)`) — không lưu riêng
- Biên lai phản ánh trạng thái tài chính mới nhất

---

## UC-20: Chuyển Active Shop (Multi-role User)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-20 |
| **Tên** | User đổi shop đang làm việc |
| **Actor chính** | Shop Admin / Shop Staff có nhiều shop role |
| **Priority** | Must |

**Preconditions:**
- User đã đăng nhập
- User có `UserShopRole` ở ít nhất 2 shop khác nhau
- Shop đích đang active

**Main Flow:**
1. User click menu "Chọn shop" (hiển thị tên shop đang active ở header)
2. Hệ thống hiển thị danh sách các shop mà user có quyền truy cập (active only)
3. User chọn shop mới
4. Hệ thống validate: shop active + user có `UserShopRole` trong shop đó
5. Hệ thống phát JWT mới với `active_shop_id = shop_moi_id`, set lại HttpOnly cookie
6. Hệ thống reload dashboard của shop mới
7. Header cập nhật tên shop; tất cả dữ liệu hiển thị thuộc về shop mới

**Exception Flows:**

*EF-01: Shop bị vô hiệu hóa sau khi list được tải*
- Bước 4: Shop inactive → "Shop đang tạm ngưng, không thể chuyển sang shop này"

*EF-02: User mất quyền sau khi list được tải*
- Bước 4: Không có `UserShopRole` → 403 "Bạn không có quyền truy cập shop này"

**Postconditions:**
- JWT mới với `active_shop_id` mới được set trong cookie
- Tất cả API call tiếp theo filter theo shop mới (TenantGuard đọc từ JWT)
- Không cần logout / login lại

---

## UC-21: QR Code Generation & Scan

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC-21 |
| **Tên** | Tạo mã QR cho item và xử lý quét QR |
| **Actor chính** | Shop Admin (tạo) / End Customer (quét) |
| **Priority** | Could |

**Preconditions (Tạo):**
- Item tồn tại và thuộc về shop của admin (TenantGuard)
- Admin đã đăng nhập

**Main Flow (Admin tạo QR):**
1. Admin vào trang chi tiết item → tab/bước "Mã QR"
2. Admin click "Tạo mã QR"
3. Hệ thống kiểm tra `qr_token` trên item: nếu đã có → dùng lại; nếu chưa → tạo mới (16-ký tự hex, race-safe via `updateMany WHERE qr_token IS NULL`)
4. Hệ thống hiển thị: ảnh QR, link resolve, nút "Tải PNG", nút "Copy link"
5. Admin in QR hoặc dán vào bao bì / catalogue vật lý

**Main Flow (Customer quét QR):**
1. Khách quét QR bằng camera điện thoại
2. Request đến `GET /api/v1/public/qr/:token` (không yêu cầu auth)
3. Hệ thống resolve token → tìm item → redirect 302 đến `FRONTEND_URL/items/:id?shop_id=...&source=qr&action=view`
4. Frontend hiển thị trang chi tiết item với banner "Bạn đang xem sản phẩm qua mã QR"

**Alternative Flows:**

*AF-01: Item chưa public, admin tạo QR*
- Bước 4: Banner cảnh báo "Item này chưa được publish — QR sẽ không hoạt động với khách cho đến khi bật is_public"
- Admin vẫn có thể tạo và lưu QR trước khi publish (chuẩn bị trước)

**Exception Flows:**

*EF-01: QR token không tồn tại*
- Bước 3: Token không khớp bất kỳ item nào → 404 "Mã QR không hợp lệ hoặc sản phẩm không còn tồn tại"

**Postconditions:**
- `qr_token` bất biến sau khi tạo — không thay đổi dù item cập nhật
- QR in vật lý hoạt động khi: item chưa soft-delete, `is_public = true`, và shop đang active. Unpublish item (`is_public = false`) hoặc deactivate shop sẽ khiến QR trả 404 — admin cần cân nhắc trước khi in QR vật lý

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
3. Admin nhập: name, brand, car_brand, model_brand, scale (default 1:64), condition, price, status, quantity, fb_post_content
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

**Exception Flows:**

*EF-01: Vi phạm invariant da_ban*
- Bước 5: status=da_ban nhưng quantity > 0 → "Hàng đã bán phải có số lượng = 0"

*EF-02: Thiếu field bắt buộc*
- Bước 5: name hoặc price trống → highlight field lỗi với message cụ thể

*EF-03: Thay đổi quantity trực tiếp*
- Bước 5: Phát hiện request thay đổi quantity không qua inventory → 422 "Vui lòng dùng chức năng nhập/xuất kho"

**Postconditions:**
- Item được tạo/cập nhật với đúng thông tin
- Nếu `is_public = true`: item xuất hiện trên public catalog
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
- Item `is_public=true`, status là `con_hang` hoặc `giu_cho`
- Shop active

**Main Flow:**
1. Khách click "Đặt hàng trước" trên trang chi tiết item
2. Hệ thống hiển thị form pre-order
3. Khách nhập: họ tên, số điện thoại, ghi chú (optional)
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
5. Admin xem chi tiết: thông tin khách, item, trạng thái hiện tại, lịch sử
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
- Transaction ghi bất biến vào ledger
- `items.quantity` được cập nhật đúng
- Không thể undo transaction (chỉ có thể tạo transaction đối ứng)

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

**Main Flow (Manual Adjust):**
1. Admin vào profile member → "Điều chỉnh điểm"
2. Admin chọn: cộng/trừ điểm
3. Admin nhập số điểm và lý do (bắt buộc)
4. Admin click "Xác nhận"
5. Hệ thống tạo ledger entry (type: manual)
6. Cập nhật points_balance

**Exception Flows:**

*EF-01: Trừ điểm vượt số dư*
- Bước 3 (Manual): điểm trừ > points_balance → "Số dư điểm không đủ (hiện có: X, yêu cầu trừ: Y)"

**Postconditions:**
- `MemberPointsLedger` có bản ghi mới (immutable)
- `members.points_balance` cập nhật đúng
- Tier được upgrade nếu đủ điều kiện (không bao giờ downgrade tự động)

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

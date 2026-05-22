---
title: UAT Plan & Checklist - Diecast360
version: 1.0.0
created: 2026-05-22
author: QA Lead - Group 6
status: Draft
---

# UAT Plan & Checklist — Diecast360

## Mục lục

1. [Mục tiêu UAT](#1-mục-tiêu-uat)
2. [Participants](#2-participants)
3. [Môi trường UAT](#3-môi-trường-uat)
4. [Lịch UAT](#4-lịch-uat)
5. [Phạm vi UAT](#5-phạm-vi-uat)
6. [Entry/Exit Criteria](#6-entryexit-criteria)
7. [UAT Test Scenarios](#7-uat-test-scenarios)
8. [Issue Reporting trong UAT](#8-issue-reporting-trong-uat)
9. [Sign-off Criteria & Form](#9-sign-off-criteria--form)

---

## 1. Mục tiêu UAT

User Acceptance Testing (UAT) là giai đoạn kiểm thử cuối cùng nhằm xác nhận rằng hệ thống Diecast360 đáp ứng đầy đủ yêu cầu nghiệp vụ từ góc nhìn của người dùng thực tế — không phải góc nhìn kỹ thuật.

### Mục tiêu cụ thể

- **Xác nhận business requirements:** Tất cả user stories trong Phase 3 được thỏa mãn theo acceptance criteria đã định nghĩa
- **Validate trải nghiệm người dùng:** Các luồng thao tác thực tế của shop owner, shop staff và khách hàng diễn ra mượt mà, dễ hiểu
- **Phát hiện gap cuối cùng:** Các vấn đề mà automated tests chưa phát hiện vì liên quan đến business context hoặc UX expectations
- **Chuẩn bị go-live:** Đảm bảo stakeholders tự tin ký nhận sản phẩm trước khi deploy production

### UAT KHÔNG bao gồm

- Kiểm tra kỹ thuật chi tiết (đã làm ở Integration/E2E tests)
- Kiểm tra performance số liệu chính xác (đã làm ở load tests)
- Kiểm tra edge cases kỹ thuật (đã có trong TC-XXX test cases)

---

## 2. Participants

### 2.1 Danh sách người tham gia

| Vai trò | Người đại diện | Trách nhiệm trong UAT |
|---------|---------------|----------------------|
| **Shop Owner** | Anh Minh (chủ shop mô hình Hoài Cổ) | Kiểm thử toàn bộ luồng admin: quản lý item, pre-order, thành viên, báo cáo |
| **Shop Staff** | Bạn Linh (nhân viên cửa hàng) | Kiểm thử các tác vụ hàng ngày: xem inventory, tạo pre-order, tra cứu thông tin |
| **Khách hàng** | Chị Mai (collector mô hình) | Kiểm thử public catalog, xem 360°, đặt pre-order, tra cứu điểm thưởng |
| **BA/Product Owner** | [PO Name] | Điều phối UAT, verify acceptance criteria, nhận sign-off cuối cùng |
| **QA Lead** | [QA Lead Name] | Hướng dẫn participants, ghi nhận kết quả, quản lý issues |
| **Developer on-call** | [Dev Name] | Xử lý blocking issues phát sinh trong quá trình UAT |

### 2.2 Chuẩn bị cho UAT Participants

Trước khi bắt đầu UAT, QA Lead cần:
- [ ] Cung cấp tài khoản staging và hướng dẫn đăng nhập
- [ ] Gửi UAT Guide ngắn (2-3 trang) cho Anh Minh và Bạn Linh
- [ ] Chuẩn bị dữ liệu seed: items mẫu, members mẫu, pre-orders ở các trạng thái
- [ ] Cài sẵn Chrome/Edge trên máy tính của UAT participants
- [ ] Tạo kênh liên lạc riêng (nhóm chat) để báo issue nhanh
- [ ] Schedule buổi kick-off UAT (30 phút) để giải thích quy trình

---

## 3. Môi trường UAT

| Attribute | Thông tin |
|-----------|---------|
| **URL** | `https://staging.diecast360.vn` |
| **Loại môi trường** | Staging (giống production, dữ liệu test) |
| **Database** | PostgreSQL 16 — staging instance, đã seed dữ liệu mẫu |
| **Storage** | Cloudflare R2 — staging bucket |
| **Email** | Mailhog mock (không gửi email thật) |
| **Trình duyệt hỗ trợ** | Chrome 120+, Edge 120+, Firefox 125+ |
| **Thiết bị** | Desktop/Laptop (1280px trở lên) |
| **Thời gian uptime** | 09:00–18:00 ICT trong tuần UAT |
| **Reset data** | Hàng ngày lúc 08:00 ICT (data fresh mỗi sáng) |

### Tài khoản UAT

| Người dùng | Email | Password | Role |
|------------|-------|---------|------|
| Anh Minh (Shop Owner) | `minh@hoaico-shop.staging` | `UAT@2026!` | shop_admin |
| Bạn Linh (Shop Staff) | `linh@hoaico-shop.staging` | `UAT@2026!` | shop_staff |
| Chị Mai (Khách hàng) | Không cần login | - | anonymous |
| QA Lead (Observer) | `qa-lead@diecast360.staging` | `QA@2026!` | shop_admin |

---

## 4. Lịch UAT

### UAT Schedule — 2 tuần cuối Phase 3 (T5/2026)

| Tuần | Ngày | Hoạt động | Participants |
|------|------|-----------|-------------|
| **Tuần 1** | Thứ Hai 18/5 | Kick-off UAT: giới thiệu môi trường, quy trình | Tất cả |
| Tuần 1 | Thứ Ba–Tư 19-20/5 | Scenario 1-4: Anh Minh test admin flows | Anh Minh + QA Lead |
| Tuần 1 | Thứ Năm–Sáu 21-22/5 | Scenario 5-8: Linh + Chị Mai test | Linh, Chị Mai + QA Lead |
| Tuần 1 | Thứ Sáu 22/5 | Daily review: tổng hợp issues tuần 1 | QA Lead + PO + Dev |
| **Tuần 2** | Thứ Hai 25/5 | Fix issues P1/P2 từ tuần 1, re-test | Dev + QA Lead |
| Tuần 2 | Thứ Ba–Tư 26-27/5 | Re-test các scenario có issues, regression | Anh Minh, Linh + QA Lead |
| Tuần 2 | Thứ Năm 28/5 | Final UAT: full run tất cả scenarios | Tất cả UAT participants |
| Tuần 2 | Thứ Sáu 29/5 | UAT Review Meeting + Sign-off | Tất cả + Stakeholders |

### Thời gian mỗi session UAT

- **Anh Minh:** 2 giờ/ngày (9:00–11:00 ICT)
- **Bạn Linh:** 1.5 giờ/ngày (14:00–15:30 ICT)
- **Chị Mai:** 1 giờ/ngày (10:00–11:00 ICT)

---

## 5. Phạm vi UAT

### Trong phạm vi UAT

| Module | User Story | Người test |
|--------|-----------|-----------|
| Item Management | Tạo/sửa/xóa item, quản lý ảnh, spinner 360° | Anh Minh |
| Pre-Order Lifecycle | Tạo → Thanh toán → Điểm thưởng | Anh Minh, Linh |
| Inventory | Cập nhật stock, xem lịch sử | Linh |
| Members | Tạo/sửa member, xem điểm | Anh Minh, Linh |
| Public Catalog | Browse, search, xem 360°, đặt pre-order | Chị Mai |
| AI Draft | Upload ảnh → nhận draft → chỉnh sửa → confirm | Anh Minh |
| Facebook Integration | Copy caption, publish | Anh Minh |
| Báo cáo tháng | Xem doanh thu, pre-orders | Anh Minh |

### Ngoài phạm vi UAT

- Platform Admin (chỉ dành cho internal team)
- API testing trực tiếp (đã cover bởi integration tests)
- Kiểm tra hiệu năng chi tiết
- Tính năng chưa hoàn thiện trong Phase 3

---

## 6. Entry/Exit Criteria

### 6.1 Entry Criteria — Bắt đầu được UAT khi:

- [ ] Tất cả P1 bugs từ QA testing đã được fix và verified
- [ ] E2E Playwright suite pass ≥ 98%
- [ ] Môi trường staging ổn định, uptime ≥ 99% trong 3 ngày trước UAT
- [ ] Dữ liệu seed đã được nạp và verified
- [ ] UAT participants đã được training brief (30 phút)
- [ ] Tài khoản UAT đã được tạo và test login thành công
- [ ] QA Lead có mặt hoặc on-call trong suốt thời gian UAT
- [ ] Dev on-call được assign cho tuần UAT

### 6.2 Exit Criteria — Kết thúc UAT và sẵn sàng release khi:

- [ ] Tất cả 8 UAT Scenarios đã được thực thi
- [ ] 100% Scenario P1 (Critical Path) PASS
- [ ] ≥ 90% tổng số checklist items PASS
- [ ] Không còn UAT issue Severity "Show-stopper" nào Open
- [ ] UAT issues Severity "Major" được accept hoặc có kế hoạch fix rõ ràng
- [ ] Sign-off form được ký bởi: Anh Minh (Shop Owner) + PO
- [ ] Release notes đã được chuẩn bị

---

## 7. UAT Test Scenarios

---

### Scenario 1: Shop Owner tạo item mới với ảnh và spinner 360°

**Người test:** Anh Minh  
**Ước tính thời gian:** 30 phút  
**Business goal:** Anh Minh muốn đăng sản phẩm mới lên hệ thống để quản lý và bán

#### Mô tả

Anh Minh nhận được lô hàng mới: 10 chiếc Hot Wheels Ferrari 599XX. Anh muốn tạo sản phẩm trong hệ thống với đầy đủ thông tin, upload 5 ảnh, và quay 24 khung hình 360° để khách hàng xem trực quan.

#### Checklist

**Bước 1: Đăng nhập**
- [ ] Mở trình duyệt Chrome, truy cập `https://staging.diecast360.vn`
- [ ] Đăng nhập với tài khoản shop_admin
- [ ] Dashboard hiển thị đúng tên shop "Hoài Cổ Shop"
- [ ] Menu điều hướng rõ ràng, đủ các mục cần thiết

**Bước 2: Tạo item mới**
- [ ] Nhấn nút "Thêm sản phẩm mới"
- [ ] Form tạo sản phẩm hiển thị đầy đủ các trường: Tên, Thương hiệu, Tỉ lệ, Giá, Số lượng, Trạng thái, Mô tả
- [ ] Điền thông tin: Tên "Hot Wheels Ferrari 599XX", Thương hiệu "Hot Wheels", Tỉ lệ "1:64", Giá 85,000 VND, Số lượng 10
- [ ] Chọn trạng thái "Còn hàng" (con_hang)
- [ ] Nhấn "Lưu" → hệ thống xác nhận thành công, item xuất hiện trong danh sách

**Bước 3: Upload ảnh**
- [ ] Vào trang chi tiết item → tab "Hình ảnh"
- [ ] Upload ảnh đầu tiên (JPEG, 3MB) → ảnh xuất hiện, tự động được đặt làm ảnh bìa
- [ ] Upload 4 ảnh tiếp theo → tất cả hiển thị trong gallery
- [ ] Kéo thả để đổi thứ tự ảnh → thứ tự thay đổi theo ý muốn
- [ ] Nhấn vào ảnh thứ 3 → chọn "Đặt làm ảnh bìa" → ảnh 3 trở thành bìa, ảnh 1 không còn là bìa
- [ ] Xóa ảnh 2 → ảnh 2 biến mất, các ảnh còn lại vẫn hiển thị đúng

**Bước 4: Upload Spinner 360°**
- [ ] Vào tab "360°"
- [ ] Nhấn "Tạo bộ xoay mới"
- [ ] Upload 24 frames lần lượt (file ảnh JPEG)
- [ ] Hệ thống hiển thị tiến trình upload
- [ ] Sau khi upload đủ 24 frames, xem preview spinner — có thể kéo để xoay
- [ ] Thử kéo thả đổi thứ tự frame → thứ tự thay đổi, spinner preview cập nhật
- [ ] Đặt bộ xoay này làm "Mặc định"

**Bước 5: Đặt item công khai**
- [ ] Toggle "Hiển thị công khai" → bật
- [ ] Mở tab ẩn danh → truy cập public catalog → item xuất hiện với ảnh và spinner

#### Kết quả UAT

| Bước | Pass | Fail | Ghi chú |
|------|------|------|---------|
| 1. Đăng nhập | ☐ | ☐ | |
| 2. Tạo item | ☐ | ☐ | |
| 3. Upload ảnh | ☐ | ☐ | |
| 4. Spinner 360° | ☐ | ☐ | |
| 5. Đặt công khai | ☐ | ☐ | |

**Tổng:** ___/5 Pass  
**Kết luận:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

---

### Scenario 2: Shop Owner đăng sản phẩm lên Facebook

**Người test:** Anh Minh  
**Ước tính thời gian:** 15 phút  
**Business goal:** Anh Minh muốn quảng bá sản phẩm Ferrari mới lên Facebook fanpage của shop

#### Mô tả

Sau khi tạo item Ferrari xong, Anh Minh muốn chia sẻ lên Facebook để thông báo cho khách hàng.

#### Checklist

- [ ] Vào trang chi tiết item Ferrari
- [ ] Nhấn nút "Đăng Facebook" hoặc tìm tính năng chia sẻ
- [ ] Hệ thống hiển thị caption được tự động tạo (tên sản phẩm, giá, mô tả ngắn)
- [ ] Anh Minh có thể chỉnh sửa caption trước khi đăng
- [ ] Nhấn "Sao chép caption" → nội dung được copy vào clipboard
- [ ] Nhấn "Đăng lên Facebook" → hệ thống gửi request tới Graph API
- [ ] Thông báo thành công hiển thị với link bài đăng Facebook
- [ ] Link bài đăng được lưu trong hệ thống, hiển thị trong trang item

#### Kết quả UAT

| Checklist item | Pass | Fail | Ghi chú |
|---------------|------|------|---------|
| Caption tự động tạo | ☐ | ☐ | |
| Chỉnh sửa caption | ☐ | ☐ | |
| Sao chép clipboard | ☐ | ☐ | |
| Đăng lên Facebook API | ☐ | ☐ | |
| Lưu link bài đăng | ☐ | ☐ | |

**Kết luận:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

---

### Scenario 3: Shop Owner tạo pre-order cho khách hàng

**Người test:** Anh Minh  
**Ước tính thời gian:** 20 phút  
**Business goal:** Khách hàng Chị Mai gọi điện đặt trước 2 chiếc Ferrari, Anh Minh muốn tạo pre-order trong hệ thống

#### Mô tả

Chị Mai là thành viên của shop (đã có trong database). Chị gọi điện đặt trước 2 chiếc Ferrari 599XX với cọc 200,000 VND.

#### Checklist

**Tìm thành viên:**
- [ ] Vào menu "Pre-Orders" → "Tạo mới"
- [ ] Tìm kiếm thành viên theo tên "Mai" hoặc số điện thoại
- [ ] Hệ thống gợi ý đúng thành viên Chị Mai
- [ ] Chọn Chị Mai → thông tin hiển thị: tên, phone, điểm thưởng hiện có

**Tạo pre-order:**
- [ ] Tìm kiếm sản phẩm "Ferrari 599XX"
- [ ] Chọn số lượng: 2
- [ ] Nhập tiền cọc: 200,000 VND
- [ ] Thêm ghi chú: "Khách chọn màu đỏ nếu có"
- [ ] Xác nhận tạo pre-order

**Xác nhận kết quả:**
- [ ] Pre-order xuất hiện trong danh sách với status "Chờ xác nhận" (PENDING_CONFIRMATION)
- [ ] Thông tin đầy đủ: thành viên, sản phẩm, số lượng, cọc, ghi chú
- [ ] Pre-order ID được tạo và hiển thị

#### Kết quả UAT

| Bước | Pass | Fail | Ghi chú |
|------|------|------|---------|
| Tìm thành viên | ☐ | ☐ | |
| Chọn sản phẩm | ☐ | ☐ | |
| Tạo pre-order | ☐ | ☐ | |
| Xác nhận thông tin | ☐ | ☐ | |

**Kết luận:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

---

### Scenario 4: Shop Owner xử lý pre-order lifecycle đến PAID và kiểm tra điểm thưởng

**Người test:** Anh Minh  
**Ước tính thời gian:** 25 phút  
**Business goal:** Anh Minh muốn theo dõi hàng đặt trước qua từng bước và xác nhận điểm thưởng được cộng đúng khi thanh toán

#### Mô tả

Pre-order Ferrari của Chị Mai đã được tạo (Scenario 3). Nay hàng đã về, Chị Mai đến thanh toán. Anh Minh cần cập nhật trạng thái qua từng bước.

#### Checklist

**Cập nhật trạng thái từng bước:**
- [ ] Mở pre-order của Chị Mai
- [ ] Nhấn "Xác nhận đơn" → status chuyển sang "Đang chờ hàng" (WAITING_FOR_GOODS)
- [ ] Sau vài ngày, nhấn "Hàng đã về" → status chuyển sang "Đã có hàng" (ARRIVED)
- [ ] Hệ thống không cho phép nhảy thẳng từ "Chờ xác nhận" sang "Đã thanh toán" (test thử)
- [ ] Chị Mai đến thanh toán → nhấn "Đã thanh toán" → status = PAID

**Kiểm tra điểm thưởng:**
- [ ] Sau khi PAID, thông báo xuất hiện: "Cộng X điểm thưởng cho Chị Mai"
- [ ] Vào hồ sơ thành viên Chị Mai → điểm thưởng tăng đúng với quy tắc tích điểm
- [ ] Xem lịch sử điểm → có ghi nhận mới với note "Pre-order #PRE-xxx thanh toán"

**Thử hủy đơn:**
- [ ] Vào pre-order khác đang ở "Chờ xác nhận"
- [ ] Nhấn "Hủy đơn" → status = CANCELLED
- [ ] Thử cập nhật tiếp pre-order đã hủy → hệ thống từ chối với thông báo rõ ràng

#### Kết quả UAT

| Bước | Pass | Fail | Ghi chú |
|------|------|------|---------|
| Chuyển trạng thái từng bước | ☐ | ☐ | |
| Chặn transition không hợp lệ | ☐ | ☐ | |
| Cộng điểm khi PAID | ☐ | ☐ | |
| Lịch sử điểm chính xác | ☐ | ☐ | |
| Hủy đơn hoạt động | ☐ | ☐ | |
| Đơn đã hủy không thể thay đổi | ☐ | ☐ | |

**Kết luận:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

---

### Scenario 5: Khách hàng xem catalog, xoay spinner 360°, đặt pre-order

**Người test:** Chị Mai  
**Ước tính thời gian:** 20 phút  
**Business goal:** Chị Mai muốn xem sản phẩm của shop, xem chi tiết 360° và đặt hàng online

#### Mô tả

Chị Mai là collector xe mô hình. Chị vào trang public của Shop Hoài Cổ để xem hàng mới.

#### Checklist

**Xem catalog:**
- [ ] Truy cập URL public của shop (không cần đăng nhập)
- [ ] Trang catalog hiển thị danh sách sản phẩm với ảnh bìa, tên, giá
- [ ] Tìm kiếm "Ferrari" → chỉ hiển thị sản phẩm Ferrari
- [ ] Lọc theo "Còn hàng" → chỉ hiện sản phẩm available
- [ ] Phân trang hoạt động (nếu có nhiều sản phẩm)

**Xem chi tiết sản phẩm:**
- [ ] Nhấn vào Ferrari 599XX → vào trang chi tiết
- [ ] Ảnh gallery hiển thị đầy đủ, có thể click xem ảnh lớn
- [ ] Spinner 360°: nhấn play hoặc kéo để xoay — animation mượt mà
- [ ] Thông tin sản phẩm đầy đủ: tên, thương hiệu, tỉ lệ, trạng thái, mô tả
- [ ] Giá hiển thị định dạng tiền tệ VND đúng

**Đặt pre-order:**
- [ ] Nhấn "Đặt trước" hoặc liên hệ shop (theo flow hiện tại)
- [ ] Form đặt hàng hoặc thông tin liên hệ hiển thị rõ ràng
- [ ] Chị Mai hoàn tất đặt hàng

#### Kết quả UAT

| Bước | Pass | Fail | Ghi chú |
|------|------|------|---------|
| Xem catalog không cần login | ☐ | ☐ | |
| Tìm kiếm, lọc hoạt động | ☐ | ☐ | |
| Xem chi tiết sản phẩm | ☐ | ☐ | |
| Spinner 360° mượt mà | ☐ | ☐ | |
| Đặt pre-order thành công | ☐ | ☐ | |

**Kết luận:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

---

### Scenario 6: Shop Owner xem báo cáo tháng

**Người test:** Anh Minh  
**Ước tính thời gian:** 15 phút  
**Business goal:** Cuối tháng, Anh Minh muốn xem tổng quan kinh doanh

#### Checklist

- [ ] Vào menu "Báo cáo" hoặc "Dashboard"
- [ ] Chọn tháng 5/2026
- [ ] Xem tổng số pre-orders trong tháng (mới, đã thanh toán, đã hủy)
- [ ] Xem tổng doanh thu từ pre-orders đã PAID
- [ ] Xem số lượng thành viên mới trong tháng
- [ ] Xem sản phẩm được đặt trước nhiều nhất
- [ ] Xuất báo cáo (nếu tính năng có)
- [ ] Số liệu trên dashboard khớp với dữ liệu đã nhập trong các scenario trước

#### Kết quả UAT

| Checklist item | Pass | Fail | Ghi chú |
|---------------|------|------|---------|
| Dashboard tháng hiển thị | ☐ | ☐ | |
| Số pre-orders chính xác | ☐ | ☐ | |
| Doanh thu chính xác | ☐ | ☐ | |
| Thống kê thành viên | ☐ | ☐ | |
| Sản phẩm hot | ☐ | ☐ | |

**Kết luận:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

---

### Scenario 7: Shop Staff xem inventory và cập nhật stock

**Người test:** Bạn Linh  
**Ước tính thời gian:** 15 phút  
**Business goal:** Linh muốn kiểm tra tồn kho và cập nhật khi nhận hàng mới

#### Mô tả

Bạn Linh là nhân viên cửa hàng. Buổi sáng, Linh cần kiểm tra tồn kho và cập nhật khi có hàng mới nhập về.

#### Checklist

**Xem tồn kho:**
- [ ] Đăng nhập với tài khoản shop_staff
- [ ] Vào menu "Kho hàng" hoặc "Tồn kho"
- [ ] Danh sách sản phẩm hiển thị với số lượng tồn kho hiện tại
- [ ] Có thể lọc theo sản phẩm sắp hết hàng (số lượng < 5)

**Cập nhật stock:**
- [ ] Chọn sản phẩm Ferrari
- [ ] Thêm giao dịch: "Nhập hàng" (stock_in) 5 chiếc
- [ ] Số lượng tồn kho cập nhật ngay lập tức
- [ ] Lịch sử giao dịch hiển thị giao dịch vừa thêm với thời gian, số lượng

**Kiểm tra quyền shop_staff:**
- [ ] Thử xóa một sản phẩm → hệ thống từ chối với thông báo "Bạn không có quyền thực hiện thao tác này"
- [ ] Thử tạo pre-order mới (nếu trong scope) → có thể xem nhưng không được tạo
- [ ] Xem thông tin thành viên → được phép xem nhưng không sửa

#### Kết quả UAT

| Bước | Pass | Fail | Ghi chú |
|------|------|------|---------|
| Xem tồn kho | ☐ | ☐ | |
| Nhập hàng thành công | ☐ | ☐ | |
| Lịch sử giao dịch | ☐ | ☐ | |
| Quyền bị giới hạn đúng | ☐ | ☐ | |

**Kết luận:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

---

### Scenario 8: AI tạo draft item từ ảnh sản phẩm

**Người test:** Anh Minh  
**Ước tính thời gian:** 20 phút  
**Business goal:** Anh Minh muốn tiết kiệm thời gian nhập liệu bằng cách để AI phân tích ảnh và tự động điền thông tin sản phẩm

#### Mô tả

Anh Minh có 3 tấm ảnh chụp chiếc Matchbox Porsche 911 mới nhận về. Anh upload lên để AI phân tích và tạo draft sản phẩm.

#### Checklist

**Upload ảnh cho AI:**
- [ ] Vào tính năng "AI Draft" hoặc "Tạo từ ảnh"
- [ ] Upload 3 ảnh sản phẩm (JPEG, góc chụp khác nhau)
- [ ] Hệ thống hiển thị tiến trình phân tích (progress indicator)
- [ ] Trong vòng 15 giây, hiển thị draft kết quả

**Xem và chỉnh sửa draft:**
- [ ] Draft hiển thị thông tin AI đề xuất: Tên "Matchbox Porsche 911", Thương hiệu "Matchbox", Tỉ lệ "1:64" (nếu AI nhận ra)
- [ ] Anh Minh có thể chỉnh sửa bất kỳ trường nào trước khi xác nhận
- [ ] Sửa giá: 75,000 VND
- [ ] Sửa số lượng: 3

**Xác nhận hoặc từ chối:**
- [ ] Nhấn "Xác nhận" → item được tạo với trạng thái "Chờ xác nhận" (PENDING)
- [ ] Item xuất hiện trong danh sách với thông tin đã chỉnh sửa
- [ ] Thử tạo draft khác rồi nhấn "Từ chối" → draft bị hủy, không tạo item

#### Kết quả UAT

| Bước | Pass | Fail | Ghi chú |
|------|------|------|---------|
| Upload ảnh AI | ☐ | ☐ | |
| AI phân tích trong thời gian hợp lý | ☐ | ☐ | |
| Draft hiển thị thông tin | ☐ | ☐ | |
| Chỉnh sửa draft | ☐ | ☐ | |
| Confirm tạo item | ☐ | ☐ | |
| Reject draft | ☐ | ☐ | |

**Kết luận:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

---

### Tổng kết 8 Scenarios

| Scenario | Mô tả | Người test | Kết quả |
|----------|-------|-----------|---------|
| S1 | Tạo item + ảnh + spinner | Anh Minh | ☐ PASS ☐ FAIL |
| S2 | Đăng Facebook | Anh Minh | ☐ PASS ☐ FAIL |
| S3 | Tạo pre-order | Anh Minh | ☐ PASS ☐ FAIL |
| S4 | Pre-order lifecycle → PAID → điểm | Anh Minh | ☐ PASS ☐ FAIL |
| S5 | Public catalog + 360° + đặt hàng | Chị Mai | ☐ PASS ☐ FAIL |
| S6 | Báo cáo tháng | Anh Minh | ☐ PASS ☐ FAIL |
| S7 | Inventory + RBAC staff | Bạn Linh | ☐ PASS ☐ FAIL |
| S8 | AI Draft | Anh Minh | ☐ PASS ☐ FAIL |

---

## 8. Issue Reporting trong UAT

### Template Issue (đơn giản hơn Bug Report kỹ thuật)

Khi phát hiện vấn đề trong UAT, participants điền form ngắn sau vào nhóm chat hoặc Google Form:

```
🔴/🟡/🟢 [Màu = mức độ: đỏ=chặn làm, vàng=bất tiện, xanh=nhỏ]

**Scenario:** S1 / S2 / ...
**Bước bị lỗi:** (mô tả ngắn gọn)
**Điều tôi làm:** (bước cụ thể)
**Điều tôi mong đợi:** 
**Điều thực tế xảy ra:**
**Screenshot:** (kèm ảnh nếu có)
```

### Mức độ Issue trong UAT

| Ký hiệu | Mức độ | Ý nghĩa | Xử lý |
|---------|--------|---------|-------|
| 🔴 | Show-stopper | Không thể tiếp tục scenario | QA Lead escalate ngay; Developer fix trong ngày |
| 🟡 | Major | Khó chịu, mất thời gian nhưng vẫn làm được | Đưa vào danh sách fix trước release |
| 🟢 | Minor | Nhỏ, không ảnh hưởng flow | Note lại, fix sau release hoặc sprint tiếp |

### Ví dụ issue UAT

```
🔴 Show-stopper

**Scenario:** S1 - Upload ảnh
**Bước bị lỗi:** Upload ảnh thứ 3
**Điều tôi làm:** Chọn file JPEG 4MB, nhấn Upload
**Điều tôi mong đợi:** Ảnh được upload và hiển thị
**Điều thực tế xảy ra:** Màn hình trắng, phải reload lại → mất hết 2 ảnh đã upload
**Screenshot:** [đính kèm]
```

---

## 9. Sign-off Criteria & Form

### 9.1 Sign-off Criteria

Sản phẩm đủ điều kiện được sign-off khi:

| Criterion | Target | Achieved |
|-----------|--------|---------|
| Scenarios P1 (S1, S3, S4, S5) Pass | 100% | ☐ |
| Tổng scenarios pass | ≥ 7/8 | ☐ |
| Không có 🔴 Show-stopper Issues Open | 0 | ☐ |
| 🟡 Major Issues: có kế hoạch fix | Documented | ☐ |
| Shop Owner xác nhận luồng chính OK | Verbally confirmed | ☐ |

### 9.2 UAT Sign-off Form

---

**UAT SIGN-OFF DOCUMENT**  
**Dự án:** Diecast360 — Phase 3  
**Version:** v1.0  
**Ngày UAT:** ___/___/2026  
**Môi trường:** Staging — `https://staging.diecast360.vn`

---

**Kết quả tổng hợp:**

| Scenario | Kết quả | Ghi chú |
|----------|---------|---------|
| S1: Tạo item + ảnh + spinner | ☐ PASS ☐ FAIL | |
| S2: Đăng Facebook | ☐ PASS ☐ FAIL | |
| S3: Tạo pre-order | ☐ PASS ☐ FAIL | |
| S4: Pre-order lifecycle | ☐ PASS ☐ FAIL | |
| S5: Public catalog + 360° | ☐ PASS ☐ FAIL | |
| S6: Báo cáo tháng | ☐ PASS ☐ FAIL | |
| S7: Inventory + RBAC | ☐ PASS ☐ FAIL | |
| S8: AI Draft | ☐ PASS ☐ FAIL | |

**Tổng:** ___/8 PASS

---

**Known Issues chấp nhận release:**

| Issue | Mức độ | Kế hoạch fix |
|-------|--------|-------------|
| | | |
| | | |

---

**Quyết định:**

☐ **APPROVED** — Hệ thống đáp ứng yêu cầu nghiệp vụ. Đồng ý deploy production.

☐ **APPROVED WITH CONDITIONS** — Đồng ý release nhưng phải fix các issues sau trong vòng ___ ngày sau go-live:
_____________________________________

☐ **REJECTED** — Cần sửa các vấn đề sau trước khi xem xét lại:
_____________________________________

---

**Chữ ký xác nhận:**

| Vai trò | Tên | Chữ ký | Ngày |
|---------|-----|--------|------|
| Shop Owner (đại diện user) | Nguyễn Văn Minh | _________________ | ___/___/2026 |
| Product Owner | [PO Name] | _________________ | ___/___/2026 |
| QA Lead | [QA Lead Name] | _________________ | ___/___/2026 |
| Tech Lead | [Tech Lead Name] | _________________ | ___/___/2026 |

---

**Ghi chú bổ sung từ stakeholders:**

_____________________________________  
_____________________________________  
_____________________________________

---

_UAT Plan này được chuẩn bị bởi QA Lead — Group 6. Cập nhật lần cuối: 2026-05-22._

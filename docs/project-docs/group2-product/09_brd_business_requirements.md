---
title: Business Requirements Document (BRD)
version: 1.0
created: 2026-05-22
author: BA/PO Team
project: Diecast360
---

# Business Requirements Document — Diecast360

## 1. Executive Summary

Diecast360 là nền tảng SaaS multi-tenant chuyên biệt cho thị trường sưu tầm mô hình xe diecast tỉ lệ 1:64 tại Việt Nam. Hệ thống giải quyết bài toán cốt lõi: các shop diecast nhỏ lẻ đang vận hành thủ công bằng Excel, Messenger, Facebook Photo Album — dẫn đến sai sót tồn kho, mất đơn hàng, trải nghiệm khách hàng kém.

Diecast360 cung cấp: catalog số hóa với viewer 360°, quy trình pre-order minh bạch, loyalty program, social selling tools, và AI-assisted content creation — tất cả trong 1 nền tảng multi-tenant cho phép mỗi shop hoạt động độc lập.

**Phạm vi tài liệu:** Phiên bản 1.0 (MVP đến full feature). Thời gian: 10/2025 – 06/2026.

---

## 2. Business Context & Problem Statement

### 2.1 Bối cảnh thị trường

- Cộng đồng sưu tầm diecast 1:64 tại Việt Nam đang phát triển mạnh (ước tính 50,000+ người đam mê)
- Phần lớn giao dịch diễn ra qua Facebook Group/Page và Zalo
- Các shop diecast (5–50 SKU/tháng) chưa có công cụ chuyên biệt

### 2.2 Problem Statement

**Vấn đề hiện tại của Shop Owner:**

| Vấn đề | Hậu quả |
|--------|---------|
| Quản lý tồn kho bằng Excel thủ công | Sai số tồn kho 15–20%, bán trùng hàng |
| Đăng bài Facebook thủ công (upload ảnh riêng lẻ) | Mất 30–60 phút/sản phẩm |
| Theo dõi pre-order qua comment/inbox | Mất đơn, nhầm khách, không có lịch sử |
| Không có ảnh 360° chuyên nghiệp | Khách không tin tưởng, tỉ lệ hỏi hàng cao |
| Không có loyalty program | Khách không có lý do quay lại |

**Vấn đề của End Customer:**
- Không biết hàng còn/hết realtime
- Phải inbox hỏi giá, hỏi tình trạng → friction cao
- Không tin tưởng khi chưa xem được nhiều góc độ

### 2.3 Opportunity Statement

Một nền tảng SaaS chuyên biệt với chi phí thấp (subscription), không cần setup phức tạp, có thể onboard trong 1 ngày, sẽ được các shop diecast đón nhận nếu:
1. Giúp tiết kiệm ít nhất 5 giờ/tuần cho shop owner
2. Tăng conversion từ view → pre-order ít nhất 20%
3. Giảm tỉ lệ sai sót tồn kho xuống dưới 2%

---

## 3. Business Objectives

| ID | Mục tiêu | KPI | Timeline |
|----|----------|-----|----------|
| BO-01 | Tăng hiệu quả vận hành shop | Giảm 70% thời gian quản lý thủ công | Q1/2026 |
| BO-02 | Tăng doanh thu shop thông qua social selling | Tăng 30% đơn pre-order qua catalog link | Q2/2026 |
| BO-03 | Giảm sai sót tồn kho | Tỉ lệ lỗi tồn kho < 2% | Q1/2026 |
| BO-04 | Tăng retention customer | 40% khách quay lại trong 3 tháng | Q3/2026 |
| BO-05 | Xây dựng doanh thu platform | 10 shop paying subscribers | Q2/2026 |
| BO-06 | Tạo nền tảng dữ liệu cho AI | 1000+ item được AI-draft | Q3/2026 |

---

## 4. Current State vs Future State

### 4.1 Current State (Trạng thái hiện tại)

```
Shop Owner → Excel/Google Sheet (tồn kho)
          → Facebook (đăng bài thủ công, ảnh riêng lẻ)
          → Messenger/Inbox (nhận pre-order)
          → Ghi chú tay (theo dõi trạng thái)
          → Không có loyalty
          → Không có báo cáo tự động
```

**Điểm yếu:**
- Dữ liệu phân tán, không đồng nhất
- Không có lịch sử audit
- Dễ mất thông tin khi nhân viên nghỉ
- Không scale được khi > 100 SKU

### 4.2 Future State (Trạng thái tương lai)

```
Shop Owner → Diecast360 Admin
          → Tạo item (AI-assisted) → Upload ảnh + SpinSet 360°
          → Publish → Copy caption/link → Đăng Facebook (1 click)
          → Pre-order tự động tracking (state machine)
          → Tồn kho ledger realtime
          → Member loyalty tự động tích điểm
          → Dashboard báo cáo daily
```

**Điểm mạnh:**
- Dữ liệu tập trung, có audit trail
- Multi-tenant: mỗi shop độc lập
- Tự động hóa 80% tác vụ lặp lại
- Scale được lên 10,000+ SKU

---

## 5. Business Requirements

### BR-001: Quản lý Catalog Diecast

**BR-001.1** Hệ thống phải cho phép shop admin tạo, xem, sửa, và xóa mềm (soft delete) thông tin item diecast bao gồm: tên, thương hiệu xe (car_brand), thương hiệu model (model_brand), tỉ lệ (mặc định 1:64), tình trạng hàng (condition), giá bán, trạng thái (con_hang/giu_cho/da_ban), số lượng tồn kho, và nội dung caption Facebook.

**BR-001.2** Hệ thống phải đảm bảo item có trạng thái `da_ban` luôn có `quantity = 0`. Không thể set `da_ban` khi quantity > 0 và ngược lại không thể tăng quantity khi đã `da_ban`.

**BR-001.3** Hệ thống phải hỗ trợ đánh dấu item là `is_public` để hiển thị trên public catalog, hoặc giữ private chỉ admin thấy.

**BR-001.4** Hệ thống phải cho phép lọc, tìm kiếm item theo: tên, brand, car_brand, model_brand, trạng thái, is_public, khoảng giá.

**BR-001.5** Mọi dữ liệu item phải được scope theo `shop_id` của tenant. Tuyệt đối không trả dữ liệu cross-tenant.

### BR-002: Quản lý Media & Hình ảnh

**BR-002.1** Mỗi item phải hỗ trợ nhiều ảnh thường (ItemImage), trong đó 1 ảnh được đánh dấu là cover (`is_cover`). Ảnh có thứ tự hiển thị (`display_order`).

**BR-002.2** Hệ thống phải hỗ trợ upload tối đa 20 ảnh/item. Định dạng hỗ trợ: JPEG, PNG, WebP. Kích thước tối đa: 10MB/ảnh.

**BR-002.3** Hệ thống phải tự động resize và tối ưu ảnh cho web. Ảnh gốc được lưu trữ và URL được ký (signed URL) với TTL.

### BR-003: Viewer 360° SpinSet

**BR-003.1** Mỗi item có thể có nhiều SpinSet (bộ ảnh 360°). Chỉ 1 SpinSet được đánh dấu là `is_default`. SpinSet default được dùng khi render spinner trên public catalog.

**BR-003.2** Mỗi SpinSet gồm nhiều SpinFrame với `frame_index` bắt đầu từ 0, liên tục, không bỏ số. Tối thiểu 12 frame, tối đa 36 frame cho 1 SpinSet.

**BR-003.3** Hệ thống phải cho phép shop admin upload hàng loạt frame (batch upload), sắp xếp lại thứ tự frame, và xóa frame riêng lẻ (với tự động renumber `frame_index`).

**BR-003.4** Khi không có SpinSet hoặc SpinSet lỗi, hệ thống phải fallback sang gallery ảnh thường.

**BR-003.5** Spinner trên public catalog phải load hoàn chỉnh trong vòng 3 giây trên kết nối 4G tiêu chuẩn (lazy load, preload frame).

### BR-004: Public Catalog & Discovery

**BR-004.1** Hệ thống phải cung cấp public catalog cho mỗi shop, truy cập qua slug của shop (ví dụ: `diecast360.app/shop/[slug]`). Không yêu cầu đăng nhập để xem.

**BR-004.2** Public catalog phải hiển thị chỉ các item có `is_public = true` và `deleted_at = null`. Item `da_ban` vẫn hiển thị nhưng không thể pre-order.

**BR-004.3** Khách phải có thể filter theo: brand, car_brand, trạng thái, khoảng giá. Tìm kiếm theo tên item.

**BR-004.4** Khi shop không active hoặc không tồn tại, trả về 404 thân thiện.

### BR-005: Social Selling (Facebook Integration)

**BR-005.1** Admin phải có thể copy nội dung caption (được tạo sẵn từ thông tin item) bằng 1 click, sẵn sàng paste lên Facebook.

**BR-005.2** Admin phải có thể copy link trực tiếp đến trang chi tiết item trên public catalog.

**BR-005.3** Hệ thống phải cho phép lưu lại link bài đăng Facebook (FacebookPost) sau khi admin đăng bài, để theo dõi lịch sử bài đăng theo item.

**BR-005.4** Caption phải được tạo theo template có thể tùy chỉnh per-shop, bao gồm: tên item, giá, trạng thái, link, thông tin liên hệ shop.

### BR-006: Pre-Order Management

**BR-006.1** Khách hàng phải có thể tạo pre-order cho item có trạng thái `con_hang` hoặc `giu_cho` từ public catalog mà không cần đăng nhập (guest checkout).

**BR-006.2** Hệ thống phải tuân thủ state machine pre-order: `PENDING_CONFIRMATION → WAITING_FOR_GOODS → ARRIVED → PAID → REFUNDED/CANCELLED`. Các chuyển trạng thái khác đều bị từ chối.

**BR-006.3** Admin phải có thể xem danh sách pre-order, filter theo trạng thái, và cập nhật trạng thái từng đơn.

**BR-006.4** Khi pre-order chuyển sang `PAID`, hệ thống phải tự động tính và cộng điểm cho member (nếu pre-order được liên kết với member).

**BR-006.5** Khi pre-order chuyển sang `CANCELLED` hoặc `REFUNDED`, hệ thống phải tự động trừ điểm nếu đã cộng.

**BR-006.6** Hệ thống phải ghi nhận lịch sử thay đổi trạng thái pre-order với timestamp và user thực hiện.

### BR-007: Inventory Tracking

**BR-007.1** Mọi thay đổi số lượng tồn kho phải được ghi vào ledger (`InventoryTransaction`) với loại giao dịch: `stock_in`, `stock_out`, `adjustment`.

**BR-007.2** Không được phép sửa trực tiếp trường `quantity` của item mà không qua ledger. Mọi thay đổi số lượng phải có lý do (note).

**BR-007.3** Hệ thống phải hiển thị lịch sử giao dịch tồn kho theo item, bao gồm: loại, số lượng trước/sau, ngày giờ, người thực hiện.

**BR-007.4** Hệ thống phải cảnh báo khi tồn kho xuống dưới ngưỡng cấu hình (low stock alert).

### BR-008: Member Loyalty Program

**BR-008.1** Shop phải có thể cấu hình chương trình loyalty: tỉ lệ earn point (VD: 1 điểm / 10,000 VND), membership tier (Bronze/Silver/Gold/Platinum với threshold điểm tích lũy).

**BR-008.2** Member đăng ký với: tên, số điện thoại, email (optional), ngày sinh (optional). Mỗi số điện thoại là 1 member duy nhất per shop.

**BR-008.3** Khi pre-order PAID, điểm được cộng tự động qua ledger (`MemberPointsLedger`). Admin cũng có thể cộng/trừ điểm thủ công với lý do.

**BR-008.4** Membership tier tự động nâng cấp khi tổng điểm tích lũy vượt threshold. Không tự động hạ cấp.

**BR-008.5** Không thể xóa member đang có pre-order ở trạng thái non-terminal (PENDING_CONFIRMATION, WAITING_FOR_GOODS, ARRIVED).

**BR-008.6** Mọi thay đổi điểm phải ghi vào `MemberPointsLedger` với đầy đủ: loại giao dịch, số điểm thay đổi, reference (pre-order ID hoặc manual), ghi chú.

### BR-009: AI-Assisted Product Creation

**BR-009.1** Admin phải có thể upload ảnh của mô hình xe, hệ thống gọi AI API để phân tích và trả về bản nháp (`AiItemDraft`) với các trường: tên, brand, car_brand, model_brand, condition, mô tả.

**BR-009.2** AiItemDraft có lifecycle: `PENDING → CONFIRMED/REJECTED`. Khi CONFIRMED, tạo Item thực từ draft. Khi REJECTED, ghi lý do và archive.

**BR-009.3** Admin phải có thể sửa bất kỳ trường nào trong draft trước khi CONFIRM.

**BR-009.4** Hệ thống phải xử lý gracefully khi AI API không khả dụng: thông báo lỗi rõ ràng, không crash, fallback sang tạo thủ công.

### BR-010: Reporting & Analytics

**BR-010.1** Dashboard phải hiển thị các KPI chính: tổng item (phân theo trạng thái), tổng pre-order (phân theo trạng thái), doanh thu ước tính (PAID orders), tổng member, điểm tích lũy tổng.

**BR-010.2** Báo cáo tồn kho: item sắp hết hàng (low stock), top item bán chạy nhất, giá trị tồn kho ước tính.

**BR-010.3** Báo cáo pre-order: theo thời gian, theo trạng thái, theo item.

**BR-010.4** Báo cáo member: tăng trưởng theo thời gian, phân bổ theo tier, top member điểm cao nhất.

### BR-011: Multi-Tenant Platform Management

**BR-011.1** Platform super admin phải có thể tạo, xem, sửa, vô hiệu hóa shop (tenant).

**BR-011.2** Platform super admin phải có thể gán user vào shop với vai trò cụ thể (shop_admin, shop_staff).

**BR-011.3** Mỗi shop có cấu hình riêng: tên hiển thị, slug (URL), thông tin liên hệ, giao diện (màu sắc, logo), loyalty config.

**BR-011.4** Shop slug phải unique toàn hệ thống, chỉ chứa ký tự alphanumeric và dấu gạch ngang.

---

## 6. Assumptions

| ID | Giả định | Impact nếu sai |
|----|----------|----------------|
| A01 | Không có payment gateway trong v1 — thanh toán offline | Cần tích hợp VNPay/MoMo → thêm 2 sprint |
| A02 | Facebook đăng thủ công (copy caption/link) | Nếu cần auto-post → thêm Facebook API |
| A03 | Chỉ diecast 1:64; các tỉ lệ khác nhập thủ công | Nếu cần đa tỉ lệ → thêm field + filter |
| A04 | AI API (OpenAI/Gemini) có sẵn và ổn định | Nếu bị block → cần fallback provider |
| A05 | Người dùng có smartphone để chụp ảnh đủ chất lượng | Nếu ảnh kém → AI accuracy thấp |
| A06 | Team dev có đủ năng lực NestJS + React 19 | Nếu không → cần training |

---

## 7. Constraints

| ID | Ràng buộc | Loại |
|----|-----------|------|
| C01 | Ngân sách giới hạn: không thuê thêm resource 6 tháng | Tài chính |
| C02 | Stack cố định: NestJS, React, PostgreSQL, Prisma | Kỹ thuật |
| C03 | Chỉ hỗ trợ tiền tệ VND | Business |
| C04 | Dữ liệu phải lưu tại Việt Nam (hoặc Cloudflare R2 Singapore) | Pháp lý |
| C05 | CSRF protection bắt buộc trên mọi mutation | Bảo mật |
| C06 | Multi-tenant isolation bắt buộc, không có exception | Bảo mật |
| C07 | Playwright E2E (53 tests) là CI gate — không thể bỏ qua | Chất lượng |

---

## 8. Dependencies

| ID | Phụ thuộc | Loại | Rủi ro |
|----|-----------|------|--------|
| D01 | OpenAI / Gemini API | External service | API key, cost, downtime |
| D02 | Cloudflare R2 (storage) | External service | Quota, latency |
| D03 | PostgreSQL 16 | Infrastructure | Version compatibility |
| D04 | Cloudflare Pages / Workers (hosting) | Infrastructure | Deployment config |
| D05 | Facebook Graph API (optional, v2) | External service | Policy change |
| D06 | Nodemailer / Email provider | External service | Deliverability |

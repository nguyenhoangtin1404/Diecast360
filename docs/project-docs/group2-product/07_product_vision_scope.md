---
title: Product Vision & Scope Document
version: 1.0
created: 2026-05-22
author: BA/PO Team
project: Diecast360
---

# Product Vision & Scope Document — Diecast360

## 1. Vision Statement

Diecast360 trở thành nền tảng thương mại điện tử chuyên biệt hàng đầu cho cộng đồng sưu tầm mô hình xe diecast tỉ lệ 1:64 tại Việt Nam — nơi người bán có thể quản lý kho, trưng bày sản phẩm với trải nghiệm xem 360° sống động, và bán hàng hiệu quả qua mạng xã hội; đồng thời nơi người mua sưu tầm khám phá, tìm hiểu và đặt hàng một cách thuận tiện, minh bạch với chương trình khách hàng thân thiết gắn kết lâu dài.

---

## 2. Mission Statement

Diecast360 cung cấp công cụ quản lý shop diecast toàn diện — từ catalog số hóa, media 360° chuyên nghiệp, đến quy trình pre-order minh bạch và loyalty program — giúp các shop diecast nhỏ và vừa vận hành chuyên nghiệp, tiếp cận khách hàng qua Facebook hiệu quả hơn, và xây dựng cộng đồng sưu tầm trung thành.

---

## 3. Product Goals

### 3.1 Ngắn hạn (Q4/2025 – Q1/2026)

| # | Mục tiêu | Chỉ số đo lường |
|---|-----------|-----------------|
| G1 | Ra mắt MVP với đầy đủ tính năng catalog + pre-order | 100% core flows hoạt động |
| G2 | Onboard 3 shop diecast đầu tiên | 3 shop active trong 30 ngày |
| G3 | Hỗ trợ upload ảnh 360° SpinSet | Upload thành công ≥ 24 frame/set |
| G4 | Tích hợp social selling (copy caption/link) | Tính năng hoạt động ổn định |

### 3.2 Trung hạn (Q2/2026 – Q3/2026)

| # | Mục tiêu | Chỉ số đo lường |
|---|-----------|-----------------|
| G5 | Mở rộng platform lên 10+ shop | 10 shop active |
| G6 | Loyalty program đi vào hoạt động | 200+ member có điểm tích lũy |
| G7 | AI-assisted product creation | 50%+ item tạo qua AI draft |
| G8 | Hệ thống báo cáo doanh thu, tồn kho | Dashboard live 7 KPI chính |

### 3.3 Dài hạn (Q4/2026 trở đi)

| # | Mục tiêu | Chỉ số đo lường |
|---|-----------|-----------------|
| G9 | 50+ shop trên platform | MRR tăng trưởng bền vững |
| G10 | Tích hợp đặt hàng trực tiếp từ Facebook/Zalo | Giảm 60% thời gian xử lý đơn |
| G11 | Marketplace B2C công khai | 1000+ khách hàng đăng ký |
| G12 | Mobile app cho shop owner | App rating ≥ 4.5 sao |

---

## 4. Target Users

### 4.1 Platform Owner (Chủ nền tảng)

- **Mô tả:** Đội ngũ vận hành Diecast360, có quyền `platform_super`
- **Nhu cầu:** Quản lý toàn bộ tenant/shop, user, billing, cấu hình hệ thống
- **Pain point:** Thiếu công cụ giám sát cross-tenant, audit log

### 4.2 Shop Owner / Shop Admin

- **Mô tả:** Chủ shop diecast, có quyền `shop_admin`
- **Đặc điểm:** Thường kiêm nhiệm quản lý + bán hàng. Bán chủ yếu qua Facebook Group/Page
- **Nhu cầu:** Đăng sản phẩm nhanh, copy caption bán hàng, xem tồn kho, theo dõi pre-order
- **Pain point:** Quản lý bằng Excel/Google Sheet thủ công, dễ nhầm hàng, mất thời gian đăng lên Facebook

### 4.3 Shop Staff (Nhân viên shop)

- **Mô tả:** Nhân viên hỗ trợ, quyền `shop_staff` (read-only mutating)
- **Nhu cầu:** Xem tồn kho, cập nhật trạng thái pre-order, nhập xuất hàng
- **Pain point:** Không có quyền sửa nhầm dữ liệu quan trọng

### 4.4 End Customer (Khách mua sưu tầm)

- **Mô tả:** Người sưu tầm diecast 1:64, độ tuổi 18–45, yêu thích xe mô hình
- **Nhu cầu:** Xem hình ảnh rõ nét (360°), biết trạng thái hàng, đặt hàng trước, tích điểm
- **Pain point:** Không biết hàng còn hay hết, ảnh nhỏ khó nhìn chi tiết, pre-order mập mờ

---

## 5. Core Value Proposition

### Cho Shop Owner
> **"Chuyên nghiệp hóa shop diecast trong 1 ngày"** — Diecast360 thay thế hoàn toàn quy trình Excel + Messenger thủ công bằng hệ thống quản lý tích hợp: catalog số hóa, spinner 360° ấn tượng, copy caption 1 click, và theo dõi pre-order real-time.

### Cho Customer
> **"Xem như cầm trên tay, đặt trước không lo lỡ hàng"** — Catalog công khai với viewer 360° cho phép khách xem mô hình từ mọi góc độ, đặt pre-order minh bạch và tích điểm thưởng qua mỗi giao dịch.

---

## 6. In Scope / Out of Scope

### In Scope

| Nhóm tính năng | Mô tả |
|----------------|-------|
| Catalog Management | CRUD item, quản lý ảnh, spin 360°, trạng thái hàng |
| Public Storefront | Catalog công khai, filter, search, xem chi tiết |
| 360° Viewer | Upload frame, SpinSet management, render spinner |
| Pre-Order System | Tạo đơn, state machine, thông báo |
| Inventory Tracking | Ledger nhập/xuất/điều chỉnh, stock alerts |
| Member Loyalty | Đăng ký member, tích điểm, membership tier |
| Social Selling | Copy caption, copy link, Facebook post log |
| AI Features | AI phân tích ảnh → draft item, AI mô tả sản phẩm |
| Multi-tenant | Mỗi shop là 1 tenant độc lập, RBAC đầy đủ |
| Reporting | Dashboard doanh thu, tồn kho, pre-order, member |
| Platform Admin | Quản lý shop, user, cấu hình hệ thống |

### Out of Scope (v1.0)

| Tính năng | Lý do |
|-----------|-------|
| Thanh toán online (VNPay, MoMo) | Phức tạp pháp lý, sẽ tích hợp v2 |
| App mobile native (iOS/Android) | Ưu tiên web trước |
| Tích hợp Shopee/Lazada/TikTok Shop | Ngoài phạm vi MVP |
| Đa tiền tệ | App thuần VND |
| Chat trực tiếp với khách | Sẽ dùng Facebook Messenger |
| Dropshipping / wholesale | Không phù hợp model kinh doanh |
| Tích hợp vận chuyển (GHTK, GHN) | Roadmap v2 |
| SEO tự động / sitemap | Roadmap v1.5 |

---

## 7. Assumptions & Constraints

### Assumptions (Giả định)

1. **Kết nối Facebook**: Shop owner tự đăng lên Facebook thủ công bằng caption/link được copy từ hệ thống — không có API Facebook tự động đăng bài.
2. **Hàng hóa**: Chỉ hỗ trợ mô hình xe diecast tỉ lệ 1:64; các tỉ lệ khác (1:18, 1:43) nếu có thì shop tự điền tay.
3. **Thanh toán**: Offline (chuyển khoản, COD) — hệ thống không xử lý payment gateway trong v1.
4. **Ảnh**: Shop tự chụp ảnh và upload; hệ thống không tích hợp camera.
5. **AI**: Sử dụng API AI bên ngoài (OpenAI/Gemini); cần internet và API key hợp lệ.
6. **Browser**: Hỗ trợ Chrome/Firefox/Safari phiên bản mới nhất; không hỗ trợ IE.

### Constraints (Ràng buộc)

| Loại | Ràng buộc |
|------|-----------|
| Kỹ thuật | Stack cố định: NestJS 11, React 19, PostgreSQL 16, Prisma 6 |
| Bảo mật | HttpOnly cookie + CSRF token cho mọi mutation |
| Lưu trữ | Local hoặc Cloudflare R2; không dùng S3 AWS |
| Đa tenant | Mọi query phải scope theo `shop_id`; TenantGuard bắt buộc |
| Timeline | Soft deadline: tháng 6/2026 cho tính năng AI và Reporting đầy đủ |
| Ngôn ngữ | Giao diện admin: tiếng Việt. API: tiếng Anh (snake_case JSON) |
| Team | 10 người, không thuê thêm trong 6 tháng tới |

---

## 8. Product Success Metrics

### Business Metrics

| Metric | Baseline | Target (6 tháng) | Target (12 tháng) |
|--------|----------|------------------|-------------------|
| Số shop active | 0 | 10 | 50 |
| Số item được đăng | 0 | 500 | 5,000 |
| Số pre-order tạo | 0 | 200 | 2,000 |
| Số member đăng ký | 0 | 300 | 3,000 |
| Tỉ lệ pre-order PAID | — | ≥ 70% | ≥ 80% |

### Product Quality Metrics

| Metric | Target |
|--------|--------|
| Uptime | ≥ 99.5% |
| API P95 latency | < 500ms |
| Spinner load time (24 frames) | < 3s trên 4G |
| E2E test pass rate (53 tests) | 100% |
| Bug severity Critical mở > 7 ngày | 0 |

### User Satisfaction Metrics

| Metric | Target |
|--------|--------|
| Thời gian tạo item mới (admin) | < 5 phút |
| Thời gian tạo pre-order (customer) | < 2 phút |
| Shop owner NPS | ≥ 40 |
| Customer satisfaction (CSAT) | ≥ 4.0/5.0 |

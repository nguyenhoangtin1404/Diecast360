---
version: "1.0"
created: "2026-05-22"
author: "Nguyễn Hoàng Tín – Project Manager"
status: "Approved"
---

# Project Charter — Diecast360

## 1. Thông Tin Dự Án

| Trường              | Nội dung                                                                             |
|---------------------|--------------------------------------------------------------------------------------|
| **Tên dự án**       | Diecast360                                                                           |
| **Mã dự án**        | DC360-2025                                                                           |
| **Loại dự án**      | Phát triển phần mềm thương mại điện tử (SaaS – Multi-tenant)                        |
| **PM**              | Nguyễn Hoàng Tín                                                                     |
| **Tech Lead**       | [Tech Lead]                                                                          |
| **Sponsor**         | Platform Owner / Chủ sở hữu hệ thống                                                |
| **Ngày khởi động**  | 01/10/2025                                                                           |
| **Ngày dự kiến kết thúc** | 31/05/2026                                                                    |
| **Ngân sách ước tính** | 180.000.000 VNĐ (~7.200 USD)                                                     |
| **Phiên bản charter** | v1.0 – Phê duyệt ban đầu                                                          |

---

## 2. Problem Statement & Business Need

### 2.1 Bối cảnh

Thị trường mô hình xe diecast tỉ lệ 1:64 tại Việt Nam đang phát triển nhanh, đặc biệt trong các cộng đồng collector trên Facebook, Zalo và YouTube. Các shop bán lẻ mô hình hiện đang quản lý kho thủ công qua file Excel, đăng sản phẩm bằng tay trên Facebook, và xử lý pre-order qua inbox hoặc form Google. Quy trình này dẫn đến:

- **Sai sót kho hàng** do thiếu đồng bộ giữa tồn thực và tồn sổ sách.
- **Trải nghiệm khách hàng kém** vì không có trang catalog chuyên nghiệp và không thể xem 360°.
- **Mất doanh thu** do không theo dõi được pre-order lifecycle một cách có hệ thống.
- **Không tích lũy được loyalty** — không có chương trình hội viên điểm thưởng chuẩn hóa.
- **Tốn công sức marketing** vì phải tạo caption thủ công và đăng Facebook bằng tay.

### 2.2 Nhu Cầu Nghiệp Vụ

Diecast360 được xây dựng để giải quyết trực tiếp các vấn đề trên thông qua một nền tảng SaaS multi-tenant, cho phép nhiều shop diecast vận hành độc lập trên cùng hệ thống, với:

- Catalog công khai chuyên nghiệp, có viewer 360° (SpinSet).
- Pre-order lifecycle được quản lý chặt chẽ theo state machine.
- Kho hàng theo ledger, đảm bảo audit trail đầy đủ.
- Hệ thống hội viên và tích điểm tự động.
- Tích hợp Facebook Graph API để đăng bài và copy caption.
- AI hỗ trợ tạo mô tả sản phẩm và draft item từ ảnh.

---

## 3. Mục Tiêu Dự Án (SMART)

| # | Mục tiêu                                                                                       | Đo lường                                         | Deadline    |
|---|-----------------------------------------------------------------------------------------------|--------------------------------------------------|-------------|
| 1 | Triển khai MVP đầy đủ chức năng quản lý item, hình ảnh, catalog công khai                    | 100% test cases P0 pass, demo được với shop thật | 31/12/2025  |
| 2 | Ra mắt pre-order và quản lý kho với ledger transaction                                         | Xử lý 50+ pre-order trong tháng đầu tiên        | 28/02/2026  |
| 3 | Tích hợp loyalty points hoạt động end-to-end (tích điểm, đổi điểm, tier)                     | 100 member đăng ký trong Q1/2026                 | 31/03/2026  |
| 4 | Tích hợp Facebook Graph API và AI description hoạt động ổn định                               | Tỉ lệ thành công AI call ≥ 95%                  | 30/04/2026  |
| 5 | Uptime hệ thống ≥ 99% (tính theo giờ hoạt động trong giờ kinh doanh 8h–22h)                  | Monitored qua uptime dashboard                   | Liên tục    |
| 6 | Thời gian phản hồi API < 300ms (p95) trong điều kiện tải bình thường                          | Load test với 50 concurrent users                | 31/05/2026  |

---

## 4. Phạm Vi Dự Án

### 4.1 Trong Phạm Vi (In Scope)

**Backend (NestJS + Prisma + PostgreSQL):**
- Xác thực & phân quyền: JWT cookie, CSRF, RBAC (platform_super / shop_admin / shop_staff)
- Module Items: CRUD, soft delete, status lifecycle (con_hang / giu_cho / da_ban), bulk operations
- Module Images: upload ảnh thường (JPEG/PNG/WebP), resize, storage driver (local/R2)
- Module SpinSet/SpinFrame: upload 24–48 frames, reorder, xóa frame, unique constraint
- Module PreOrder: state machine lifecycle, public API, admin management
- Module Inventory: InventoryTransaction ledger (stock_in / stock_out / adjustment)
- Module Members: đăng ký, thông tin, tier (Bronze/Silver/Gold)
- Module Points: MemberPointsLedger, tích điểm tự động khi PAID, đổi điểm
- Module Reports: inventory trends, revenue summary, pre-order summary
- Module Facebook: copy caption, đăng bài qua Graph API
- Module AI: generate description (Claude API), analyze image to draft item
- Multi-tenant: TenantGuard, active_shop_id context, cross-shop isolation
- Media serving: signed URLs, proxy qua `/api/v1/media`

**Frontend (React + Vite + TanStack Query + Tailwind):**
- Admin Panel: toàn bộ CRUD, dashboard, báo cáo
- Public Catalog: trang shop công khai, xem chi tiết sản phẩm, viewer 360°
- Public Pre-order: form đặt hàng, tra cứu trạng thái
- Responsive design (desktop-first, mobile-friendly)

**DevOps & Infrastructure:**
- Backend deploy trên Raspberry Pi với HTTPS tunnel (Cloudflare Tunnel hoặc tương đương)
- Frontend deploy trên Cloudflare Pages
- Database trên Neon PostgreSQL (serverless)
- Storage: Cloudflare R2 (production), local disk (dev)
- CI/CD: GitHub Actions cho lint, test, build
- Monitoring: uptime check, error alerting

### 4.2 Ngoài Phạm Vi (Out of Scope)

- Ứng dụng mobile native (iOS/Android)
- Tích hợp thanh toán trực tuyến (VNPAY, MoMo, Stripe) — thanh toán COD/chuyển khoản thủ công
- Tích hợp Zalo OA
- Hệ thống chat/inbox tích hợp trong app
- Đa ngôn ngữ (i18n) — chỉ Tiếng Việt
- Đa tiền tệ — chỉ VNĐ
- Warehouse/WMS cho kho vật lý phức tạp
- Phân tích dữ liệu nâng cao (BI, data warehouse)
- API public cho bên thứ ba

---

## 5. Các Bên Liên Quan (Stakeholders)

### 5.1 Ma Trận Stakeholder

| Stakeholder           | Vai trò              | Mức độ ảnh hưởng | Mức độ quan tâm | Chiến lược tương tác          |
|-----------------------|----------------------|------------------|-----------------|-------------------------------|
| **Platform Owner**    | Chủ hệ thống, Sponsor | Rất cao          | Rất cao         | Họp tuần, báo cáo tháng       |
| **Shop Owner (Admin)**| Người dùng chính, shop_admin | Cao        | Rất cao         | Demo sprint, thu thập feedback |
| **Shop Staff**        | Nhân viên shop, shop_staff | Trung bình   | Cao             | Training, user guide           |
| **End User/Customer** | Khách mua hàng (public catalog) | Thấp  | Trung bình      | UX testing, feedback form      |
| **Tech Lead**         | Kiến trúc kỹ thuật   | Rất cao          | Cao             | Daily standup, code review     |
| **Backend Dev (×2)**  | Phát triển backend   | Cao              | Cao             | Sprint planning, daily standup |
| **Frontend Dev (×2)** | Phát triển frontend  | Cao              | Cao             | Sprint planning, daily standup |
| **UI/UX Designer**    | Thiết kế giao diện   | Cao              | Cao             | Design review, prototyping     |
| **BA/PO**             | Phân tích nghiệp vụ  | Rất cao          | Rất cao         | Grooming, acceptance criteria  |
| **QA Engineer**       | Kiểm thử chất lượng  | Cao              | Cao             | Test planning, bug triage      |
| **DevOps**            | Hạ tầng & CI/CD      | Cao              | Trung bình      | Deployment planning, incidents |

### 5.2 Phân Tích Chi Tiết

**Platform Owner:**
Là nhà đầu tư và chủ sở hữu nền tảng. Ra quyết định về roadmap, ngân sách, và chiến lược kinh doanh. Cần được cập nhật về tiến độ và các rủi ro kinh doanh hàng tháng.

**Shop Owner (shop_admin):**
Người dùng chính và khách hàng mục tiêu của nền tảng. Sử dụng toàn bộ chức năng quản lý: items, pre-order, kho, thành viên, báo cáo. Phản hồi của họ là đầu vào quan trọng nhất cho product backlog.

**Shop Staff (shop_staff):**
Nhân viên của shop, thực hiện các tác vụ hàng ngày: nhập hàng, cập nhật trạng thái pre-order. Chỉ có quyền đọc trên các endpoint mutating, cần giao diện đơn giản và trực quan.

**End User/Customer:**
Khách hàng truy cập public catalog, xem sản phẩm, đặt pre-order. Trải nghiệm của họ ảnh hưởng trực tiếp đến doanh thu của shop.

---

## 6. KPI & Thước Đo Thành Công

### 6.1 KPI Kỹ Thuật

| KPI                          | Mục tiêu               | Chu kỳ đo  | Công cụ đo                  |
|------------------------------|------------------------|------------|------------------------------|
| API Uptime                   | ≥ 99% (8h–22h)         | Hàng tuần  | UptimeRobot / custom monitor |
| API Response Time (p95)      | < 300ms                | Hàng sprint | Load test script             |
| Build Success Rate           | ≥ 95%                  | Liên tục   | GitHub Actions               |
| Test Coverage (backend)      | ≥ 70% (unit + e2e)     | Hàng sprint | Jest coverage report         |
| E2E Test Pass Rate           | 100% (53 tests)        | Mỗi PR     | Playwright CI                |
| Bug Escape Rate (Prod)       | < 2 P1 bugs/sprint     | Hàng sprint | GitHub Issues                |
| Deployment Frequency         | ≥ 2 lần/sprint         | Hàng sprint | GitHub Actions               |

### 6.2 KPI Sản Phẩm

| KPI                          | Mục tiêu Q2/2026       | Ghi chú                              |
|------------------------------|------------------------|--------------------------------------|
| Số shop active               | ≥ 5 shop               | Đã onboard và đăng ít nhất 10 items  |
| Số item published            | ≥ 500 items            | Tổng toàn hệ thống                   |
| Số pre-order hoàn thành (PAID) | ≥ 200 pre-orders      | Từ khi ra mắt tính năng              |
| Số member đăng ký            | ≥ 200 members          | Tổng toàn hệ thống                   |
| AI description usage         | ≥ 60% item mới         | Items dùng AI-generated description  |
| SpinSet upload rate          | ≥ 30% item có SpinSet  | Items có viewer 360°                 |

### 6.3 KPI Hài Lòng Người Dùng

| KPI                          | Mục tiêu               | Phương pháp                         |
|------------------------------|------------------------|--------------------------------------|
| Shop Owner satisfaction      | ≥ 4/5 sao              | Khảo sát cuối Phase 1, 2, 3          |
| Ease of use (admin panel)    | ≥ 3.8/5                | SUS score hoặc form khảo sát        |
| Public catalog bounce rate   | < 60%                  | Cloudflare Analytics                 |

---

## 7. Milestones Chính

| Milestone                         | Mô tả                                                            | Deadline    | Người xác nhận  |
|-----------------------------------|------------------------------------------------------------------|-------------|-----------------|
| **M0 – Project Kickoff**          | Team đầy đủ, môi trường dev ready, backlog initial              | 10/10/2025  | PM              |
| **M1 – Phase 1 MVP Complete**     | Auth, Item CRUD, Image upload, Public catalog, E2E test pass    | 31/12/2025  | PM, Tech Lead   |
| **M2 – Phase 2 Commerce Complete**| Pre-order, Inventory ledger, Members, Points, Reports           | 31/03/2026  | PM, BA/PO       |
| **M3 – Phase 3 AI & Social**      | AI description, AI draft, Facebook integration, SpinSet 360°   | 31/05/2026  | PM, Tech Lead   |
| **M4 – Production Hardening**     | Load test, security audit, monitoring, documentation            | 31/05/2026  | DevOps, QA      |
| **M5 – Official Launch**          | Onboard 3 shop thật, training, hypercare period kết thúc       | 30/06/2026  | PM, Sponsor     |

---

## 8. Tóm Tắt Ngân Sách

### 8.1 Chi Phí Nhân Lực (8 tháng)

| Vai trò              | Số người | Lương ước tính/tháng | Tổng 8 tháng      |
|----------------------|----------|----------------------|-------------------|
| PM                   | 1        | 12.000.000 VNĐ       | 96.000.000 VNĐ    |
| Tech Lead            | 1        | 20.000.000 VNĐ       | 160.000.000 VNĐ   |
| Backend Dev          | 2        | 15.000.000 VNĐ/người | 240.000.000 VNĐ   |
| Frontend Dev         | 2        | 14.000.000 VNĐ/người | 224.000.000 VNĐ   |
| UI/UX Designer       | 1        | 12.000.000 VNĐ       | 96.000.000 VNĐ    |
| QA Engineer          | 1        | 11.000.000 VNĐ       | 88.000.000 VNĐ    |
| BA/PO                | 1        | 13.000.000 VNĐ       | 104.000.000 VNĐ   |
| DevOps               | 1        | 15.000.000 VNĐ       | 120.000.000 VNĐ   |
| **Subtotal**         | **10**   |                      | **1.128.000.000** |

> *Lưu ý: Ngân sách nhân lực trên là chi phí cơ hội/quy đổi — thực tế dự án có thể sử dụng team nội bộ hoặc freelance.*

### 8.2 Chi Phí Hạ Tầng & Dịch Vụ (hàng tháng × 8 tháng)

| Dịch vụ                    | Chi phí/tháng    | Tổng 8 tháng    |
|----------------------------|------------------|-----------------|
| Neon PostgreSQL (Pro)      | ~$19 / ~475k VNĐ | 3.800.000 VNĐ   |
| Cloudflare R2 (storage)    | ~$5 / ~125k VNĐ  | 1.000.000 VNĐ   |
| Cloudflare Pages           | Free              | 0               |
| Raspberry Pi (điện, thiết bị) | ~200k VNĐ     | 1.600.000 VNĐ   |
| Claude API (AI)            | ~$20 / ~500k VNĐ | 4.000.000 VNĐ   |
| Facebook Graph API         | Free (trong quota) | 0              |
| Domain & SSL               | ~500k VNĐ/năm    | 500.000 VNĐ     |
| Monitoring tools           | ~100k VNĐ        | 800.000 VNĐ     |
| **Subtotal hạ tầng**       |                  | **11.700.000**  |

### 8.3 Tổng Ngân Sách Dự Án (Thu Nhỏ / Bootstrap)

Dự án được thực hiện theo mô hình bootstrap với team nhỏ, chi phí thực tế tập trung vào hạ tầng:

| Hạng mục              | Ngân sách         |
|-----------------------|-------------------|
| Hạ tầng & dịch vụ     | 11.700.000 VNĐ    |
| Chi phí phát sinh     | 5.000.000 VNĐ     |
| **Tổng cộng thực tế** | **~16.700.000 VNĐ** |

---

## 9. Rủi Ro Tóm Tắt

| Rủi ro chính                              | Mức độ | Biện pháp giảm thiểu                          |
|-------------------------------------------|--------|-----------------------------------------------|
| Server Raspberry Pi không ổn định         | Cao    | Cloudflare Tunnel, monitoring 24/7, backup plan |
| Scope creep từ shop owner                 | Cao    | Change request process nghiêm ngặt            |
| Facebook API thay đổi chính sách          | Trung  | Abstract Facebook service, fallback manual    |
| Mất dữ liệu DB trên Neon                  | Thấp   | Daily backup, point-in-time recovery          |
| Thiếu người dùng thực (low adoption)      | Trung  | Onboard 1 shop thật từ Phase 1                |

*(Chi tiết đầy đủ trong `03_risk_register.md`)*

---

## 10. Giả Định & Ràng Buộc

### 10.1 Giả Định

- Team có đủ 10 thành viên từ ngày 10/10/2025 và duy trì đến 31/05/2026.
- Platform Owner cung cấp phản hồi trong vòng 2 ngày làm việc khi được hỏi.
- Ít nhất 1 shop thật tham gia beta testing từ tháng 1/2026.
- Facebook Graph API tiếp tục hoạt động với quota hiện tại.
- Raspberry Pi server ổn định với uptime ≥ 95% (có thể có downtime bảo trì).
- Neon PostgreSQL serverless đáp ứng được tải trong giai đoạn beta.

### 10.2 Ràng Buộc

- Ngân sách hạ tầng giới hạn — không thể nâng lên cloud hosting đắt tiền.
- Pháp lý: không tích hợp cổng thanh toán trong phạm vi dự án này.
- Chỉ hỗ trợ Tiếng Việt và VNĐ.
- Frontend phải tương thích với Chrome 120+, Firefox 115+, Safari 17+.
- GDPR/PDPA: lưu trữ dữ liệu khách hàng phải tuân theo quy định bảo vệ dữ liệu cá nhân.

---

## 11. Phê Duyệt

| Vai trò          | Họ tên                | Chữ ký | Ngày phê duyệt |
|------------------|-----------------------|--------|----------------|
| Sponsor          | [Platform Owner]      |        | ___/___/2025   |
| Project Manager  | Nguyễn Hoàng Tín      |        | ___/___/2025   |
| Tech Lead        | [Tech Lead]           |        | ___/___/2025   |
| BA/PO            | [BA/PO]               |        | ___/___/2025   |

---

*Tài liệu này có hiệu lực kể từ ngày được tất cả các bên ký duyệt. Mọi thay đổi phạm vi sau khi phê duyệt phải trải qua quy trình Change Request chính thức.*

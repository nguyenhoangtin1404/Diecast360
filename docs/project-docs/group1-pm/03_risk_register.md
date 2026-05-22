---
version: "1.2"
created: "2026-05-22"
author: "Nguyễn Hoàng Tín – Project Manager"
reviewed_by: "Tech Lead"
status: "Active"
---

# Risk Register — Diecast360

## 1. Hướng Dẫn Sử Dụng

### 1.1 Thang Đo Likelihood (Khả năng xảy ra)

| Điểm | Mức độ       | Xác suất     |
|------|--------------|--------------|
| 1    | Rất thấp     | < 5%         |
| 2    | Thấp         | 5–20%        |
| 3    | Trung bình   | 20–50%       |
| 4    | Cao          | 50–80%       |
| 5    | Rất cao      | > 80%        |

### 1.2 Thang Đo Impact (Mức độ tác động)

| Điểm | Mức độ       | Hậu quả                                                   |
|------|--------------|-----------------------------------------------------------|
| 1    | Không đáng kể| Ảnh hưởng tối thiểu, không cần escalate                  |
| 2    | Nhỏ          | Delay < 1 ngày, cost tăng < 5%                           |
| 3    | Trung bình   | Delay 1–3 ngày, cost tăng 5–15%, cần điều chỉnh plan     |
| 4    | Lớn          | Delay sprint, cost tăng 15–30%, milestone bị ảnh hưởng   |
| 5    | Thảm họa     | Delay phase, mất dữ liệu, dự án có thể fail              |

### 1.3 Risk Score = Likelihood × Impact

| Risk Score | Mức độ rủi ro | Màu sắc | Hành động |
|------------|---------------|---------|-----------|
| 1–4        | Thấp          | Xanh lá | Monitor định kỳ |
| 5–9        | Trung bình    | Vàng    | Lập kế hoạch giảm thiểu |
| 10–14      | Cao           | Cam     | Hành động ngay, báo cáo PM |
| 15–25      | Rất cao       | Đỏ      | Escalate lên Sponsor, xử lý khẩn cấp |

### 1.4 Trạng Thái Rủi Ro

- **Open:** Rủi ro đang tồn tại, chưa được xử lý đủ.
- **Mitigating:** Đang thực hiện biện pháp giảm thiểu.
- **Closed:** Rủi ro đã được giải quyết hoặc không còn áp dụng.
- **Accepted:** Rủi ro được chấp nhận vì cost giảm thiểu > lợi ích.

---

## 2. Tóm Tắt Danh Mục Rủi Ro

| Danh mục            | Số rủi ro | High/Critical | Trạng thái     |
|---------------------|-----------|---------------|----------------|
| Technical           | 6         | 3             | Mitigating     |
| Business            | 4         | 2             | Open/Mitigating|
| Security            | 3         | 2             | Mitigating     |
| Operational         | 4         | 3             | Mitigating     |
| **Tổng**            | **17**    | **10**        |                |

---

## 3. Chi Tiết Risk Register

### 3.1 Technical Risks

---

#### R-T01: Server Raspberry Pi Không Ổn Định

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-T01                                                                                                 |
| **Danh mục** | Technical – Infrastructure                                                                            |
| **Mô tả**    | Backend được deploy trên Raspberry Pi — thiết bị phần cứng tiêu dùng, không phải server enterprise. Có thể gặp: overheating, SD card hỏng, mất điện, kernel panic, thiếu RAM khi tải tăng. |
| **Likelihood** | 4 (Cao) — Raspberry Pi đã có lịch sử downtime nhỏ mỗi tháng                                      |
| **Impact**   | 5 (Thảm họa) — Backend down = toàn bộ admin panel và API không hoạt động                             |
| **Risk Score** | **20 – Rất cao (Đỏ)**                                                                              |
| **Biện pháp giảm thiểu** | 1. Cài UptimeRobot monitor với alert SMS/email. 2. Cloudflare Tunnel có tự reconnect. 3. Chuẩn bị backup plan: VPS $5/tháng (DigitalOcean/Hetzner) có thể deploy nhanh trong 30 phút. 4. Bật swap trên Pi. 5. SSD thay SD card. 6. UPS (bộ lưu điện mini). |
| **Owner**    | DevOps                                                                                                |
| **Review Date** | Hàng tháng                                                                                         |
| **Status**   | Mitigating                                                                                            |

---

#### R-T02: Neon PostgreSQL Outage / Data Loss

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-T02                                                                                                 |
| **Danh mục** | Technical – Database                                                                                  |
| **Mô tả**    | Neon PostgreSQL là serverless DB với cold start delay. Nếu Neon có outage hoặc mất dữ liệu, toàn bộ dữ liệu shop (items, pre-orders, members) có thể bị ảnh hưởng. |
| **Likelihood** | 2 (Thấp) — Neon có SLA 99.9%, nhưng serverless có cold start vài giây                             |
| **Impact**   | 5 (Thảm họa) — Mất dữ liệu = mất tin tưởng của shop owner                                           |
| **Risk Score** | **10 – Cao (Cam)**                                                                                 |
| **Biện pháp giảm thiểu** | 1. Enable Neon daily backup và point-in-time recovery. 2. Script pg_dump tự động hàng ngày lưu lên R2. 3. Test restore từ backup mỗi tháng. 4. Chuẩn bị migration plan sang Supabase nếu Neon có vấn đề. 5. Sử dụng Neon Pro plan có SLA tốt hơn. |
| **Owner**    | DevOps, Backend Dev 1                                                                                 |
| **Review Date** | Hàng tháng                                                                                         |
| **Status**   | Mitigating                                                                                            |

---

#### R-T03: Cloudflare R2 Không Tương Thích Hoặc Chi Phí Vượt Ngân Sách

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-T03                                                                                                 |
| **Danh mục** | Technical – Storage                                                                                   |
| **Mô tả**    | Cloudflare R2 có thể thay đổi pricing hoặc có breaking changes trong API. Nếu storage chi phí vượt ngân sách do lượng SpinFrame ảnh lớn (24-48 ảnh/item), cần giải pháp thay thế. |
| **Likelihood** | 2 (Thấp) — R2 ổn định, pricing rõ ràng                                                           |
| **Impact**   | 3 (Trung bình) — Ảnh hưởng cost, cần migration storage                                               |
| **Risk Score** | **6 – Trung bình (Vàng)**                                                                          |
| **Biện pháp giảm thiểu** | 1. StorageService abstract layer đã có — có thể switch driver. 2. Monitor R2 usage hàng tháng. 3. Compress ảnh WebP trước khi upload. 4. Set file size limit (ví dụ: 5MB/frame). 5. Nếu cần: migrate sang Backblaze B2 tương thích S3. |
| **Owner**    | DevOps, Tech Lead                                                                                     |
| **Review Date** | Hàng quý                                                                                           |
| **Status**   | Mitigating                                                                                            |

---

#### R-T04: Claude API Rate Limit Và Chi Phí AI Vượt Ngân Sách

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-T04                                                                                                 |
| **Danh mục** | Technical – Third-party API                                                                           |
| **Mô tả**    | Claude API có rate limit (RPM/TPM) và tính phí theo token. Nếu nhiều shop dùng AI description/draft cùng lúc, có thể bị rate limit hoặc chi phí tăng đột biến. |
| **Likelihood** | 3 (Trung bình)                                                                                    |
| **Impact**   | 3 (Trung bình) — AI feature không dùng được, nhưng không ảnh hưởng core functions                   |
| **Risk Score** | **9 – Trung bình (Vàng)**                                                                          |
| **Biện pháp giảm thiểu** | 1. Implement server-side queue cho AI requests (BullMQ). 2. Retry với exponential backoff. 3. Caching response cho cùng item metadata. 4. Budget alert khi cost vượt $15/tháng. 5. Fallback: hiển thị template rỗng nếu AI unavailable. 6. Per-shop AI usage limit. |
| **Owner**    | Backend Dev 1, Tech Lead                                                                              |
| **Review Date** | Hàng sprint                                                                                        |
| **Status**   | Mitigating                                                                                            |

---

#### R-T05: Facebook Graph API Thay Đổi Chính Sách

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-T05                                                                                                 |
| **Danh mục** | Technical – Third-party API                                                                           |
| **Mô tả**    | Facebook thường xuyên thay đổi Graph API version, deprecate endpoints, hoặc thắt chặt chính sách. Tích hợp có thể bị break sau khi deprecation. |
| **Likelihood** | 4 (Cao) — Facebook có lịch sử thay đổi API thường xuyên                                          |
| **Impact**   | 3 (Trung bình) — Feature đăng bài không dùng được, nhưng shop vẫn có thể copy caption thủ công      |
| **Risk Score** | **12 – Cao (Cam)**                                                                                 |
| **Biện pháp giảm thiểu** | 1. Abstract FacebookService để dễ swap implementation. 2. Monitor Facebook API changelog. 3. Giữ copy caption (không phụ thuộc API) như fallback chính. 4. Version pin Graph API version. 5. Test integration hàng tháng. |
| **Owner**    | Backend Dev 2                                                                                         |
| **Review Date** | Hàng tháng                                                                                         |
| **Status**   | Open                                                                                                  |

---

#### R-T06: Performance Degradation Khi Nhiều Shops / Items Tăng

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-T06                                                                                                 |
| **Danh mục** | Technical – Performance                                                                               |
| **Mô tả**    | Khi số lượng shops, items, và transactions tăng, các query không có index tốt sẽ chậm dần. Đặc biệt InventoryTransaction ledger và MemberPointsLedger có thể accumulate nhanh. |
| **Likelihood** | 3 (Trung bình)                                                                                    |
| **Impact**   | 3 (Trung bình) — API > 300ms, UX kém                                                                 |
| **Risk Score** | **9 – Trung bình (Vàng)**                                                                          |
| **Biện pháp giảm thiểu** | 1. EXPLAIN ANALYZE review hàng sprint. 2. Index trên: shop_id, created_at, status. 3. Neon connection pooling (PgBouncer). 4. Cursor-based pagination thay vì OFFSET. 5. Load test với k6 trước mỗi phase release. |
| **Owner**    | Backend Dev 1, Tech Lead                                                                              |
| **Review Date** | Hàng sprint                                                                                        |
| **Status**   | Mitigating                                                                                            |

---

### 3.2 Business Risks

---

#### R-B01: Low Adoption — Shop Owner Không Dùng Nền Tảng

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-B01                                                                                                 |
| **Danh mục** | Business – Adoption                                                                                   |
| **Mô tả**    | Shop diecast đã quen với Excel và Facebook inbox. Nếu UX phức tạp hoặc tính năng chưa đủ hấp dẫn, họ sẽ không chuyển sang dùng Diecast360. |
| **Likelihood** | 3 (Trung bình)                                                                                    |
| **Impact**   | 5 (Thảm họa) — Không có user = dự án thất bại về mặt business                                       |
| **Risk Score** | **15 – Rất cao (Đỏ)**                                                                              |
| **Biện pháp giảm thiểu** | 1. Onboard 1 shop beta từ Phase 1 để có real feedback sớm. 2. Tổ chức demo và training đầy đủ. 3. UX research: quan sát shop dùng thực tế. 4. Cung cấp data import tool (từ Excel). 5. Hypercare period: hỗ trợ trực tiếp 2 tuần sau onboard. 6. Giữ tính năng core đơn giản trước, tính năng nâng cao ẩn đi. |
| **Owner**    | PM, BA/PO                                                                                             |
| **Review Date** | Hàng tháng                                                                                         |
| **Status**   | Mitigating                                                                                            |

---

#### R-B02: Scope Creep Từ Shop Owner

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-B02                                                                                                 |
| **Danh mục** | Business – Scope                                                                                      |
| **Mô tả**    | Shop owner sau khi dùng thử có thể yêu cầu thêm nhiều tính năng nằm ngoài scope (thanh toán online, chat, đa ngôn ngữ, app mobile...). Nếu không quản lý tốt, team sẽ bị phân tán. |
| **Likelihood** | 4 (Cao) — Đây là pattern phổ biến với phần mềm B2B                                               |
| **Impact**   | 4 (Lớn) — Delay timeline, demoralize team, chất lượng giảm                                           |
| **Risk Score** | **16 – Rất cao (Đỏ)**                                                                              |
| **Biện pháp giảm thiểu** | 1. Change Request process rõ ràng: mọi yêu cầu mới phải qua BA/PO. 2. Sprint backlog locked sau Sprint Planning. 3. Product roadmap công khai để set expectations. 4. Feature requests vào backlog, ưu tiên theo quarterly review. 5. Document "Out of Scope" rõ ràng trong Project Charter. |
| **Owner**    | PM, BA/PO                                                                                             |
| **Review Date** | Hàng sprint                                                                                        |
| **Status**   | Mitigating                                                                                            |

---

#### R-B03: Mô Hình Kinh Doanh Chưa Rõ Ràng (Monetization)

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-B03                                                                                                 |
| **Danh mục** | Business – Revenue                                                                                    |
| **Mô tả**    | Dự án chưa có kế hoạch monetization rõ ràng (SaaS subscription, transaction fee, hay freemium?). Nếu không có doanh thu, platform không bền vững sau giai đoạn phát triển ban đầu. |
| **Likelihood** | 3 (Trung bình)                                                                                    |
| **Impact**   | 4 (Lớn) — Ảnh hưởng đến sustainability dài hạn của dự án                                            |
| **Risk Score** | **12 – Cao (Cam)**                                                                                 |
| **Biện pháp giảm thiểu** | 1. Clarify monetization model với Platform Owner trước Q2/2026. 2. Giai đoạn beta: free để build user base. 3. Cân nhắc: SaaS $X/shop/tháng dựa trên số items hoặc features. 4. Không build billing trong scope này, nhưng thiết kế DB để có thể thêm. |
| **Owner**    | Platform Owner, PM                                                                                    |
| **Review Date** | Hàng quý                                                                                           |
| **Status**   | Open                                                                                                  |

---

#### R-B04: Cạnh Tranh Từ Nền Tảng TMĐT Lớn (Shopee/TikTok Shop)

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-B04                                                                                                 |
| **Danh mục** | Business – Competitive                                                                                |
| **Mô tả**    | Shop diecast có thể chọn dùng Shopee, TikTok Shop vì đã có sẵn khách hàng, không cần build catalog từ đầu. Diecast360 cạnh tranh bằng specialization, nhưng phải đủ mạnh để giữ chân shop. |
| **Likelihood** | 3 (Trung bình)                                                                                    |
| **Impact**   | 3 (Trung bình) — Shop vừa dùng Shopee vừa dùng Diecast360 là có thể, nhưng commitment thấp          |
| **Risk Score** | **9 – Trung bình (Vàng)**                                                                          |
| **Biện pháp giảm thiểu** | 1. Đặt trọng tâm vào differentiators: SpinSet 360°, AI description, pre-order lifecycle. 2. Niche-first: phục vụ tốt collector community trước. 3. Tích hợp Facebook (nơi diecast community sống). 4. Không cạnh tranh trực tiếp với Shopee, mà tích hợp làm complement. |
| **Owner**    | PM, Platform Owner                                                                                    |
| **Review Date** | Hàng quý                                                                                           |
| **Status**   | Accepted                                                                                              |

---

### 3.3 Security Risks

---

#### R-S01: SQL Injection / API Authorization Bypass

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-S01                                                                                                 |
| **Danh mục** | Security – Application                                                                                |
| **Mô tả**    | Nếu không parameterize queries hoặc không validate đúng, attacker có thể inject SQL hoặc bypass TenantGuard để access cross-tenant data. |
| **Likelihood** | 2 (Thấp) — Prisma ORM tự parameterize, nhưng raw queries có thể bị bỏ qua                       |
| **Impact**   | 5 (Thảm họa) — Data breach, vi phạm tin tưởng, có thể phải đóng cửa                                |
| **Risk Score** | **10 – Cao (Cam)**                                                                                 |
| **Biện pháp giảm thiểu** | 1. Luôn dùng Prisma ORM, hạn chế $queryRaw. 2. TenantGuard mandatory trên tất cả admin routes. 3. Code review checklist có security items. 4. OWASP Top 10 review trước mỗi phase release. 5. Integration tests kiểm tra cross-tenant access. 6. Không expose shop_id trong URL cho public endpoints. |
| **Owner**    | Tech Lead, Backend Dev 1                                                                              |
| **Review Date** | Mỗi phase release                                                                                  |
| **Status**   | Mitigating                                                                                            |

---

#### R-S02: Cookie Hijacking / CSRF Attack

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-S02                                                                                                 |
| **Danh mục** | Security – Auth                                                                                       |
| **Mô tả**    | HttpOnly cookie chống XSS nhưng vẫn dễ bị CSRF nếu CSRF token không được validate đúng. Attacker có thể giả mạo request từ domain khác để thực hiện mutating operations. |
| **Likelihood** | 2 (Thấp) — CSRF double-submit đã được implement                                                  |
| **Impact**   | 4 (Lớn) — Tài khoản shop bị chiếm, dữ liệu bị xóa/thay đổi                                         |
| **Risk Score** | **8 – Trung bình (Vàng)**                                                                          |
| **Biện pháp giảm thiểu** | 1. X-CSRF-Token header required cho POST/PATCH/DELETE. 2. SameSite=Strict cho cookie. 3. CORS whitelist domains. 4. Penetration test CSRF trước launch. 5. Rotate CSRF token sau mỗi auth event. |
| **Owner**    | Backend Dev 2, Tech Lead                                                                              |
| **Review Date** | Mỗi phase release                                                                                  |
| **Status**   | Mitigating                                                                                            |

---

#### R-S03: Lộ Thông Tin Khách Hàng (PII Leak)

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-S03                                                                                                 |
| **Danh mục** | Security – Privacy                                                                                    |
| **Mô tả**    | Thông tin hội viên và pre-order có chứa PII (tên, SĐT, địa chỉ giao hàng). Nếu API không bảo vệ đúng hoặc logs lộ PII, có thể vi phạm quy định PDPA (Personal Data Protection). |
| **Likelihood** | 2 (Thấp)                                                                                          |
| **Impact**   | 4 (Lớn) — Vi phạm pháp lý, mất tin tưởng người dùng                                                 |
| **Risk Score** | **8 – Trung bình (Vàng)**                                                                          |
| **Biện pháp giảm thiểu** | 1. Không log PII trong structured logs. 2. Mask SĐT trong response (hiện 3 số cuối). 3. HTTPS everywhere — Cloudflare Tunnel enforce TLS. 4. Access control: shop_staff không xem được PII đầy đủ. 5. Privacy policy rõ ràng. 6. Data retention policy (xóa sau X năm). |
| **Owner**    | Tech Lead, PM                                                                                         |
| **Review Date** | Trước launch chính thức                                                                            |
| **Status**   | Mitigating                                                                                            |

---

### 3.4 Operational Risks

---

#### R-O01: Team Member Nghỉ Việc / Key Person Risk

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-O01                                                                                                 |
| **Danh mục** | Operational – People                                                                                  |
| **Mô tả**    | Nếu Tech Lead hoặc Backend Dev chính nghỉ việc giữa chừng, knowledge bị mất và có thể delay timeline đáng kể. Team nhỏ 10 người, mỗi người là key person cho domain của họ. |
| **Likelihood** | 2 (Thấp) — Dự án ngắn 8 tháng, nhưng không loại trừ                                             |
| **Impact**   | 4 (Lớn) — Delay 2–4 sprint để onboard người mới                                                      |
| **Risk Score** | **8 – Trung bình (Vàng)**                                                                          |
| **Biện pháp giảm thiểu** | 1. Code review bắt buộc — knowledge sharing liên tục. 2. Docs đầy đủ: CLAUDE.md, ARCHITECTURE.md, API_CONTRACT.md. 3. Pair programming cho critical modules. 4. Video recording cho complex logic. 5. Không để single person own toàn bộ module quan trọng. |
| **Owner**    | PM, Tech Lead                                                                                         |
| **Review Date** | Hàng tháng                                                                                         |
| **Status**   | Mitigating                                                                                            |

---

#### R-O02: Cloudflare Tunnel Downtime / Connectivity

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-O02                                                                                                 |
| **Danh mục** | Operational – Network                                                                                 |
| **Mô tả**    | Cloudflare Tunnel dùng để expose Raspberry Pi backend ra internet. Nếu tunnel down (ISP thay đổi IP, router reset, CF tunnel service lỗi), toàn bộ API không accessible. |
| **Likelihood** | 3 (Trung bình) — Tunnel restart vài lần/tháng là bình thường                                    |
| **Impact**   | 4 (Lớn) — API down trong thời gian khắc phục (15–60 phút)                                           |
| **Risk Score** | **12 – Cao (Cam)**                                                                                 |
| **Biện pháp giảm thiểu** | 1. Cloudflare Tunnel chạy dưới systemd service với restart=always. 2. Alert khi tunnel down (UptimeRobot). 3. Runbook rõ ràng: cách restart tunnel. 4. Chuẩn bị VPS fallback (có thể redirect trong 30 phút). 5. Trang maintenance page static trên Cloudflare Pages. |
| **Owner**    | DevOps                                                                                                |
| **Review Date** | Hàng tháng                                                                                         |
| **Status**   | Mitigating                                                                                            |

---

#### R-O03: Deployment Gây Ra Production Bug

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-O03                                                                                                 |
| **Danh mục** | Operational – Deployment                                                                              |
| **Mô tả**    | Không có staging environment giống production 100% có thể khiến deployment mang theo bug không phát hiện trong dev. Đặc biệt với Prisma migrations, nếu migration fail ở production thì rollback phức tạp. |
| **Likelihood** | 3 (Trung bình)                                                                                    |
| **Impact**   | 4 (Lớn) — Production down hoặc dữ liệu không nhất quán                                              |
| **Risk Score** | **12 – Cao (Cam)**                                                                                 |
| **Biện pháp giảm thiểu** | 1. Staging environment riêng biệt (Pi khác hoặc VPS nhỏ). 2. Prisma migrate deploy —schema-only trước, verify rồi mới deploy code. 3. Database backup trước mỗi migration. 4. Canary deployment nếu có thể. 5. Rollback runbook có sẵn. 6. E2E Playwright chạy trên staging trước khi promote lên prod. |
| **Owner**    | DevOps, Tech Lead                                                                                     |
| **Review Date** | Mỗi deployment                                                                                     |
| **Status**   | Mitigating                                                                                            |

---

#### R-O04: Burnout Trong Team Nhỏ

| Trường       | Nội dung                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------|
| **ID**       | R-O04                                                                                                 |
| **Danh mục** | Operational – People                                                                                  |
| **Mô tả**    | Team 10 người làm dự án 8 tháng với nhiều tính năng phức tạp. Nếu sprint velocity không được quản lý tốt, team có thể rơi vào tình trạng overtime và burnout, đặc biệt gần deadline Phase 3. |
| **Likelihood** | 3 (Trung bình)                                                                                    |
| **Impact**   | 3 (Trung bình) — Chất lượng code giảm, turnover tăng                                                 |
| **Risk Score** | **9 – Trung bình (Vàng)**                                                                          |
| **Biện pháp giảm thiểu** | 1. Velocity tracking — đừng commit quá 80% capacity. 2. Buffer 20% mỗi sprint cho bug fix và tech debt. 3. Sprint retrospective để phát hiện sớm dấu hiệu burnout. 4. Không làm thêm cuối tuần trừ trường hợp khẩn cấp. 5. Scope reduction là option hợp lệ nếu timeline nguy hiểm. |
| **Owner**    | PM                                                                                                    |
| **Review Date** | Hàng sprint                                                                                        |
| **Status**   | Open                                                                                                  |

---

## 4. Risk Heat Map

```
Impact
  5 |        | R-T01  |        | R-B01  |        |
    |        | R-T02  |        |        |        |
  4 |        |        | R-B02  |        | R-S01  |
    |        | R-O01  | R-O02  |        |        |
    |        |        | R-O03  |        |        |
  3 | R-T04  | R-B04  | R-T06  | R-B03  |        |
    |        |        | R-O04  | R-T05  |        |
    |        |        | R-S02  |        |        |
    |        |        | R-S03  |        |        |
  2 |        | R-T03  |        | R-B04  |        |
  1 |        |        |        |        |        |
    |--------|--------|--------|--------|--------|
         1        2       3        4        5   Likelihood

Legend: ■ Thấp (1-4)  ■ Trung bình (5-9)  ■ Cao (10-14)  ■ Rất cao (15-25)
```

---

## 5. Quy Trình Quản Lý Rủi Ro

### 5.1 Review Định Kỳ

| Tần suất   | Hoạt động                                                                  |
|------------|----------------------------------------------------------------------------|
| Hàng sprint | PM review tất cả risk score, cập nhật status                              |
| Hàng tháng  | Full team review, cập nhật mitigation actions                              |
| Mỗi phase   | Retrospective có risk component, thêm risks mới nếu cần                   |

### 5.2 Escalation Path

```
Risk phát sinh → PM ghi nhận trong 24h
→ Score 1-9 (Low/Medium): PM xử lý, báo cáo trong weekly status
→ Score 10-14 (High): PM + Tech Lead lập action plan trong 2 ngày
→ Score 15-25 (Critical): Escalate lên Sponsor trong 24h, họp khẩn
```

### 5.3 Risk Response Strategies

- **Avoid (Tránh):** Thay đổi kế hoạch để loại bỏ rủi ro.
- **Mitigate (Giảm thiểu):** Giảm likelihood hoặc impact.
- **Transfer (Chuyển giao):** Dùng bảo hiểm, SLA của vendor.
- **Accept (Chấp nhận):** Chấp nhận rủi ro, chuẩn bị contingency.

---

*Risk register này được cập nhật liên tục. Mọi thành viên team đều có trách nhiệm báo cáo rủi ro mới cho PM.*

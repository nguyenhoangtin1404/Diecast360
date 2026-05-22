---
version: "1.1"
created: "2026-05-22"
author: "Nguyễn Hoàng Tín – Project Manager"
status: "Active"
---

# Project Plan & Roadmap — Diecast360

## 1. Tổng Quan Roadmap

Dự án Diecast360 được chia thành **3 Phase chính**, mỗi phase gồm 6 sprint (2 tuần/sprint), tổng cộng 18 sprint trong 8 tháng (10/2025 – 05/2026).

```
Tháng:    Oct/2025   Nov/2025   Dec/2025   Jan/2026   Feb/2026   Mar/2026   Apr/2026   May/2026
          |----------|----------|----------|----------|----------|----------|----------|----------|
Phase 1:  ██████████ ██████████ ██████████
Phase 2:                        ░░░░░░░░░░ ██████████ ██████████ ██████████
Phase 3:                                              ░░░░░░░░░░ ██████████ ██████████ ██████████
Hardening:                                                                  ░░░░░░░░░░ ██████████
```

---

## 2. Phase 1 — Core MVP (Sprint 1–6, Tháng 10–12/2025)

### Mục tiêu Phase 1

Xây dựng nền tảng kỹ thuật vững chắc và triển khai đầy đủ chức năng quản lý item, hình ảnh, public catalog. Shop owner có thể bắt đầu vận hành thực tế sau khi kết thúc Phase 1.

### Sprint 1 — Foundation & Auth (01/10 – 14/10/2025)

**Mục tiêu:** Thiết lập hạ tầng dự án, hệ thống xác thực, và module đa tenant cơ bản.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Project setup | Monorepo pnpm, ESLint, Prettier, Husky hooks | Tech Lead, DevOps |
| NestJS boilerplate | Module structure, Config, Prisma setup | Backend Dev 1 |
| Prisma schema v1 | Users, Shops, Sessions, CSRF tokens | Backend Dev 1 |
| Auth module | Register, Login, Logout với HttpOnly cookie | Backend Dev 2 |
| JWT + CSRF | Double-submit CSRF token, refresh token | Backend Dev 2 |
| RBAC guard | platform_super, shop_admin, shop_staff | Backend Dev 1 |
| TenantGuard | active_shop_id context, cross-tenant isolation | Tech Lead |
| Vite + React setup | Router, TanStack Query, Tailwind CSS 3 | Frontend Dev 1 |
| Login page UI | Form, error states, cookie handling | Frontend Dev 2 |
| CI/CD pipeline | GitHub Actions: lint, type-check, test | DevOps |
| Dev environment | Docker Compose cho local PostgreSQL | DevOps |

**Verify:** `POST /auth/login` trả cookie HttpOnly, `GET /auth/me` trả đúng user+shop, CSRF header required trên POST.

---

### Sprint 2 — Item CRUD (15/10 – 28/10/2025)

**Mục tiêu:** Hoàn thiện CRUD Items với đầy đủ validation, multi-tenant isolation.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Prisma schema v2 | Items (name, brand, scale, year, status, quantity, price, shop_id) | Backend Dev 1 |
| Migration | Migration 001_items | Backend Dev 1 |
| Items module | Service, Controller, DTO (create/update/list) | Backend Dev 1, 2 |
| Item status | con_hang / giu_cho / da_ban, da_ban invariant (quantity=0) | Backend Dev 1 |
| Soft delete | deleted_at field, filter in all queries | Backend Dev 2 |
| Pagination | Cursor-based pagination cho list items | Backend Dev 2 |
| Search/filter | name, brand, status, year filters | Backend Dev 1 |
| Items list UI | Table, filter bar, pagination | Frontend Dev 1 |
| Create/Edit form | React Hook Form, validation | Frontend Dev 2 |
| UI/UX Design | Wireframe Admin Panel, Design system tokens | UI/UX |
| Unit tests | ItemsService unit tests | QA |

**Verify:** Tạo item trong shop A không hiện ở shop B. da_ban item không thể có quantity > 0.

---

### Sprint 3 — Image Upload & Storage (29/10 – 11/11/2025)

**Mục tiêu:** Upload ảnh sản phẩm, quản lý media với storage driver trừu tượng (local/R2).

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Prisma schema v3 | ItemImages (item_id, path, order, is_primary) | Backend Dev 2 |
| StorageService | Storage driver abstraction: local / Cloudflare R2 | Tech Lead |
| Upload endpoint | `POST /items/:id/images`, multipart/form-data, field `file` | Backend Dev 2 |
| Image processing | Resize, WebP conversion, thumbnail generation | Backend Dev 2 |
| Signed media URL | `GET /api/v1/media?d=...&s=...`, HMAC signed | Backend Dev 1 |
| R2 integration | SDK setup, bucket config, env vars | DevOps |
| Image reorder | PATCH /items/:id/images/reorder | Backend Dev 1 |
| Image delete | DELETE /items/:id/images/:imageId | Backend Dev 1 |
| Upload UI | Drag-drop, preview, reorder (dnd-kit) | Frontend Dev 1 |
| Image gallery | Item detail với ảnh chính và gallery | Frontend Dev 2 |
| E2E test | Upload, hiển thị, xóa ảnh | QA |

**Verify:** Upload 5 ảnh, reorder thành công, xóa 1 ảnh, signed URL expires sau timeout.

---

### Sprint 4 — Public Catalog (12/11 – 25/11/2025)

**Mục tiêu:** Ra mắt trang catalog công khai cho mỗi shop, không cần đăng nhập.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Public shop endpoint | `GET /api/v1/public/shops/:slug` | Backend Dev 1 |
| Public items endpoint | `GET /api/v1/public/shops/:slug/items` với filter, pagination | Backend Dev 1 |
| Public item detail | `GET /api/v1/public/shops/:slug/items/:id` | Backend Dev 2 |
| Tenant isolation | PUBLIC_SHOP_REQUIRED (422) cho anonymous requests | Backend Dev 2 |
| Inactive shop 404 | Shop không active trả 404 | Backend Dev 1 |
| Public catalog page | React route `/shop/:slug`, item grid | Frontend Dev 1 |
| Item detail page | Ảnh gallery, mô tả, giá, status badge | Frontend Dev 2 |
| SEO meta tags | og:image, og:title, description cho social sharing | Frontend Dev 1 |
| Search on catalog | Client-side filter + server-side search | Frontend Dev 2 |
| UI/UX polish | Mobile responsive, loading states, empty states | UI/UX |
| Performance | Image lazy loading, Cloudflare cache headers | DevOps |

**Verify:** Truy cập `/shop/test-shop` không cần đăng nhập, items của shop A không lọt vào shop B.

---

### Sprint 5 — Polish & Testing (26/11 – 09/12/2025)

**Mục tiêu:** Hoàn thiện chất lượng, viết E2E tests, chuẩn bị demo Phase 1.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| E2E test suite | Playwright: auth flows, item CRUD, image upload, public catalog | QA |
| Error handling | Global exception filter, error envelope chuẩn | Backend Dev 1 |
| Validation | Class-validator DTOs cho tất cả endpoints | Backend Dev 2 |
| Rate limiting | ThrottlerModule cho public endpoints | Backend Dev 1 |
| Logging | Structured logging (Winston), request IDs | Tech Lead |
| Admin dashboard | Dashboard tổng quan: item counts, recent activity | Frontend Dev 1 |
| Notification UI | Toast notifications, loading spinners | Frontend Dev 2 |
| Accessibility | aria-label, keyboard navigation, color contrast | UI/UX |
| Bug fixes | Triage và fix bugs từ QA | Cả team |
| Documentation | API docs, Swagger UI | Backend Dev 2 |

**Verify:** 53 Playwright E2E tests pass, Swagger UI accessible tại `/api`.

---

### Sprint 6 — Phase 1 Release & Hardening (10/12 – 31/12/2025)

**Mục tiêu:** Deploy production, onboard 1 shop thật, retrospective Phase 1.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Production deployment | Backend Raspberry Pi + Cloudflare Tunnel | DevOps |
| Neon DB migration | Schema apply trên production DB | DevOps, Backend Dev 1 |
| Cloudflare Pages deploy | Frontend build + deploy | DevOps |
| R2 setup production | Bucket, CORS, public domain | DevOps |
| Shop onboarding | Tạo tài khoản shop thật, nhập dữ liệu mẫu | PM, BA/PO |
| Monitoring setup | UptimeRobot, Cloudflare Analytics | DevOps |
| User training | Training session cho shop admin | PM, BA/PO |
| Phase 1 retrospective | Team retrospective, lessons learned | PM |
| Backlog refinement | Groom Phase 2 backlog | PM, BA/PO, Tech Lead |

**Verify:** Shop thật truy cập được admin panel, catalog public hoạt động, CI/CD pipeline green.

---

## 3. Phase 2 — Commerce & Community (Sprint 7–12, Tháng 1–3/2026)

### Mục tiêu Phase 2

Triển khai đầy đủ hệ sinh thái thương mại: pre-order lifecycle, quản lý kho, hội viên loyalty points, và báo cáo doanh thu.

### Sprint 7 — Pre-Order Core (01/01 – 14/01/2026)

**Mục tiêu:** Xây dựng state machine pre-order và public pre-order form.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Prisma schema v4 | PreOrders, PreOrderItems, customers info | Backend Dev 1 |
| Pre-order state machine | PENDING_CONFIRMATION → WAITING_FOR_GOODS → ARRIVED → PAID | Backend Dev 1 |
| Terminal states | CANCELLED, REFUNDED — không thể transition tiếp | Backend Dev 1 |
| Admin pre-order API | CRUD, status transition, list với filter | Backend Dev 2 |
| Public pre-order API | `POST /public/shops/:slug/pre-orders` | Backend Dev 2 |
| Pre-order lookup | `GET /public/pre-orders/:code` — tra cứu bằng mã đơn | Backend Dev 1 |
| Admin pre-order UI | Danh sách, filter theo status, detail view | Frontend Dev 1 |
| Status transition UI | Button chuyển trạng thái với confirm dialog | Frontend Dev 2 |
| Public pre-order form | Form đặt hàng, chọn item, nhập thông tin | Frontend Dev 1 |
| Pre-order lookup page | Trang tra cứu trạng thái đơn hàng | Frontend Dev 2 |
| Unit tests | Pre-order state machine unit tests | QA |

**Verify:** Không thể transition từ PAID → WAITING_FOR_GOODS. REFUNDED là terminal. Member FK RESTRICT hoạt động.

---

### Sprint 8 — Inventory Ledger (15/01 – 28/01/2026)

**Mục tiêu:** Quản lý kho theo ledger transaction, audit trail đầy đủ.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Prisma schema v5 | InventoryTransactions (type, quantity, reference, notes) | Backend Dev 2 |
| Transaction types | stock_in / stock_out / adjustment | Backend Dev 2 |
| Inventory service | Tính toán quantity từ ledger, không lưu trực tiếp | Backend Dev 1 |
| Auto stock_out | Khi pre-order chuyển sang PAID, tự tạo stock_out | Backend Dev 1 |
| Inventory API | List transactions, summary, adjust | Backend Dev 2 |
| Inventory UI | Transaction log, filter, tạo adjustment | Frontend Dev 2 |
| Item quantity display | Hiển thị quantity tính từ ledger | Frontend Dev 1 |
| Inventory report | Chart inventory trends theo thời gian | Frontend Dev 1 |
| Low stock alert | Cảnh báo khi quantity < threshold | Backend Dev 2 |
| E2E inventory | Test flow stock_in → pre-order → stock_out | QA |

**Verify:** Tổng quantity = sum(stock_in) - sum(stock_out + adjustment_out). Ledger không thể xóa.

---

### Sprint 9 — Members & Registration (29/01 – 11/02/2026)

**Mục tiêu:** Hệ thống hội viên với đăng ký, tra cứu, và tầng thành viên.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Prisma schema v6 | Members (name, phone, email, tier, points_balance, shop_id) | Backend Dev 1 |
| Member tiers | Bronze (0–999), Silver (1000–4999), Gold (5000+) | Backend Dev 1 |
| Member CRUD API | Create, Read, Update, soft delete | Backend Dev 1 |
| Member FK RESTRICT | Không xóa member có active pre-orders | Backend Dev 1 |
| Member search | Search by name, phone | Backend Dev 2 |
| Public member register | Form đăng ký hội viên trên public site | Backend Dev 2 |
| Members list UI | Table với tier badge, search | Frontend Dev 1 |
| Member detail UI | Profile, points history, pre-order history | Frontend Dev 2 |
| Register form UI | Public registration form | Frontend Dev 1 |
| Member card design | Thiết kế thẻ hội viên digital | UI/UX |

**Verify:** Không thể xóa member có pre-order PENDING_CONFIRMATION. Tier upgrade tự động khi điểm đủ.

---

### Sprint 10 — Points Ledger (12/02 – 25/02/2026)

**Mục tiêu:** Hệ thống tích lũy và đổi điểm thưởng với ledger audit trail.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Prisma schema v7 | MemberPointsLedger (member_id, delta, reason, reference_type, reference_id) | Backend Dev 2 |
| Points service | Không mutate points_balance trực tiếp — chỉ qua ledger | Backend Dev 2 |
| Auto earn on PAID | Pre-order PAID → tự tạo ledger entry earn points | Backend Dev 1 |
| Redeem points API | POST /members/:id/points/redeem | Backend Dev 2 |
| Points history API | GET /members/:id/points/history | Backend Dev 1 |
| Tier upgrade logic | Auto-upgrade khi balance vượt ngưỡng | Backend Dev 1 |
| Tier downgrade | Không auto-downgrade (chỉ manual) | Backend Dev 1 |
| Points UI | Hiển thị balance, history, redeem form | Frontend Dev 2 |
| Points on pre-order | Hiển thị điểm sẽ earn khi checkout | Frontend Dev 1 |
| Points report | Dashboard điểm theo tháng | Frontend Dev 1 |

**Verify:** points_balance = sum(delta) từ ledger. Redeem không được để balance âm. Tier upgrade xảy ra khi cross threshold.

---

### Sprint 11 — Reports & Analytics (26/02 – 11/03/2026)

**Mục tiêu:** Báo cáo doanh thu, kho, pre-order cho shop admin.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Revenue report API | Tổng doanh thu theo ngày/tuần/tháng từ PAID pre-orders | Backend Dev 1 |
| Inventory trend API | Biến động kho theo thời gian | Backend Dev 2 |
| Pre-order summary | Số đơn theo status, conversion rate | Backend Dev 1 |
| Member summary | Tổng member, tier distribution, points issued | Backend Dev 2 |
| Dashboard UI | Tổng quan với charts (Recharts/Chart.js) | Frontend Dev 1, 2 |
| Revenue chart | Line chart doanh thu theo thời gian | Frontend Dev 1 |
| Inventory chart | Bar chart biến động kho | Frontend Dev 2 |
| Pre-order funnel | Funnel chart theo status | Frontend Dev 1 |
| Export CSV | Export báo cáo ra CSV | Backend Dev 2 |
| Date range picker | Filter theo khoảng thời gian | Frontend Dev 2 |

**Verify:** Revenue = sum(pre-orders PAID) trong khoảng thời gian. CSV export đúng dữ liệu.

---

### Sprint 12 — Phase 2 Release (12/03 – 31/03/2026)

**Mục tiêu:** Ổn định Phase 2, demo với shop thật, thu thập feedback.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Bug fix sprint | Triage và fix tất cả P1/P2 bugs | Cả team |
| Performance tuning | Query optimization, index review | Backend Dev 1, Tech Lead |
| E2E test update | Cập nhật Playwright cho Phase 2 features | QA |
| User training v2 | Training pre-order, kho, hội viên | PM, BA/PO |
| Shop feedback | Thu thập feedback từ shop thật | PM, BA/PO |
| Phase 2 retro | Team retrospective | PM |
| Phase 3 planning | Sprint planning Phase 3 | PM, BA/PO, Tech Lead |

---

## 4. Phase 3 — AI & Social (Sprint 13–18, Tháng 3–5/2026)

### Mục tiêu Phase 3

Tích hợp AI (Claude API) để tự động hóa nội dung, và Facebook Graph API để hỗ trợ social selling. Thêm SpinSet 360° viewer.

### Sprint 13 — SpinSet 360° (01/04 – 14/04/2026)

**Mục tiêu:** Upload và hiển thị viewer 360° cho mô hình xe.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Prisma schema v8 | SpinSets, SpinFrames (spin_set_id, frame_index, path) | Backend Dev 1 |
| SpinSet CRUD | Create SpinSet gắn với Item | Backend Dev 1 |
| Frame upload | POST /spin-sets/:id/frames, field `frame`, 24-48 frames | Backend Dev 2 |
| Frame unique constraint | (spin_set_id, frame_index) unique | Backend Dev 2 |
| Frame reorder | PATCH /spin-sets/:id/frames/reorder | Backend Dev 1 |
| Max frames validation | VITE_MAX_SPINNER_FRAMES env, error khi vượt | Backend Dev 2 |
| SpinViewer component | React component: drag-to-spin, touch support | Frontend Dev 1 |
| Upload UI | Multi-file upload, progress, preview frames | Frontend Dev 2 |
| Frame reorder UI | Drag-drop reorder với visual preview | Frontend Dev 1 |
| Public SpinViewer | Nhúng viewer vào public item detail | Frontend Dev 2 |
| E2E SpinSet | Test upload 24 frames, reorder, xóa | QA |

**Verify:** Upload 24 frames thành công. Reorder frame 1↔24 hoạt động. Unique constraint không vi phạm.

---

### Sprint 14 — AI Description (15/04 – 28/04/2026)

**Mục tiêu:** Tích hợp Claude API để tự động tạo mô tả sản phẩm.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Claude API setup | SDK, API key management, prompt engineering | Tech Lead |
| AI service module | AIService với rate limiting, error handling | Backend Dev 1 |
| Generate description | POST /items/:id/ai/description — gửi item metadata → nhận mô tả | Backend Dev 1 |
| Prompt template | Template tối ưu cho mô hình xe diecast (scale, brand, năm...) | BA/PO, Backend Dev 1 |
| Retry & fallback | Retry 3 lần, fallback về template rỗng | Backend Dev 1 |
| Usage tracking | Log AI API calls, cost tracking | Backend Dev 2 |
| AI button UI | "Tạo mô tả bằng AI" button trong item form | Frontend Dev 2 |
| Preview & edit | Hiển thị AI result, cho phép edit trước khi save | Frontend Dev 2 |
| Tone selector | Chọn tone: formal / casual / marketing | Frontend Dev 1 |
| Cost display | Hiển thị estimate cost cho admin | Frontend Dev 1 |

**Verify:** AI call thành công ≥ 95%. Mô tả sinh ra phù hợp với metadata item.

---

### Sprint 15 — AI Image Analysis (29/04 – 12/05/2026)

**Mục tiêu:** AI phân tích ảnh sản phẩm và tạo draft item tự động.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Vision API integration | Claude vision API, multi-image support | Backend Dev 1 |
| Analyze image endpoint | POST /items/ai/analyze-image — upload ảnh → nhận draft | Backend Dev 1 |
| Draft extraction | Extract: brand, scale, year, color, mô tả từ ảnh | Backend Dev 1 |
| Confidence scoring | Mỗi field có confidence score | Backend Dev 2 |
| Draft to item | Tự động điền form từ AI draft | Frontend Dev 1 |
| Low confidence highlight | Highlight field có confidence < 70% | Frontend Dev 1 |
| Manual override | Cho phép sửa tất cả fields trước khi save | Frontend Dev 2 |
| Batch analyze | Phân tích nhiều ảnh cùng lúc | Backend Dev 2 |
| Accuracy tracking | Log accuracy rate để improve prompt | Backend Dev 2 |

**Verify:** Từ ảnh Hot Wheels, AI nhận ra đúng brand, scale, màu sắc với accuracy ≥ 80%.

---

### Sprint 16 — Facebook Integration (13/05 – 26/05/2026)

**Mục tiêu:** Tích hợp Facebook Graph API để đăng bài và copy caption.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Facebook OAuth | Shop admin kết nối Facebook account | Backend Dev 2 |
| Graph API service | FacebookService: post photo, get pages | Backend Dev 2 |
| Caption generator | Tạo caption dựa trên item metadata + AI | Backend Dev 1 |
| Post to Facebook | POST /items/:id/facebook/post — đăng bài với ảnh | Backend Dev 2 |
| Copy caption | GET /items/:id/facebook/caption — trả caption text | Backend Dev 1 |
| Page selector | Chọn Facebook Page để đăng | Frontend Dev 1 |
| Caption preview | Preview caption + chỉnh sửa trước khi đăng | Frontend Dev 2 |
| Post status | Theo dõi trạng thái bài đăng | Frontend Dev 1 |
| Disconnect FB | Revoke token, ngắt kết nối | Backend Dev 2 |
| Rate limit handling | Facebook API rate limit, queue system | Backend Dev 1 |

**Verify:** Đăng bài thành công lên Facebook Page, ảnh kèm caption hiển thị đúng.

---

### Sprint 17 — Integration & Polish (27/05 – 10/06/2026)

**Mục tiêu:** Tích hợp toàn bộ features, polish UX, performance optimization.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| End-to-end integration | Test toàn bộ user flow từ đăng item → AI → Facebook → pre-order | QA |
| Performance audit | Lighthouse audit, Core Web Vitals | Frontend Dev 1, DevOps |
| DB query optimization | EXPLAIN ANALYZE, thêm indexes | Backend Dev 1, Tech Lead |
| Security review | OWASP checklist, penetration testing nhẹ | Tech Lead, DevOps |
| UX polish | Animation, micro-interactions, loading states | UI/UX, Frontend Dev 2 |
| Mobile responsive | Kiểm tra toàn bộ flow trên mobile | QA |
| Documentation update | API docs, user guide, CLAUDE.md | BA/PO, Backend Dev 2 |
| Error monitoring | Sentry hoặc tương đương | DevOps |

---

### Sprint 18 — Launch Preparation (11/05 – 31/05/2026)

**Mục tiêu:** Chuẩn bị chính thức ra mắt, onboard thêm shops, bàn giao tài liệu.

**Deliverables:**

| Hạng mục | Chi tiết | Thành viên |
|----------|----------|------------|
| Production deployment | Full production deploy với tất cả features | DevOps |
| Load testing | Test với 50 concurrent users | QA, DevOps |
| Backup & recovery test | Test restore từ Neon backup | DevOps |
| Shop onboarding x5 | Onboard 5 shop thật | PM, BA/PO |
| Training materials | Video tutorial, user guide PDF | BA/PO, UI/UX |
| Handover docs | Technical runbook, deployment guide | Tech Lead, DevOps |
| Final retrospective | Team retrospective dự án | PM |
| Launch announcement | Thông báo ra mắt chính thức | PM, Platform Owner |

---

## 5. Gantt Chart — Tổng Quan

```
SPRINT   | THÁNG         | PHASE 1         | PHASE 2         | PHASE 3         |
---------|---------------|-----------------|-----------------|-----------------|
S01      | Oct W1-W2     | Foundation/Auth |                 |                 |
S02      | Oct W3-W4     | Item CRUD       |                 |                 |
S03      | Nov W1-W2     | Image Upload    |                 |                 |
S04      | Nov W3-W4     | Public Catalog  |                 |                 |
S05      | Dec W1-W2     | Polish/Testing  |                 |                 |
S06      | Dec W3-W4     | P1 Release      |                 |                 |
---------|---------------|-----------------|-----------------|-----------------|
S07      | Jan W1-W2     |                 | Pre-Order Core  |                 |
S08      | Jan W3-W4     |                 | Inventory Ledger|                 |
S09      | Feb W1-W2     |                 | Members/Reg     |                 |
S10      | Feb W3-W4     |                 | Points Ledger   |                 |
S11      | Mar W1-W2     |                 | Reports/Analytics|                |
S12      | Mar W3-W4     |                 | P2 Release      |                 |
---------|---------------|-----------------|-----------------|-----------------|
S13      | Apr W1-W2     |                 |                 | SpinSet 360°    |
S14      | Apr W3-W4     |                 |                 | AI Description  |
S15      | May W1-W2     |                 |                 | AI Image        |
S16      | May W3-W4     |                 |                 | Facebook Int.   |
S17      | Jun W1-W2     |                 |                 | Integration     |
S18      | Jun W3-W4     |                 |                 | Launch Prep     |
```

---

## 6. Dependencies & Ràng Buộc Kỹ Thuật

### 6.1 Dependencies Giữa Các Sprint

```
S01 (Auth) → S02 (Items) → S03 (Images) → S04 (Catalog)
S04 (Catalog) → S07 (Pre-order public)
S07 (Pre-order) → S08 (Inventory) — stock_out khi PAID
S09 (Members) → S10 (Points) — MemberPointsLedger phụ thuộc Members
S03 (Images) → S13 (SpinSet) — cùng StorageService, signed URL
S02 (Items) → S14 (AI Description) — cần item metadata
S03 (Images) → S15 (AI Image) — cần image upload
S14 (AI) → S16 (Facebook) — caption dùng AI
```

### 6.2 Dependencies Kỹ Thuật Bên Ngoài

| Phụ thuộc             | Sprint đầu dùng | Rủi ro              | Backup Plan                    |
|-----------------------|-----------------|---------------------|--------------------------------|
| Neon PostgreSQL       | S01             | Service outage      | Local PostgreSQL fallback      |
| Cloudflare R2         | S03             | API change          | Local storage driver           |
| Cloudflare Pages      | S06             | Build failure       | Deploy trên VPS fallback       |
| Claude API            | S14             | Rate limit, cost    | Template-based fallback        |
| Facebook Graph API    | S16             | Policy change       | Manual copy-paste caption      |
| Cloudflare Tunnel     | S06             | Tunnel instability  | Direct IP + DynDNS             |

### 6.3 Team Allocation Per Phase

| Vai trò          | Phase 1 (S1-6) | Phase 2 (S7-12) | Phase 3 (S13-18) |
|------------------|----------------|-----------------|------------------|
| PM               | 100%           | 100%            | 100%             |
| Tech Lead        | 60%            | 40%             | 70%              |
| Backend Dev 1    | 100%           | 100%            | 100%             |
| Backend Dev 2    | 100%           | 100%            | 100%             |
| Frontend Dev 1   | 80%            | 100%            | 100%             |
| Frontend Dev 2   | 80%            | 100%            | 100%             |
| UI/UX            | 100%           | 60%             | 80%              |
| QA               | 80%            | 100%            | 100%             |
| BA/PO            | 100%           | 100%            | 80%              |
| DevOps           | 60%            | 40%             | 60%              |

---

## 7. Definition of Done

Một user story/task được coi là DONE khi:

1. **Code complete:** tất cả code đã được viết và push lên branch feature.
2. **Code review:** ít nhất 1 peer review (Tech Lead hoặc peer) đã approve.
3. **Tests pass:** unit tests pass, E2E tests liên quan pass.
4. **No new lint errors:** `pnpm lint` không có lỗi mới.
5. **API documented:** endpoint mới có trong Swagger và `docs/API_CONTRACT.md`.
6. **Domain changes documented:** thay đổi nghiệp vụ có trong `docs/DOMAIN.md`.
7. **QA sign-off:** QA đã kiểm tra trên staging environment.
8. **Merged to main:** feature branch đã merge vào `main`.
9. **Deployed to staging:** tự động deploy qua GitHub Actions.

---

*Roadmap này được review và cập nhật vào cuối mỗi Phase. Các thay đổi phải được PM và Tech Lead phê duyệt.*

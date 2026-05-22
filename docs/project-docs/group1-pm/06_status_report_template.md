---
version: "1.0"
created: "2026-05-22"
author: "Nguyễn Hoàng Tín – Project Manager"
status: "Template – Active"
---

# Weekly Status Report Template — Diecast360

## Hướng Dẫn Sử Dụng

Status Report được PM gửi **mỗi thứ Sáu lúc 17:00** cho Sponsor và các stakeholders chính. Lưu file với tên: `YYYYMMDD_weekly_status_report.md` (ví dụ: `20260117_weekly_status_report.md`).

**Phân phối:** Platform Owner (Sponsor), Tech Lead, BA/PO, và team trưởng.

**Mã màu RAG:**
- **GREEN (Xanh):** Mọi thứ on-track, không có vấn đề đáng lo ngại.
- **AMBER (Vàng):** Có rủi ro hoặc vấn đề nhưng vẫn trong tầm kiểm soát, cần theo dõi.
- **RED (Đỏ):** Vấn đề nghiêm trọng ảnh hưởng milestone hoặc cần hành động khẩn cấp.

---

## Section 1: Blank Template

```
---
# WEEKLY STATUS REPORT — DIECAST360
---

## Header

| Trường              | Nội dung                        |
|---------------------|---------------------------------|
| Dự án               | Diecast360                      |
| Tuần                | Tuần X (DD/MM – DD/MM/YYYY)     |
| Sprint hiện tại     | Sprint X – Phase Y              |
| Ngày báo cáo        | DD/MM/YYYY                      |
| Tác giả             | [Tên PM]                        |
| Phân phối           | [Danh sách người nhận]          |

---

## 1. Tổng Quan Trạng Thái (Overall Status)

| Hạng mục                | Trạng thái | Ghi chú                        |
|-------------------------|------------|--------------------------------|
| **Tiến độ tổng thể**    | 🟢 GREEN / 🟡 AMBER / 🔴 RED | [Mô tả ngắn] |
| **Phạm vi (Scope)**     | 🟢 / 🟡 / 🔴 | [Mô tả ngắn]                  |
| **Chất lượng (Quality)**| 🟢 / 🟡 / 🔴 | [Mô tả ngắn]                  |
| **Rủi ro (Risk)**       | 🟢 / 🟡 / 🔴 | [Mô tả ngắn]                  |
| **Ngân sách (Budget)**  | 🟢 / 🟡 / 🔴 | [Mô tả ngắn]                  |
| **Team & Resources**    | 🟢 / 🟡 / 🔴 | [Mô tả ngắn]                  |

**Nhận xét tổng quan (2–3 câu):**
[Tóm tắt ngắn gọn tình trạng dự án tuần này.]

---

## 2. Tiến Độ Sprint

| Chỉ số                    | Tuần này      | Mục tiêu sprint |
|---------------------------|---------------|-----------------|
| Story Points đã hoàn thành | X SP          | Y SP            |
| Story Points còn lại       | Z SP          | –               |
| % Sprint hoàn thành        | X%            | Ngày DD/MM      |
| Số ngày còn lại sprint     | X ngày        | –               |
| Velocity trung bình (3 sprint) | X SP/sprint | –              |

**Burndown trend:** [Trên track / Phía sau kế hoạch / Phía trước kế hoạch]

### User Stories Status

| Story ID | Tên Story                    | SP | Người nhận   | Trạng thái       |
|----------|------------------------------|-----|-------------|-----------------|
| US-X.1   | [Tên]                        | X   | [Tên]       | Done / In Progress / Not Started / Blocked |
| US-X.2   | [Tên]                        | X   | [Tên]       | ...             |

---

## 3. Thành Tựu Tuần Này (Key Accomplishments)

- [ ] [Mô tả thành tựu 1 — cụ thể, có thể đo lường]
- [ ] [Mô tả thành tựu 2]
- [ ] [Mô tả thành tựu 3]
- [ ] [Mô tả thành tựu 4]

---

## 4. Kế Hoạch Tuần Tới

| Ưu tiên | Công việc                              | Người thực hiện | Deadline     |
|---------|----------------------------------------|-----------------|--------------|
| P1      | [Mô tả]                                | [Tên]           | [DD/MM/YYYY] |
| P1      | [Mô tả]                                | [Tên]           | [DD/MM/YYYY] |
| P2      | [Mô tả]                                | [Tên]           | [DD/MM/YYYY] |
| P3      | [Mô tả]                                | [Tên]           | [DD/MM/YYYY] |

---

## 5. Rủi Ro & Vấn Đề

### 5.1 Rủi Ro Mới / Cập Nhật

| Risk ID | Mô tả rủi ro             | Likelihood | Impact | Score | Trạng thái | Hành động |
|---------|--------------------------|------------|--------|-------|------------|-----------|
| R-XXX   | [Mô tả]                  | X/5        | X/5    | XX    | New/Updated| [Action]  |

### 5.2 Issues / Blockers Đang Mở

| Issue ID | Mô tả vấn đề             | Ảnh hưởng        | Người xử lý | Deadline     | Trạng thái |
|----------|--------------------------|------------------|-------------|--------------|------------|
| I-XXX    | [Mô tả]                  | [Sprint / Story] | [Tên]       | [DD/MM/YYYY] | Open       |

### 5.3 Issues Đã Giải Quyết Trong Tuần

| Issue ID | Mô tả vấn đề             | Giải pháp        | Người giải quyết |
|----------|--------------------------|------------------|------------------|
| I-XXX    | [Mô tả]                  | [Giải pháp]      | [Tên]            |

---

## 6. Metrics Kỹ Thuật

| Metric                          | Tuần này        | Mục tiêu       | Trend        |
|---------------------------------|-----------------|----------------|--------------|
| API Uptime (8h–22h)             | X.XX%           | ≥ 99%          | ↑ / → / ↓   |
| API Response Time p95           | XXXms           | < 300ms        | ↑ / → / ↓   |
| E2E Tests Pass Rate             | XX/53 (XX%)     | 100%           | ↑ / → / ↓   |
| Open Bugs (P1)                  | X               | 0              | ↑ / → / ↓   |
| Open Bugs (P2)                  | X               | < 5            | ↑ / → / ↓   |
| Open Bugs (P3)                  | X               | < 15           | ↑ / → / ↓   |
| Code Coverage (Backend)         | XX%             | ≥ 70%          | ↑ / → / ↓   |
| Build Success Rate              | XX%             | ≥ 95%          | ↑ / → / ↓   |
| Deployments this week           | X               | ≥ 2/sprint     | –            |

---

## 7. Milestone Tracker

| Milestone                         | Deadline    | Trạng thái           | % hoàn thành |
|-----------------------------------|-------------|----------------------|--------------|
| M1 – Phase 1 MVP                  | 31/12/2025  | Completed / On Track / At Risk | XX% |
| M2 – Phase 2 Commerce             | 31/03/2026  | On Track / At Risk   | XX%          |
| M3 – Phase 3 AI & Social          | 31/05/2026  | On Track             | XX%          |
| M4 – Production Hardening         | 31/05/2026  | Not Started          | XX%          |
| M5 – Official Launch              | 30/06/2026  | Not Started          | 0%           |

---

## 8. Quyết Định Cần Phê Duyệt (Pending Decisions)

| #   | Quyết định cần                      | Người quyết định | Deadline     |
|-----|-------------------------------------|-----------------|--------------|
| 1   | [Mô tả quyết định]                  | [Tên/Role]      | [DD/MM/YYYY] |

---

## 9. Ghi Chú Bổ Sung

[Bất kỳ thông tin nào không thuộc các mục trên mà stakeholders cần biết.]

---

*Báo cáo này được gửi tự động lúc 17:00 thứ Sáu. Mọi phản hồi gửi về: [email PM]*
```

---

## Section 2: Ví Dụ Điền Sẵn — Tuần 3 Sprint 7

---

# WEEKLY STATUS REPORT — DIECAST360

## Header

| Trường              | Nội dung                                                           |
|---------------------|--------------------------------------------------------------------|
| Dự án               | Diecast360                                                         |
| Tuần                | Tuần 3 Sprint 7 (12/01 – 16/01/2026)                              |
| Sprint hiện tại     | Sprint 7 – Phase 2 (Commerce & Community)                          |
| Ngày báo cáo        | 16/01/2026                                                         |
| Tác giả             | Nguyễn Hoàng Tín – PM                                             |
| Phân phối           | Platform Owner, Lê Minh Tuấn (TL), Trần Thị Minh (PO), All Team  |

---

## 1. Tổng Quan Trạng Thái (Overall Status)

| Hạng mục                | Trạng thái  | Ghi chú                                                             |
|-------------------------|-------------|---------------------------------------------------------------------|
| **Tiến độ tổng thể**    | 🟡 AMBER    | Pre-order state machine delay 2 ngày do phức tạp hơn dự kiến       |
| **Phạm vi (Scope)**     | 🟢 GREEN    | Không có thay đổi scope, các stories vẫn trong kế hoạch             |
| **Chất lượng (Quality)**| 🟢 GREEN    | E2E tests pass rate 53/53, không có P1 bug mới                     |
| **Rủi ro (Risk)**       | 🟡 AMBER    | R-O02 (Cloudflare Tunnel) xảy ra 1 lần, đã xử lý trong 20 phút    |
| **Ngân sách (Budget)**  | 🟢 GREEN    | Hạ tầng tháng 1: 1.520.000 VNĐ, trong ngân sách                    |
| **Team & Resources**    | 🟡 AMBER    | Huỳnh Thị Kim (UX) vắng 3/5 ngày do bệnh, công việc UI bị ảnh hưởng |

**Nhận xét tổng quan:**
Sprint 7 đang ở ngày 11/14 với 38/47 SP hoàn thành (81%). Pre-order state machine service đã hoàn thành nhưng cần thêm 1 ngày để viết đủ unit tests. Dự kiến đóng sprint đúng hạn 14/01 nhưng có thể carry-over 3 SP unit tests sang Sprint 8 nếu cần. Team đang nỗ lực good và morale tốt sau kỳ nghỉ Tết dương lịch.

---

## 2. Tiến Độ Sprint

| Chỉ số                    | Tuần này       | Mục tiêu sprint   |
|---------------------------|----------------|-------------------|
| Story Points đã hoàn thành | 38 SP         | 47 SP             |
| Story Points còn lại       | 9 SP          | Deadline: 14/01   |
| % Sprint hoàn thành        | 81%           | –                 |
| Số ngày còn lại sprint     | 2 ngày        | –                 |
| Velocity trung bình (3 sprint) | 43 SP/sprint | –               |

**Burndown trend:** Phía sau kế hoạch nhẹ (2 ngày delay trên state machine), nhưng vẫn trong khả năng phục hồi.

### User Stories Status

| Story ID | Tên Story                                  | SP | Người nhận      | Trạng thái     |
|----------|--------------------------------------------|-----|-----------------|----------------|
| US-7.1   | Prisma schema PreOrders + migration        | 3   | Phạm Văn Đức   | Done           |
| US-7.2   | Pre-order state machine service             | 8   | Phạm Văn Đức   | Done           |
| US-7.3   | Admin pre-order CRUD API                   | 5   | Ngô Thị Hoa    | Done           |
| US-7.4   | Public pre-order submit API                 | 5   | Ngô Thị Hoa    | Done           |
| US-7.5   | Pre-order lookup by code API               | 2   | Phạm Văn Đức   | Done           |
| US-7.6   | Admin pre-order list + filter UI           | 5   | Trần Quốc Bảo  | Done           |
| US-7.7   | Status transition UI + confirm dialog       | 5   | Đỗ Lan Phương  | In Progress (80%) |
| US-7.8   | Public pre-order form                       | 5   | Trần Quốc Bảo  | In Progress (60%) |
| US-7.9   | Pre-order lookup page (public)             | 3   | Đỗ Lan Phương  | Not Started    |
| US-7.10  | Unit tests (state machine)                 | 3   | Vũ Minh Quang  | In Progress (40%) |
| Carry-over | Swagger docs                              | 3   | Phạm Văn Đức   | Done           |

---

## 3. Thành Tựu Tuần Này (Key Accomplishments)

- **Pre-order state machine hoàn thành:** Service đã implement đủ 5 trạng thái và 7 transitions, FK RESTRICT check hoạt động. Code reviewed bởi Tech Lead.
- **Database migration deploy staging:** PreOrders schema đã apply trên staging environment, không có lỗi.
- **Public pre-order API live trên staging:** `POST /api/v1/public/shops/:slug/pre-orders` và lookup endpoint đã có thể test.
- **Admin pre-order list UI merge:** PR #178 merged, filter theo status hoạt động đúng với TanStack Query cache.
- **Swagger docs catch-up:** Carry-over từ Sprint 6 đã hoàn thành, Swagger UI cập nhật đầy đủ pre-order endpoints.
- **Cloudflare Tunnel incident xử lý:** Tunnel down 08/01 lúc 14:30, phục hồi sau 20 phút bằng systemd restart, không ảnh hưởng tới shop beta.

---

## 4. Kế Hoạch Tuần Tới (Sprint 8 – Inventory Ledger)

| Ưu tiên | Công việc                                                     | Người thực hiện   | Deadline     |
|---------|---------------------------------------------------------------|-------------------|--------------|
| P1      | Finalize Sprint 7: complete US-7.7, 7.8, 7.9, 7.10           | FE1, FE2, QA      | 14/01/2026   |
| P1      | Sprint 8 Planning meeting                                     | All team          | 15/01/2026   |
| P1      | Prisma schema v5: InventoryTransactions migration             | Backend Dev 2     | 17/01/2026   |
| P1      | InventoryService thiết kế (ledger pattern, không lưu quantity) | BE1, TL           | 17/01/2026   |
| P2      | Test US-7.7, 7.8 trên staging sau khi merge                  | QA                | 14/01/2026   |
| P2      | Huỳnh Thị Kim review UI pre-order sau khi bình phục           | UX, FE1, FE2      | 16/01/2026   |
| P3      | Cập nhật DOMAIN.md với pre-order state machine final          | BA/PO             | 15/01/2026   |

---

## 5. Rủi Ro & Vấn Đề

### 5.1 Rủi Ro Cập Nhật

| Risk ID | Mô tả rủi ro                          | Likelihood | Impact | Score | Trạng thái | Hành động              |
|---------|---------------------------------------|------------|--------|-------|------------|------------------------|
| R-O02   | Cloudflare Tunnel downtime            | 4/5        | 4/5    | 16    | Mitigating | Đã add cron restart hàng đêm, uptime alert configured |
| R-O04   | Team burnout (UX bệnh, sprint pressure) | 3/5      | 3/5    | 9     | Open       | PM theo dõi, không ép overtime |

### 5.2 Issues / Blockers Đang Mở

| Issue ID | Mô tả vấn đề                                              | Ảnh hưởng           | Người xử lý       | Deadline     | Trạng thái |
|----------|-----------------------------------------------------------|---------------------|-------------------|--------------|------------|
| I-014    | UX Designer bệnh 3 ngày — US-7.7, 7.8 thiếu mockup finalized | Sprint 7 UI quality | Đỗ Lan Phương (tự xử lý theo wireframe sketch) | 14/01/2026 | Open |
| I-015    | Neon DB pool exhaustion khi chạy load test nhỏ (10 concurrent) | Performance concern | Nguyễn Văn Hải    | 18/01/2026   | Open       |

### 5.3 Issues Đã Giải Quyết

| Issue ID | Mô tả vấn đề                               | Giải pháp                                  | Người giải quyết |
|----------|--------------------------------------------|--------------------------------------------|------------------|
| I-012    | Cloudflare Tunnel down 08/01 14:30         | Restart systemd service, thêm watchdog cron | Nguyễn Văn Hải   |
| I-013    | CSRF token không hợp lệ trên public pre-order API | Public endpoint được whitelist khỏi CSRF (mutating public không cần auth) | Phạm Văn Đức |

---

## 6. Metrics Kỹ Thuật

| Metric                          | Tuần này        | Mục tiêu       | Trend        |
|---------------------------------|-----------------|----------------|--------------|
| API Uptime (8h–22h)             | 99.2%           | ≥ 99%          | → (ổn định)  |
| API Response Time p95           | 187ms           | < 300ms        | ↑ (tốt hơn) |
| E2E Tests Pass Rate             | 53/53 (100%)    | 100%           | → (ổn định)  |
| Open Bugs (P1)                  | 0               | 0              | → (ổn định)  |
| Open Bugs (P2)                  | 3               | < 5            | ↑ (2 bug mới đóng) |
| Open Bugs (P3)                  | 8               | < 15           | → (ổn định)  |
| Code Coverage (Backend)         | 73%             | ≥ 70%          | ↑ (+3%)      |
| Build Success Rate              | 100% (12/12)    | ≥ 95%          | → (ổn định)  |
| Deployments this week           | 4               | ≥ 2/sprint     | –            |

**Ghi chú metrics:**
- 4 deployments: 2 staging (BE), 1 staging (FE), 1 production hotfix (CSRF whitelist).
- P2 bugs mới: #234 (pre-order status badge màu sai), #235 (pagination cursor bug).

---

## 7. Milestone Tracker

| Milestone                         | Deadline    | Trạng thái      | % hoàn thành |
|-----------------------------------|-------------|-----------------|--------------|
| M1 – Phase 1 MVP                  | 31/12/2025  | **Completed**   | 100%         |
| M2 – Phase 2 Commerce             | 31/03/2026  | On Track        | 28%          |
| M3 – Phase 3 AI & Social          | 31/05/2026  | Not Started     | 0%           |
| M4 – Production Hardening         | 31/05/2026  | Not Started     | 0%           |
| M5 – Official Launch              | 30/06/2026  | Not Started     | 0%           |

**Progress Phase 2 theo sprint:**
- Sprint 7 (Pre-order): 81% → dự kiến 100% ngày 14/01
- Sprint 8 (Inventory): Chưa bắt đầu (15/01 – 28/01)
- Sprint 9 (Members): Planned
- Sprint 10 (Points): Planned
- Sprint 11 (Reports): Planned
- Sprint 12 (P2 Release): Planned

---

## 8. Quyết Định Cần Phê Duyệt

| #   | Quyết định cần                                                       | Người quyết định | Deadline     |
|-----|----------------------------------------------------------------------|-----------------|--------------|
| 1   | Neon pool size tăng từ 10 → 25 connections (tốn thêm ~$4/tháng)     | PM, DevOps      | 18/01/2026   |
| 2   | Carry-over US-7.10 (3 SP unit tests) sang Sprint 8 nếu không kịp?   | PM, Tech Lead   | 14/01/2026   |

---

## 9. Ghi Chú Bổ Sung

**Shop beta feedback:**
- "Xe Tí Ny Collection" đã nhập 73 items, rất hài lòng với tốc độ upload ảnh sau khi optimize cache headers.
- Yêu cầu thêm: trường "giá nhập" (cost price) ẩn với khách, chỉ admin xem — đã ghi vào backlog, sẽ groom Sprint 9.

**Team morale:**
- Team đã có team lunch ngày 10/01 sau kỳ nghỉ lễ, morale tốt.
- Huỳnh Thị Kim dự kiến bình phục và quay lại 100% từ 19/01.

**Reminder:**
- Quarterly review với Platform Owner dự kiến 28/01/2026 — PM sẽ chuẩn bị slides Phase 2 progress.

---

*Báo cáo được gửi lúc 17:00 ngày 16/01/2026. Mọi câu hỏi hoặc phản hồi gửi về: nguyenhoangtin1404@gmail.com*

---

## Section 3: Hướng Dẫn Mã Màu Nhanh

```
Tình huống                                                  → Mã màu

Mọi thứ đúng kế hoạch, không có vấn đề                    → 🟢 GREEN
Delay < 1 ngày, bug P2/P3, risk đang kiểm soát            → 🟢 GREEN
Delay 1–3 ngày, risk mới phát sinh, cần theo dõi          → 🟡 AMBER
Thiếu resource, blocker chưa giải quyết được               → 🟡 AMBER
Delay > 3 ngày, milestone bị đe dọa, P1 bug chưa fix      → 🔴 RED
Server down không khôi phục, data loss, scope change lớn  → 🔴 RED
```

---

*Template này được PM review và cập nhật vào đầu mỗi Phase. Version hiện tại: v1.0*

# Post-Mortem / Lessons Learned Template — Diecast360

---
**Version:** 1.0
**Ngày tạo:** 2026-05-22
**Người tạo:** PM
**Dự án:** Diecast360

---

## Mục lục

1. [Post-Mortem Template](#1-post-mortem-template)
2. [Ví dụ 1 — Incident: Cross-tenant catalog data leak](#2-ví-dụ-1--incident-cross-tenant-catalog-data-leak)
3. [Ví dụ 2 — Incident: OOM crash khi upload spinner 48 frames](#3-ví-dụ-2--incident-oom-crash-khi-upload-spinner-48-frames)
4. [Ví dụ 3 — Sprint Retrospective: Sprint 8 Pre-Order Module](#4-ví-dụ-3--sprint-retrospective-sprint-8-pre-order-module)
5. [Hướng dẫn tổ chức Post-Mortem](#5-hướng-dẫn-tổ-chức-post-mortem)

---

## 1. Post-Mortem Template

### Header

| Trường | Giá trị |
|--------|---------|
| **ID** | PM-YYYY-NNN |
| **Loại** | Incident / Sprint Retrospective / Release Review |
| **Tiêu đề** | |
| **Ngày xảy ra** | |
| **Ngày tổ chức họp** | |
| **Facilitator** | |
| **Người ghi chép** | |
| **Participants** | |
| **Severity** | P1 Critical / P2 High / P3 Medium / N/A |

---

### 1.1 Tóm tắt sự cố (5W)

| | |
|-|-|
| **What** | Điều gì đã xảy ra? |
| **When** | Khi nào xảy ra? (thời gian bắt đầu / kết thúc) |
| **Where** | Ở đâu? (service, endpoint, feature) |
| **Who** | Ai bị ảnh hưởng? (users, shops) |
| **Why** | Tại sao xảy ra? (tóm tắt ngắn — chi tiết ở phần Root Cause) |

---

### 1.2 Timeline sự kiện

| Thời gian | Sự kiện | Người thực hiện |
|-----------|---------|----------------|
| HH:MM | Phát hiện sự cố | |
| HH:MM | Bắt đầu điều tra | |
| HH:MM | Xác định nguyên nhân | |
| HH:MM | Áp dụng fix tạm thời (hotfix/workaround) | |
| HH:MM | Deploy fix | |
| HH:MM | Xác nhận hệ thống ổn định | |
| HH:MM | Bắt đầu thông báo cho users | |

---

### 1.3 Đánh giá tác động

| Tiêu chí | Chi tiết |
|---------|---------|
| **Số users/shops bị ảnh hưởng** | |
| **Thời gian downtime / degraded** | |
| **Tính năng bị ảnh hưởng** | |
| **Data loss / corruption** | Có / Không |
| **Revenue impact** | Ước tính nếu có |
| **Reputation impact** | |

---

### 1.4 Root Cause Analysis — 5 Whys

**Triệu chứng:** *(mô tả lỗi user nhìn thấy)*

| Lần | Câu hỏi | Trả lời |
|-----|---------|---------|
| Why 1 | Tại sao *[triệu chứng]* xảy ra? | |
| Why 2 | Tại sao *[why1]* xảy ra? | |
| Why 3 | Tại sao *[why2]* xảy ra? | |
| Why 4 | Tại sao *[why3]* xảy ra? | |
| Why 5 | Tại sao *[why4]* xảy ra? | |

**Root Cause:** *(câu trả lời cuối cùng — là root cause thực sự)*

---

### 1.5 Contributing Factors

*(Các yếu tố góp phần — không phải nguyên nhân chính nhưng đã làm sự cố tệ hơn hoặc khó phát hiện hơn)*

- [ ] Thiếu monitoring / alerting
- [ ] Thiếu test coverage
- [ ] Code review không phát hiện được vấn đề
- [ ] Tài liệu không rõ ràng
- [ ] Time pressure dẫn đến bỏ qua bước kiểm tra
- [ ] Thiếu kiến thức về domain/business rule
- [ ] Tooling / infrastructure limitation
- [ ] Khác: ___

---

### 1.6 Những gì đã làm tốt ✅

*(Blameless — ghi nhận những điều team làm tốt trong quá trình xử lý)*

- 
- 
- 

---

### 1.7 Những gì cần cải thiện ⚠️

*(Blameless — không blame cá nhân, focus vào process/system)*

- 
- 
- 

---

### 1.8 Action Items

| # | Hành động | Owner | Deadline | Priority | Status |
|---|----------|-------|---------|---------|--------|
| 1 | | | | P1/P2/P3 | Open |
| 2 | | | | | Open |
| 3 | | | | | Open |

---

### 1.9 Lessons Learned

#### Kỹ thuật (Technical)
- 

#### Process
- 

#### Team / Communication
- 

---

### 1.10 Prevention Measures

*(Những thay đổi cụ thể để ngăn sự cố tương tự tái diễn)*

| Biện pháp | Loại | Owner | Deadline |
|----------|------|-------|---------|
| | Code / Test / Process / Monitoring | | |

---

---

## 2. Ví dụ 1 — Incident: Cross-tenant Catalog Data Leak

### Header

| Trường | Giá trị |
|--------|---------|
| **ID** | PM-2025-001 |
| **Loại** | Incident |
| **Tiêu đề** | Public catalog trả item của nhiều shop khi không có shop_id param trên production |
| **Ngày xảy ra** | 2025-11-18 |
| **Ngày tổ chức họp** | 2025-11-19 |
| **Facilitator** | Nguyễn Hoàng Tin (PM) |
| **Participants** | PM, Tech Lead, Backend Dev 1, QA Lead |
| **Severity** | P1 Critical (data privacy) |

---

### 2.1 Tóm tắt sự cố

| | |
|-|-|
| **What** | `GET /api/v1/public/items` không có `shop_id` param trả về item của TẤT CẢ shops thay vì chỉ shop được chỉ định |
| **When** | Phát hiện lúc 14:30 ngày 18/11/2025; ước tính đã tồn tại từ deploy ngày 15/11 (3 ngày) |
| **Where** | Endpoint `GET /api/v1/public/items` trên production |
| **Who** | Bất kỳ anonymous user nào truy cập catalog public đều có thể thấy item của các shop khác; ảnh hưởng tất cả shops (3 shop active tại thời điểm đó) |
| **Why** | `TenantGuard` không được apply cho public routes, và production env check (`NODE_ENV === 'production'`) không được implement đúng |

---

### 2.2 Timeline

| Thời gian | Sự kiện | Người |
|-----------|---------|-------|
| 15/11 10:00 | Deploy version mới với public catalog feature | DevOps |
| 18/11 14:25 | Shop owner "Anh Minh" báo cáo thấy item của shop khác trên catalog | Shop Owner |
| 18/11 14:30 | QA Lead nhận báo cáo và replicate issue | QA Lead |
| 18/11 14:35 | Escalate đến Tech Lead và Backend Dev 1 | QA Lead |
| 18/11 14:50 | Root cause xác định: thiếu `shop_id` check trong public items query | Backend Dev 1 |
| 18/11 15:00 | Hotfix: thêm `PUBLIC_SHOP_REQUIRED (422)` cho anonymous requests trong production | Backend Dev 1 |
| 18/11 15:30 | Deploy hotfix sau code review nhanh | DevOps |
| 18/11 15:45 | Verify fix hoạt động đúng trên production | QA Lead |
| 18/11 16:00 | Thông báo cho tất cả shop owners về sự cố và đã fix | PM |

---

### 2.3 Tác động

| Tiêu chí | Chi tiết |
|---------|---------|
| **Shops bị ảnh hưởng** | 3 shops (toàn bộ shop active) |
| **Thời gian bị ảnh hưởng** | ~3 ngày (15/11 - 18/11) |
| **Data bị lộ** | Item names, prices, images của tất cả shops (không lộ order/member data) |
| **Data loss** | Không có data loss, chỉ data exposure |
| **Revenue impact** | Không đánh giá được (có thể gây mất tin tưởng) |

---

### 2.4 Root Cause — 5 Whys

**Triệu chứng:** Public catalog trả item của nhiều shop

| Lần | Câu hỏi | Trả lời |
|-----|---------|---------|
| Why 1 | Tại sao catalog trả item của nhiều shop? | Query `items` không filter theo `shop_id` khi không có param |
| Why 2 | Tại sao không filter `shop_id`? | Code check `if (shop_id) { filter }` — khi không có shop_id thì bỏ qua filter |
| Why 3 | Tại sao không enforce `shop_id` bắt buộc? | Logic "production requires shop scope" không được implement — chỉ có trong docs, chưa vào code |
| Why 4 | Tại sao thiếu logic production enforcement? | Developer đọc requirements nhưng focus vào happy path, miss production-specific behavior |
| Why 5 | Tại sao test không catch được? | E2E test chạy ở non-production env (`NODE_ENV=test`), không test production behavior |

**Root Cause:** Production enforcement rule ("anonymous request without shop_id → 422") chỉ tồn tại trong docs, không được implement trong code. Test không cover production env behavior.

---

### 2.5 Điều đã làm tốt ✅

- Response time tốt: phát hiện → fix → deploy trong 75 phút
- Communication kịp thời với shop owners
- Hotfix được code review trước khi deploy (không skip dù khẩn cấp)
- Post-mortem tổ chức ngay ngày hôm sau

---

### 2.6 Cần cải thiện ⚠️

- E2E tests không cover production env behavior
- Missing monitoring/alerting cho cross-tenant data patterns
- Domain docs (DOMAIN.md) chưa được sync vào code một cách có enforce
- Không có integration test cho public endpoint với/không có shop_id

---

### 2.7 Action Items

| # | Hành động | Owner | Deadline | Priority | Status |
|---|----------|-------|---------|---------|--------|
| 1 | Implement `PUBLIC_SHOP_REQUIRED (422)` cho production anonymous requests | Backend Dev 1 | 19/11 | P1 | ✅ Done |
| 2 | Thêm E2E test: anonymous public request trên production-mode phải 422 | QA Lead | 22/11 | P1 | ✅ Done |
| 3 | Thêm E2E test: item của shop A không xuất hiện khi query với shop B | QA Lead | 22/11 | P1 | ✅ Done |
| 4 | Review tất cả public endpoints để tìm potential cross-tenant issues | Tech Lead | 25/11 | P1 | ✅ Done |
| 5 | Thêm SECURITY.md với checklist tenant isolation | Tech Lead | 30/11 | P2 | ✅ Done |
| 6 | Bổ sung rule vào CLAUDE.md: public routes phải có shop scope enforcement | Tech Lead | 25/11 | P2 | ✅ Done |

---

### 2.8 Lessons Learned

**Kỹ thuật:**
- Production-specific behavior PHẢI được test với `NODE_ENV=production` (hoặc test flag tương đương)
- Tenant isolation phải được test explicitly, không assume nó hoạt động

**Process:**
- Business rules trong docs phải có test coverage tương ứng — docs không phải enforcement
- Security-critical features (data isolation) cần mandatory security review

**Team:**
- "Thiếu trong docs" không đủ để đảm bảo implementation — cần test coverage

---

---

## 3. Ví dụ 2 — Incident: OOM Crash khi Upload Spinner 48 Frames

### Header

| Trường | Giá trị |
|--------|---------|
| **ID** | PM-2025-002 |
| **Loại** | Incident |
| **Tiêu đề** | Backend crash (OOM) khi shop owner upload 48 spinner frames đồng thời |
| **Ngày xảy ra** | 2025-12-05 |
| **Ngày tổ chức họp** | 2025-12-06 |
| **Facilitator** | Tech Lead |
| **Participants** | Tech Lead, Backend Dev 1, DevOps |
| **Severity** | P2 High (service crash, data loss partial) |

---

### 3.1 Tóm tắt

| | |
|-|-|
| **What** | NestJS backend crash với `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory` khi shop owner upload nhiều spinner frames |
| **When** | 2025-12-05 15:20 GMT+7 |
| **Where** | `POST /api/v1/spin-sets/:id/frames`, server (Raspberry Pi 4, 4GB RAM) |
| **Who** | 1 shop owner (Anh Minh) bị mất session; 1 spin set upload fail sau 32 frames |
| **Why** | Sharp image processing không giới hạn concurrency, multiple concurrent upload requests làm RAM spike vượt Node.js limit |

---

### 3.2 Timeline

| Thời gian | Sự kiện | Người |
|-----------|---------|-------|
| 15:15 | Anh Minh bắt đầu upload spinner — drag-drop 48 ảnh cùng lúc | Shop Owner |
| 15:20 | Server crash, PM2 tự restart | Server |
| 15:21 | Health check endpoint trả 503, alert triggered | Monitoring |
| 15:22 | DevOps nhận alert, kiểm tra PM2 logs | DevOps |
| 15:30 | Identify root cause: Sharp OOM | Tech Lead |
| 15:45 | Hotfix: `Sharp.cache(false)`, `Sharp.concurrency(1)`, `NODE_OPTIONS=--max-old-space-size=512` | Backend Dev 1 |
| 16:00 | Deploy + verify fix | DevOps |
| 16:15 | Anh Minh test lại upload 48 frames — thành công (chậm hơn nhưng ổn định) | QA |

---

### 3.3 Root Cause — 5 Whys

| Lần | Câu hỏi | Trả lời |
|-----|---------|---------|
| Why 1 | Tại sao server OOM? | Sharp xử lý nhiều ảnh đồng thời, mỗi ảnh cần ~50-100MB RAM |
| Why 2 | Tại sao Sharp xử lý đồng thời? | Default Sharp concurrency = số CPU cores (4 trên Pi 4) |
| Why 3 | Tại sao không limit concurrency? | Developer không biết Sharp có `concurrency()` config option |
| Why 4 | Tại sao không phát hiện trong test? | Test môi trường dev (MacBook 16GB RAM) không trigger OOM |
| Why 5 | Tại sao không có resource limit test? | Thiếu performance test trên target hardware (Raspberry Pi) |

**Root Cause:** Sharp default concurrency quá cao cho Raspberry Pi. Thiếu performance test trên production hardware.

---

### 3.4 Action Items

| # | Hành động | Owner | Deadline | Status |
|---|----------|-------|---------|--------|
| 1 | Set `Sharp.cache(false)` và `Sharp.concurrency(1)` trong bootstrap | Backend Dev 1 | 06/12 | ✅ Done |
| 2 | Set `NODE_OPTIONS=--max-old-space-size=512` trong PM2 config | DevOps | 06/12 | ✅ Done |
| 3 | Add upload rate limiting (max 5 concurrent requests/shop) | Backend Dev 1 | 10/12 | ✅ Done |
| 4 | Document low-RAM config trong ARCHITECTURE.md và ENV.md | Tech Lead | 10/12 | ✅ Done |
| 5 | Thêm health check memory usage monitoring | DevOps | 15/12 | ✅ Done |
| 6 | Performance test script cho upload flow trên Pi | QA Lead | 20/12 | ✅ Done |

---

### 3.5 Lessons Learned

**Kỹ thuật:**
- Luôn test performance trên hardware production, không chỉ dev machine
- Sharp cần explicit config cho low-RAM environments (`cache(false)`, `concurrency(1)`)
- Node.js memory limit (`--max-old-space-size`) phải set phù hợp với RAM available

**Process:**
- Cần performance acceptance criteria trước khi deploy feature media processing
- Staging environment nên có hardware spec tương đương production

---

---

## 4. Ví dụ 3 — Sprint Retrospective: Sprint 8 Pre-Order Module

### Header

| Trường | Giá trị |
|--------|---------|
| **ID** | PM-2026-S08 |
| **Loại** | Sprint Retrospective |
| **Tiêu đề** | Sprint 8 — Pre-Order Module (01/2026) |
| **Sprint** | Sprint 8 (Sprint goal: Complete Pre-Order lifecycle) |
| **Ngày** | 2026-01-24 |
| **Facilitator** | PM (Nguyễn Hoàng Tin) |
| **Participants** | Toàn team (10 người) |

---

### 4.1 Sprint Summary

| Metric | Kế hoạch | Thực tế |
|--------|---------|---------|
| Story points committed | 42 | 42 |
| Story points completed | 38 | 38 |
| Bugs found | — | 3 |
| Bugs fixed | — | 3 |
| Velocity | — | 38 SP |

**Stories hoàn thành:** 9/10
**Story không done:** US-089 "Member points earn/redeem on pre-order paid" — chuyển sang Sprint 9

---

### 4.2 Điều đã làm tốt ✅

- **State machine implementation** sạch, rõ ràng — Tech Lead review kỹ và đề xuất pattern tốt
- **FK RESTRICT trên member_id** được discover và document sớm, tránh được data integrity bug
- **Daily standup** chạy đúng giờ, blocker được resolve nhanh
- **Demo pre-order flow** cuối sprint — shop owner impressed với UI transition
- **Test coverage** cho state machine transition đạt 100%

---

### 4.3 Cần cải thiện ⚠️

- US-089 (Points) bị underestimate (estimate 5 SP, thực tế 8+ SP) — dependency với loyalty_json config chưa được hiểu rõ lúc planning
- Backend Dev 2 bị block 2 ngày vì chờ API spec rõ ràng cho `PATCH /preorders/:id/status` — cần BA hoàn thiện spec trước sprint bắt đầu
- PR review latency tăng vào giữa sprint — cần enforce SLA review 24h
- Thiếu mock data tốt cho pre-order demo — tốn thời gian setup

---

### 4.4 Action Items cho Sprint 9

| # | Hành động | Owner | Sprint |
|---|----------|-------|-------|
| 1 | Pre-refine US-089 kỹ hơn, estimate lại với đủ context loyalty_json | BA/PO + Backend Dev | Sprint 9 |
| 2 | BA hoàn thiện API spec trước sprint start ít nhất 2 ngày | BA/PO | Ongoing |
| 3 | Enforce PR review SLA 24h — Tech Lead monitor | Tech Lead | Ongoing |
| 4 | Tạo shared mock data seed cho demo | Backend Dev 1 | Sprint 9 |
| 5 | Retrospective: thêm "dependency check" vào Sprint Planning checklist | PM | Sprint 9 |

---

### 4.5 Lessons Learned

**Process:**
- Dependencies giữa stories (Points ↔ loyalty_json config) cần được map explicit trong planning
- API spec phải được finalize trước sprint, không trong sprint

**Team:**
- Khi estimate story liên quan đến external config (JSON schema), cần deep-dive với BA trước

---

## 5. Hướng dẫn tổ chức Post-Mortem

### 5.1 Khi nào tổ chức

| Loại | Khi nào | Deadline tổ chức |
|------|---------|-----------------|
| Incident P1 Critical | Ngay sau khi hệ thống ổn định | Trong 24h |
| Incident P2 High | Sau khi fix confirmed | Trong 48h |
| Sprint Retro | Cuối mỗi sprint | Ngày cuối sprint hoặc đầu sprint mới |
| Release Review | Sau mỗi major release | Trong 1 tuần |

### 5.2 Nguyên tắc blameless

> **Post-mortem là để cải thiện hệ thống, không phải để blame cá nhân.**

- Không blame cá nhân — focus vào process, tooling, communication
- "Tại sao không có test?" không phải "Tại sao bạn không viết test?"
- Mọi người đều đã làm tốt nhất có thể với thông tin và tools họ có lúc đó
- Root cause là system/process failure, không phải individual failure

### 5.3 Action item quality

Action item tốt phải:
- **Specific**: rõ ràng sẽ làm gì
- **Measurable**: biết khi nào done
- **Assigned**: có owner cụ thể
- **Time-bound**: có deadline
- **Preventive**: ngăn sự cố tương tự, không chỉ fix symptom

### 5.4 Follow-up

- Action items được track trong Jira/project board
- Review action item completion tại sprint planning tiếp theo
- Post-mortem document được lưu trong `docs/project-docs/group7-handover/` và share toàn team

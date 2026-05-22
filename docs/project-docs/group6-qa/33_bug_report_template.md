---
title: Bug Report Template - Diecast360
version: 1.0.0
created: 2026-05-22
author: QA Lead - Group 6
status: Active
---

# Bug Report Template — Diecast360

## Mục lục

1. [Header Fields & Định nghĩa](#1-header-fields--định-nghĩa)
2. [Severity Levels](#2-severity-levels)
3. [Priority Levels](#3-priority-levels)
4. [Status Workflow](#4-status-workflow)
5. [Template Bug Report](#5-template-bug-report)
6. [Ví dụ Bug Reports](#6-ví-dụ-bug-reports)
7. [Quy trình Bug Triage](#7-quy-trình-bug-triage)

---

## 1. Header Fields & Định nghĩa

| Field | Mô tả | Ai điền | Ví dụ |
|-------|-------|---------|-------|
| **Bug ID** | Mã định danh duy nhất, tự tăng | Hệ thống (GitHub Issues) | BUG-042 |
| **Title** | Tóm tắt ngắn gọn, actionable (< 80 ký tự) | QA tester | "da_ban item cho phép PATCH quantity > 0" |
| **Date Reported** | Ngày phát hiện (YYYY-MM-DD) | QA tester | 2026-05-22 |
| **Reporter** | Tên người báo lỗi | QA tester | Nguyễn Thị B |
| **Severity** | Mức độ ảnh hưởng kỹ thuật | QA Lead | Critical / High / Medium / Low |
| **Priority** | Thứ tự sửa chữa theo nghiệp vụ | QA Lead + PO | P1 / P2 / P3 / P4 |
| **Status** | Trạng thái hiện tại | Cập nhật liên tục | Open / In Progress / ... |
| **Assignee** | Developer được giao sửa | QA Lead / Tech Lead | Trần Văn C |
| **Sprint** | Sprint phát hiện / sửa | QA Lead | Sprint 3 |
| **Related Test Case** | ID test case phát hiện bug | QA tester | TC-ITEM-002 |
| **Labels** | GitHub labels | QA Lead | `bug`, `severity:critical`, `module:items` |

---

## 2. Severity Levels

### Critical — Hệ thống không thể dùng hoặc data bị xâm phạm

**Định nghĩa:** Bug gây ra mất dữ liệu, vi phạm bảo mật, hoặc chức năng core hoàn toàn không hoạt động mà không có workaround nào.

**Diecast360 examples:**
- Cross-tenant data leak: shop A đọc/ghi được data của shop B
- `da_ban` item cho phép `quantity > 0` — vi phạm business invariant
- Public catalog trả items của shop khác (security)
- Authentication bypass: truy cập protected routes không cần cookie
- Database corruption: ledger `points_balance` sai sau transaction

**SLA:** Phải có hot-fix trong **4 giờ** trong giờ làm việc; PO phải được notify ngay lập tức.

---

### High — Tính năng core bị hỏng, không có workaround

**Định nghĩa:** Chức năng nghiệp vụ quan trọng không hoạt động và người dùng không thể tự xử lý.

**Diecast360 examples:**
- Pre-order state machine cho phép transition không hợp lệ (PENDING → PAID bỏ qua bước giữa)
- Spinner frame_index không được compacted sau khi xóa (UNIQUE constraint violation khi upload tiếp)
- Member points không ghi ledger khi pre-order PAID
- Upload ảnh thành công nhưng không trả URL (không xem được ảnh)
- CSRF không được validate trên POST endpoints

**SLA:** Sửa trong **1 ngày làm việc**; assign ngay tại buổi triage hôm đó.

---

### Medium — Tính năng bị hỏng nhưng có workaround

**Định nghĩa:** Người dùng gặp khó khăn nhưng có thể tiếp tục làm việc bằng cách khác.

**Diecast360 examples:**
- Reorder ảnh display_order không được lưu (có thể tải lại trang rồi thử lại)
- Cover ảnh không tự động reassign khi xóa (admin phải set thủ công)
- AI draft phân tích sai brand nhưng cho phép chỉnh sửa trước khi confirm
- Facebook URL không được validate format (vẫn lưu được)
- Pagination trả sai `total` nhưng items đúng

**SLA:** Đưa vào backlog sprint tiếp theo, sửa trong **3 ngày làm việc**.

---

### Low — UI/UX, cosmetic, typo

**Định nghĩa:** Không ảnh hưởng đến chức năng, chỉ là trải nghiệm hoặc thẩm mỹ.

**Diecast360 examples:**
- Toast notification màu sai (warning hiện màu error)
- Label "Đặt cọc" bị typo thành "Đặt cọ"
- Spinner loading animation bị giật trên Firefox
- Thứ tự tab trên form không đúng logic
- Ngày tháng hiển thị format US thay vì DD/MM/YYYY

**SLA:** Lên kế hoạch sửa trong **sprint sau** hoặc khi có thời gian rảnh.

---

## 3. Priority Levels

| Priority | Tên | Mô tả | Khi nào dùng |
|----------|-----|-------|-------------|
| **P1** | Blocker | Chặn toàn bộ testing hoặc release | Luôn dùng với Critical; có thể dùng với High nếu chặn CI |
| **P2** | High | Cần sửa trong sprint này | Hầu hết High severity bugs |
| **P3** | Medium | Lên kế hoạch sprint sau | Medium severity, một số Low nếu nhiều user bị ảnh hưởng |
| **P4** | Low | Sửa khi tiện | Cosmetic, typo, low-impact |

**Lưu ý:** Severity mô tả mức độ ảnh hưởng kỹ thuật; Priority mô tả thứ tự ưu tiên sửa. Một bug Medium severity có thể được nâng lên P2 nếu nhiều user bị ảnh hưởng.

---

## 4. Status Workflow

```
[Phát hiện bởi QA]
        ↓
     OPEN  ──────────────────────────────────────┐
        ↓  (QA Lead assign dev)                  │
  IN PROGRESS  (Dev đang sửa)                    │
        ↓  (Dev tạo PR)                          │
   IN REVIEW  (QA verify trên staging)           │
        ↓                                        │
     FIXED  (QA xác nhận pass)                   │
        ↓                                        │
   VERIFIED  (QA đóng sau regression)            │
        ↓                                        │
     CLOSED                                      │
        ↑                                        │
   REOPENED ←──── (QA test fail) ────────────────┘
```

| Status | Người chịu trách nhiệm | Điều kiện chuyển |
|--------|----------------------|-----------------|
| **Open** | QA tester | Bug vừa được báo cáo |
| **In Progress** | Developer | Dev đã nhận và đang fix |
| **In Review** | QA tester | Dev đã tạo PR, cần QA verify |
| **Fixed** | QA tester | QA đã verify pass trên staging |
| **Verified** | QA Lead | Đã pass regression test |
| **Closed** | QA Lead | Đã merge, được confirm ổn định |
| **Reopened** | QA tester | Bug tái xuất hiện sau khi đã closed |
| **Wont Fix** | QA Lead + PO | Chấp nhận bug theo quyết định sản phẩm |

---

## 5. Template Bug Report

> Sao chép template dưới đây khi tạo GitHub Issue mới. Điền đầy đủ tất cả sections.

---

```markdown
## [BUG-XXX] Tiêu đề ngắn gọn (<80 ký tự)

### Header

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-XXX |
| **Date** | YYYY-MM-DD |
| **Reporter** | Tên người báo |
| **Severity** | Critical / High / Medium / Low |
| **Priority** | P1 / P2 / P3 / P4 |
| **Status** | Open |
| **Assignee** | (để trống, QA Lead assign) |
| **Sprint** | Sprint X |
| **Module** | auth / items / images / spinner / preorder / inventory / members / points / public / security |
| **Related TC** | TC-XXX-XXX |

---

### Environment

| Field | Value |
|-------|-------|
| **URL** | https://staging.diecast360.vn |
| **OS** | Windows 11 / macOS 14 / Ubuntu 22.04 |
| **Browser** | Chrome 125 / Firefox 127 / Edge 125 |
| **Backend version** | Commit SHA hoặc version tag |
| **Frontend version** | Commit SHA hoặc version tag |
| **User role** | shop_admin / shop_staff / platform_super |
| **Shop** | Shop A (UUID: ...) |

---

### Steps to Reproduce

1. Đăng nhập với tài khoản `role` vào `URL`
2. Thực hiện hành động X
3. Quan sát kết quả

> **Có thể tái hiện:** Luôn / Thỉnh thoảng / Khó tái hiện
> **Tần suất tái hiện:** X/10 lần thử

---

### Expected Behavior

Mô tả rõ hành vi mong đợi theo spec / acceptance criteria.

---

### Actual Behavior

Mô tả rõ hành vi thực tế quan sát được.

---

### Screenshots / Videos

<!-- Đính kèm ảnh chụp màn hình hoặc video recording -->
- [ ] Screenshot đã đính kèm
- [ ] Video recording đã đính kèm

---

### Error Logs

**Browser Console:**
```
[Paste console errors here]
```

**Server/Backend logs:**
```
[Paste server logs if accessible]
```

**HTTP Request:**
```
POST /api/v1/items HTTP/1.1
Host: staging.diecast360.vn
Cookie: access_token=...
X-CSRF-Token: ...
Content-Type: application/json

{
  "name": "Test Item",
  "status": "da_ban",
  "quantity": 5
}
```

**HTTP Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ok": true,
  "data": { "quantity": 5, "status": "da_ban" }
}
```

---

### Workaround

<!-- Nếu có cách tạm thời giải quyết -->
_Không có workaround_ / Mô tả cách tạm thời

---

### Root Cause

<!-- [Dev điền sau khi phân tích] -->
_Đang điều tra_

---

### Fix Description

<!-- [Dev điền sau khi có fix] -->
_Chưa có_

---

### Test Cases to Verify Fix

- [ ] TC-XXX-XXX — [tên test case gốc]
- [ ] Thêm test case hồi quy: [mô tả]
```

---

## 6. Ví dụ Bug Reports

---

### BUG-001 — da_ban item vẫn cho phép set quantity > 0 khi PATCH

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-001 |
| **Date** | 2026-05-20 |
| **Reporter** | Trần Thị B (QA Tester) |
| **Severity** | **Critical** |
| **Priority** | **P1 (Blocker)** |
| **Status** | Open |
| **Assignee** | (chờ assign) |
| **Sprint** | Sprint 2 |
| **Module** | items |
| **Related TC** | TC-ITEM-005 |

#### Environment

| Field | Value |
|-------|-------|
| **URL** | https://staging.diecast360.vn |
| **OS** | Windows 11 |
| **Browser** | Chrome 125 |
| **Backend version** | commit `a1b2c3d` |
| **User role** | shop_admin |
| **Shop** | Shop A (UUID: `550e8400-e29b-41d4-a716-446655440000`) |

#### Steps to Reproduce

1. Đăng nhập với tài khoản `shop_admin@shopA.vn`
2. Tạo item mới với `status: "da_ban"`, `quantity: 0` → tạo thành công (đúng)
3. Gửi request: `PATCH /api/v1/items/<item_id>` với body:
   ```json
   { "quantity": 5 }
   ```
4. Quan sát response

> **Có thể tái hiện:** Luôn luôn (10/10)

#### Expected Behavior

HTTP 422 với error code `ITEM_DABAN_QUANTITY_INVALID`:
```json
{
  "ok": false,
  "error": {
    "code": "ITEM_DABAN_QUANTITY_INVALID"
  },
  "message": "Item da_ban phải có quantity = 0"
}
```

#### Actual Behavior

HTTP 200 — item được cập nhật thành công với `quantity: 5` mặc dù `status: "da_ban"`. Đây là vi phạm business invariant cốt lõi.

```json
{
  "ok": true,
  "data": {
    "id": "...",
    "status": "da_ban",
    "quantity": 5
  }
}
```

#### Screenshots / Videos

- [x] Screenshot response đã đính kèm: `bug001-response.png`
- [x] Video Postman recording: `bug001-demo.mp4`

#### Error Logs

**HTTP Request:**
```
PATCH /api/v1/items/550e8400-e29b-41d4-a716-446655440001 HTTP/1.1
Host: staging.diecast360.vn
Cookie: access_token=eyJ...
X-CSRF-Token: abc123
Content-Type: application/json

{"quantity": 5}
```

**HTTP Response:**
```
HTTP/1.1 200 OK

{"ok":true,"data":{"id":"550e8400...","status":"da_ban","quantity":5}}
```

#### Workaround

Không có workaround. Admin có thể vô tình set quantity > 0 cho item da_ban, gây sai số liệu tồn kho.

#### Root Cause

_Đang điều tra_ — Nghi ngờ: `ItemService.update()` chỉ kiểm tra invariant khi `status` được gửi trong payload, nhưng bỏ qua trường hợp chỉ cập nhật `quantity` trong khi status hiện tại là `da_ban`.

#### Fix Description

_Chưa có_ — Dev cần sửa `ItemService.update()` để luôn kiểm tra: nếu item hiện tại có `status = da_ban` VÀ payload có `quantity > 0` → throw error, bất kể payload có gửi `status` hay không.

#### Test Cases to Verify Fix

- [ ] TC-ITEM-005 — PATCH item da_ban không cho set quantity > 0
- [ ] TC-ITEM-007 — Chuyển status sang da_ban phải reset quantity về 0
- [ ] Thêm: Tạo item `da_ban` rồi PATCH chỉ quantity → phải 422

---

### BUG-002 — Spinner frame_index không được compacted sau khi xóa frame

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-002 |
| **Date** | 2026-05-21 |
| **Reporter** | Lê Văn C (QA Tester) |
| **Severity** | **High** |
| **Priority** | **P2** |
| **Status** | In Progress |
| **Assignee** | Phạm Đức D (Backend Dev) |
| **Sprint** | Sprint 2 |
| **Module** | spinner |
| **Related TC** | TC-SPIN-006 |

#### Environment

| Field | Value |
|-------|-------|
| **URL** | https://staging.diecast360.vn |
| **OS** | macOS 14 |
| **Browser** | Chrome 125 |
| **Backend version** | commit `e4f5g6h` |
| **User role** | shop_admin |

#### Steps to Reproduce

1. Tạo SpinSet với 5 frames (frame_index: 0, 1, 2, 3, 4)
2. Xóa frame có `frame_index: 2`:
   ```
   DELETE /api/v1/spin-sets/<id>/frames/<frame2_id>
   ```
3. Upload frame mới:
   ```
   POST /api/v1/spin-sets/<id>/frames
   ```
4. Quan sát response

> **Có thể tái hiện:** Luôn luôn

#### Expected Behavior

Sau khi xóa frame index 2:
- Frame cũ index 3 → trở thành index 2
- Frame cũ index 4 → trở thành index 3
- Frames còn lại: 0, 1, 2, 3 (liên tục, không gap)
- Upload frame mới sẽ nhận index 4 → thành công

#### Actual Behavior

Sau khi xóa frame index 2, các frame còn lại vẫn giữ index: 0, 1, 3, 4 (gap tại index 2).

Khi upload frame mới, service tính `max_index + 1 = 5` → upload với index 5.
Nhưng trong một lần khác, service tính frame tiếp theo là index 2 (vị trí trống) → **UNIQUE constraint violation**:

```
PostgreSQL Error: duplicate key value violates unique constraint "spin_set_frames_spin_set_id_frame_index_key"
```

Backend trả HTTP 500 thay vì 409 với error code đúng.

#### Error Logs

**Server logs:**
```
[ERROR] 2026-05-21T14:23:11Z QueryFailedError: duplicate key value violates unique constraint "spin_set_frames_spin_set_id_frame_index_key"
    at /app/node_modules/@nestjs/typeorm/...
    Detail: Key (spin_set_id, frame_index)=(abc123, 2) already exists.
```

#### Workaround

Admin có thể xóa toàn bộ SpinSet và upload lại tất cả frames theo đúng thứ tự. Rất bất tiện nhưng vẫn làm được.

#### Root Cause

`SpinSetService.deleteFrame()` thực hiện DELETE frame nhưng không chạy UPDATE để shift các frame_index lớn hơn xuống. Thiếu logic compaction sau delete.

#### Fix Description

_Đề xuất (Dev confirm):_ Trong một database transaction:
1. DELETE frame tại index N
2. UPDATE SET `frame_index = frame_index - 1` WHERE `spin_set_id = X AND frame_index > N`

#### Test Cases to Verify Fix

- [ ] TC-SPIN-006 — Xóa frame giữa → frame_index còn lại được compacted
- [ ] TC-SPIN-003 — Upload 24 frames liên tiếp → frame_index 0..23
- [ ] TC-SPIN-004 — Upload frame trùng frame_index → 409 (không còn 500)
- [ ] Regression: Xóa nhiều frames liên tiếp → index vẫn liên tục

---

### BUG-003 — Public catalog trả item của shop khác khi thiếu shop_id trên production

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-003 |
| **Date** | 2026-05-22 |
| **Reporter** | Nguyễn Thị A (QA Lead) |
| **Severity** | **Critical** |
| **Priority** | **P1 (Blocker)** |
| **Status** | Open |
| **Assignee** | (Escalate ngay lập tức đến Tech Lead) |
| **Sprint** | Sprint 3 |
| **Module** | public / security |
| **Related TC** | TC-PUB-003, TC-SEC-003 |

#### Environment

| Field | Value |
|-------|-------|
| **URL** | https://staging.diecast360.vn (simulated production config) |
| **OS** | Ubuntu 22.04 |
| **Browser** | curl / Postman |
| **Backend version** | commit `i7j8k9l` |
| **User role** | Anonymous (không đăng nhập) |
| **NODE_ENV** | production |

#### Steps to Reproduce

1. Chạy môi trường staging với `NODE_ENV=production`
2. Gửi request anonymous không có shop_id:
   ```
   GET /api/v1/public/items HTTP/1.1
   Host: staging.diecast360.vn
   (Không có cookie, không có shop_id param)
   ```
3. Quan sát response

> **Có thể tái hiện:** Luôn luôn

#### Expected Behavior

HTTP 422 — server yêu cầu shop_id:
```json
{
  "ok": false,
  "error": { "code": "PUBLIC_SHOP_REQUIRED" },
  "message": "Vui lòng cung cấp shop_id để xem catalog"
}
```

#### Actual Behavior

**HTTP 200** — server trả items từ **tất cả** các shop không phân biệt:
```json
{
  "ok": true,
  "data": {
    "items": [
      { "id": "...", "shop_id": "shopA_uuid", "name": "Ferrari" },
      { "id": "...", "shop_id": "shopB_uuid", "name": "Porsche" },
      { "id": "...", "shop_id": "shopC_uuid", "name": "BMW" }
    ],
    "total": 47
  }
}
```

Đây là **vi phạm bảo mật nghiêm trọng**: data của tất cả shops bị lộ cho anonymous users.

#### Screenshots / Videos

- [x] Postman collection với response đầy đủ: `bug003-postman.json`
- [x] Screenshot response: `bug003-all-shops-leak.png`

#### HTTP Request / Response

**Request:**
```
GET /api/v1/public/items HTTP/1.1
Host: staging.diecast360.vn
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{"ok":true,"data":{"items":[{"shop_id":"shopA",...},{"shop_id":"shopB",...}]}}
```

#### Workaround

Không có workaround chấp nhận được. Cần deploy hot-fix ngay lập tức trên production (nếu production đã chạy config này).

**Hành động khẩn cấp:**
1. Kiểm tra ngay production environment có bị ảnh hưởng không
2. Nếu có → tạm thời disable public catalog endpoint cho đến khi fix
3. Review logs để xem có request anonymous nào đã lấy được cross-shop data chưa

#### Root Cause

_Nghi ngờ:_ `PublicCatalogGuard` hoặc middleware check `NODE_ENV=production` không được gắn vào router đúng cách sau refactor gần đây. Query `GET /items` trong `PublicCatalogService` không có WHERE clause khi `shop_id` là undefined.

#### Fix Description

_Đề xuất:_
1. `PublicCatalogGuard`: Nếu `NODE_ENV=production` VÀ không có `shop_id` → throw `PublicShopRequiredException`
2. `PublicCatalogService.listItems()`: Thêm assert: nếu `shop_id` là undefined → throw Error (fail-safe)
3. Thêm integration test: production mode + no shop_id → 422

#### Test Cases to Verify Fix

- [ ] TC-PUB-003 — Production: anonymous không có shop_id → 422
- [ ] TC-PUB-001 — Browse với shop_id hợp lệ vẫn hoạt động sau fix
- [ ] TC-SEC-003 — Cross-tenant: không trả data của shop khác
- [ ] Kiểm tra staging không bị ảnh hưởng (development mode → cho phép không có shop_id)

---

## 7. Quy trình Bug Triage

### 7.1 Bug Triage Meeting

| Attribute | Chi tiết |
|-----------|---------|
| **Tần suất** | Thứ Ba và Thứ Năm, 09:30–10:00 ICT |
| **Thành phần** | QA Lead (chủ trì) + 1 Backend Dev + 1 Frontend Dev + BA |
| **Agenda** | 1. Review bugs mới (Open) → assign; 2. Review bugs In Review → confirm/reopen; 3. Review bugs In Progress → unblock |
| **Output** | Tất cả bugs Open được assign severity + priority + assignee |

### 7.2 Escalation Process

```
Bug Critical phát hiện
       ↓
QA tester notify QA Lead ngay (Slack #qa-alerts)
       ↓
QA Lead confirm trong 30 phút
       ↓
QA Lead notify Tech Lead + PO
       ↓
Tech Lead assign dev senior
       ↓
Hot-fix trong 4 giờ (giờ làm việc)
       ↓
QA verify trên staging → deploy production
```

### 7.3 Bug Metrics Tracking

| Metric | Cách tính | Target |
|--------|-----------|--------|
| **Open bugs by severity** | Count bugs Open / Critical+High | 0 Critical, < 3 High cuối sprint |
| **Average resolution time** | Ngày từ Open → Fixed | Critical < 0.5 ngày; High < 1 ngày |
| **Reopen rate** | Reopened / Fixed | < 10% |
| **Defect density** | Bugs / story points | Tracking per sprint |
| **Escape rate** | Bugs phát hiện sau release / total | < 5% |

### 7.4 Labels GitHub Issues

```
Severity:
  severity:critical
  severity:high  
  severity:medium
  severity:low

Priority:
  priority:p1-blocker
  priority:p2-high
  priority:p3-medium
  priority:p4-low

Status:
  status:open
  status:in-progress
  status:in-review
  status:fixed
  status:verified
  status:wont-fix

Module:
  module:auth
  module:items
  module:images
  module:spinner
  module:preorder
  module:inventory
  module:members
  module:points
  module:public
  module:ai-draft
  module:facebook
  module:platform-admin
  module:security
```

---

_Template này là tài liệu sống. QA Lead cập nhật khi có feedback từ team sau mỗi sprint._

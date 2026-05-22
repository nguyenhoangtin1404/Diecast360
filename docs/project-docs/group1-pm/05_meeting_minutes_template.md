---
version: "1.0"
created: "2026-05-22"
author: "Nguyễn Hoàng Tín – Project Manager"
status: "Template – Active"
---

# Meeting Minutes Template — Diecast360

## Hướng Dẫn Sử Dụng

Template này dùng cho tất cả các cuộc họp trong dự án Diecast360. Sao chép Section 2 (Blank Template) trước mỗi cuộc họp. Điền đầy đủ trong vòng 2 giờ sau khi kết thúc họp và gửi cho tất cả người tham dự qua email/Slack.

**Quy tắc:**
- 1 người ghi chép được phân công trước.
- Action items phải có **người thực hiện** và **deadline** cụ thể.
- Meeting minutes phải được approve bởi Meeting Facilitator trước khi gửi.
- Lưu file với tên: `YYYYMMDD_[loai_hop]_minutes.md` (ví dụ: `20260115_sprint7_planning_minutes.md`)

---

## Section 1: Loại Cuộc Họp

| Loại họp               | Tần suất           | Thời lượng     | Facilitator   |
|------------------------|--------------------|----------------|---------------|
| Sprint Planning        | 2 tuần/lần         | 2–3 giờ        | PM / PO       |
| Daily Standup          | Hàng ngày          | 15 phút        | PM hoặc TL    |
| Sprint Review          | Cuối mỗi sprint    | 1–2 giờ        | PM            |
| Sprint Retrospective   | Cuối mỗi sprint    | 1 giờ          | PM            |
| Backlog Grooming       | Giữa sprint        | 1–2 giờ        | PO            |
| Technical Design       | Khi cần            | 1–2 giờ        | Tech Lead     |
| Stakeholder Update     | Cuối tháng         | 1 giờ          | PM            |
| Incident Response      | Khi có sự cố       | 30–60 phút     | Tech Lead/DO  |
| Phase Kickoff          | Đầu mỗi Phase      | 2 giờ          | PM            |
| Phase Retrospective    | Cuối mỗi Phase     | 2 giờ          | PM            |

---

## Section 2: Blank Template

```
---
# MEETING MINUTES — DIECAST360
---

## Thông Tin Cuộc Họp

| Trường            | Nội dung              |
|-------------------|-----------------------|
| Dự án             | Diecast360            |
| Loại họp          | [Sprint Planning / Daily / Review / Retro / Technical / Stakeholder / Khác] |
| Sprint / Phase    | [Sprint X – Phase Y]  |
| Ngày & Giờ        | [DD/MM/YYYY – HH:MM]  |
| Địa điểm / Link   | [Google Meet / Zoom / Offline tại ...] |
| Facilitator       | [Tên]                 |
| Người ghi chép    | [Tên]                 |
| Thời lượng        | [X giờ Y phút]        |

## Người Tham Dự

| Tên              | Vai trò        | Có mặt? |
|------------------|----------------|---------|
| [Tên]            | PM             | Có / Vắng |
| [Tên]            | Tech Lead      | Có / Vắng |
| [Tên]            | Backend Dev 1  | Có / Vắng |
| [Tên]            | Backend Dev 2  | Có / Vắng |
| [Tên]            | Frontend Dev 1 | Có / Vắng |
| [Tên]            | Frontend Dev 2 | Có / Vắng |
| [Tên]            | UI/UX Designer | Có / Vắng |
| [Tên]            | QA Engineer    | Có / Vắng |
| [Tên]            | BA/PO          | Có / Vắng |
| [Tên]            | DevOps         | Có / Vắng |
| [Tên khách]      | [Vai trò]      | Có / Vắng |

## Agenda

| #   | Nội dung                        | Thời gian | Người dẫn |
|-----|---------------------------------|-----------|-----------|
| 1   | [Mục 1]                         | X phút    | [Tên]     |
| 2   | [Mục 2]                         | X phút    | [Tên]     |
| 3   | [Mục 3]                         | X phút    | [Tên]     |
| 4   | Action items review             | X phút    | PM        |
| 5   | Wrap-up & Next steps            | 5 phút    | PM        |

## Tóm Tắt Theo Agenda

### 1. [Tên Agenda Item 1]
**Người dẫn:** [Tên]
**Nội dung thảo luận:**
- [Điểm chính 1]
- [Điểm chính 2]

**Kết luận / Quyết định:**
- [Quyết định 1]

---

### 2. [Tên Agenda Item 2]
**Người dẫn:** [Tên]
**Nội dung thảo luận:**
- [Điểm chính 1]

**Kết luận / Quyết định:**
- [Quyết định 1]

---

## Quyết Định Đã Thống Nhất

| #   | Quyết định                     | Người ra quyết định | Ngày hiệu lực |
|-----|-------------------------------|---------------------|---------------|
| D01 | [Mô tả quyết định]             | [Tên / Role]        | [DD/MM/YYYY]  |
| D02 | [Mô tả quyết định]             | [Tên / Role]        | [DD/MM/YYYY]  |

## Action Items

| ID   | Mô tả công việc                          | Người thực hiện | Deadline     | Trạng thái |
|------|------------------------------------------|-----------------|--------------|------------|
| A01  | [Mô tả]                                  | [Tên]           | [DD/MM/YYYY] | Open       |
| A02  | [Mô tả]                                  | [Tên]           | [DD/MM/YYYY] | Open       |
| A03  | [Mô tả]                                  | [Tên]           | [DD/MM/YYYY] | Open       |

## Issues / Blockers

| ID   | Mô tả vấn đề                              | Ảnh hưởng        | Người xử lý | Hạn xử lý   |
|------|-------------------------------------------|-----------------|-------------|-------------|
| I01  | [Mô tả vấn đề]                            | [Sprint / Task]  | [Tên]       | [DD/MM/YYYY] |

## Cuộc Họp Tiếp Theo

| Trường          | Nội dung              |
|-----------------|-----------------------|
| Loại họp        | [Loại]                |
| Ngày & Giờ      | [DD/MM/YYYY – HH:MM]  |
| Link            | [URL]                 |
| Agenda dự kiến  | [Liệt kê ngắn gọn]    |

---
*Ghi chú bổ sung (nếu có):*
[...]

*Minutes được ghi chép bởi: [Tên] | Được approve bởi: [Facilitator] | Gửi lúc: [HH:MM DD/MM/YYYY]*
```

---

## Section 3: Ví Dụ Điền Sẵn — Sprint 7 Planning Meeting

---

# MEETING MINUTES — DIECAST360

## Thông Tin Cuộc Họp

| Trường            | Nội dung                                            |
|-------------------|-----------------------------------------------------|
| Dự án             | Diecast360                                          |
| Loại họp          | Sprint Planning                                     |
| Sprint / Phase    | Sprint 7 – Phase 2 (Commerce & Community)           |
| Ngày & Giờ        | 02/01/2026 – 09:00                                  |
| Địa điểm / Link   | Google Meet – meet.google.com/abc-defg-hij          |
| Facilitator       | Nguyễn Hoàng Tín (PM)                               |
| Người ghi chép    | Trần Thị Minh (BA/PO)                               |
| Thời lượng        | 2 giờ 20 phút (09:00 – 11:20)                       |

## Người Tham Dự

| Tên                   | Vai trò        | Có mặt?  |
|-----------------------|----------------|----------|
| Nguyễn Hoàng Tín      | PM             | Có mặt   |
| Lê Minh Tuấn          | Tech Lead      | Có mặt   |
| Phạm Văn Đức          | Backend Dev 1  | Có mặt   |
| Ngô Thị Hoa           | Backend Dev 2  | Có mặt   |
| Trần Quốc Bảo         | Frontend Dev 1 | Có mặt   |
| Đỗ Lan Phương         | Frontend Dev 2 | Có mặt   |
| Huỳnh Thị Kim         | UI/UX Designer | Vắng (bệnh, được cập nhật sau) |
| Vũ Minh Quang         | QA Engineer    | Có mặt   |
| Trần Thị Minh         | BA/PO          | Có mặt   |
| Nguyễn Văn Hải        | DevOps         | Có mặt   |

## Agenda

| #   | Nội dung                                              | Thời gian | Người dẫn      |
|-----|-------------------------------------------------------|-----------|----------------|
| 1   | Review kết quả Sprint 6 & velocity                    | 20 phút   | PM             |
| 2   | Mục tiêu Sprint 7 – Pre-order Module                  | 15 phút   | BA/PO          |
| 3   | Grooming & ước tính story points                      | 60 phút   | BA/PO + Team   |
| 4   | Technical design: Pre-order state machine             | 20 phút   | Tech Lead      |
| 5   | Sprint commitment & capacity planning                 | 15 phút   | PM + Team      |
| 6   | Action items & wrap-up                                | 10 phút   | PM             |

## Tóm Tắt Theo Agenda

### 1. Review Kết Quả Sprint 6 & Velocity

**Người dẫn:** Nguyễn Hoàng Tín (PM)

**Nội dung thảo luận:**
- Sprint 6 hoàn thành 42/45 story points (velocity: 42 SP). 3 SP còn lại (Swagger docs) chuyển sang Sprint 7.
- Phase 1 đã deploy production ngày 28/12/2025. Cloudflare Tunnel hoạt động ổn định.
- Shop beta "Xe Tí Ny Collection" đã onboard và bắt đầu nhập 50 items.
- Phản hồi tích cực về UI item list, nhưng cần cải thiện tốc độ load ảnh trên catalog.

**Quyết định:**
- Carry-over 3 SP Swagger docs vào Sprint 7 backlog.
- DevOps sẽ kiểm tra cache headers Cloudflare cho ảnh trước 06/01/2026.

---

### 2. Mục Tiêu Sprint 7 – Pre-Order Module

**Người dẫn:** Trần Thị Minh (BA/PO)

**Nội dung thảo luận:**
- Sprint 7 tập trung vào Pre-order Core: state machine backend + admin UI + public pre-order form.
- BA/PO đã viết 8 user stories với acceptance criteria đầy đủ.
- Pre-order state machine: PENDING_CONFIRMATION → WAITING_FOR_GOODS → ARRIVED → PAID. CANCELLED và REFUNDED là terminal.
- Thảo luận về field `deposit_amount` (tiền đặt cọc): **quyết định để nullable**, không bắt buộc trong MVP.
- Public pre-order không yêu cầu đăng nhập, nhưng cần ít nhất tên + SĐT.

**Quyết định:**
- `deposit_amount` là optional field trong Sprint 7.
- Pre-order code format: `DC360-YYYYMMDD-XXXX` (4 ký tự random cuối).
- Admin có thể transition status và thêm note vào mỗi transition.

---

### 3. Grooming & Ước Tính Story Points

**Người dẫn:** BA/PO + Team (Planning Poker)

**Kết quả ước tính:**

| User Story                                          | SP Estimate | Người nhận |
|-----------------------------------------------------|-------------|------------|
| US-7.1: Prisma schema PreOrders + migration         | 3 SP        | Phạm Văn Đức |
| US-7.2: Pre-order state machine service             | 8 SP        | Phạm Văn Đức |
| US-7.3: Admin pre-order CRUD API                    | 5 SP        | Ngô Thị Hoa  |
| US-7.4: Public pre-order submit API                 | 5 SP        | Ngô Thị Hoa  |
| US-7.5: Pre-order lookup by code API                | 2 SP        | Phạm Văn Đức |
| US-7.6: Admin pre-order list + filter UI            | 5 SP        | Trần Quốc Bảo |
| US-7.7: Status transition UI + confirm dialog       | 5 SP        | Đỗ Lan Phương |
| US-7.8: Public pre-order form                       | 5 SP        | Trần Quốc Bảo |
| US-7.9: Pre-order lookup page (public)              | 3 SP        | Đỗ Lan Phương |
| US-7.10: Unit tests (state machine)                 | 3 SP        | Vũ Minh Quang |
| Carry-over: Swagger docs                            | 3 SP        | Phạm Văn Đức |
| **Tổng commit**                                     | **47 SP**   |            |

**Ghi chú:** US-7.2 (State machine, 8 SP) được đánh là highest risk. Tech Lead sẽ pair với BE1 ngày đầu sprint.

---

### 4. Technical Design: Pre-Order State Machine

**Người dẫn:** Lê Minh Tuấn (Tech Lead)

**Nội dung thảo luận:**
- State machine sẽ implement theo pattern Strategy: mỗi transition là một hàm riêng, dễ test.
- FK RESTRICT trên `member_id`: service phải check active pre-orders trước khi xóa member.
- Transition log: mỗi lần đổi status tạo một `PreOrderStatusHistory` record.
- API response sau transition phải trả về pre-order mới nhất với status mới.

**Quyết định:**
- Không implement `PreOrderStatusHistory` trong Sprint 7 — để Sprint 8 nếu cần. Ưu tiên state machine core trước.
- `REFUNDED` chỉ có thể từ `PAID` — không phải từ `CANCELLED`.
- Tất cả transitions phải log bằng structured logging (level: info, include shop_id, preorder_id).

---

### 5. Sprint Commitment & Capacity Planning

**Người dẫn:** Nguyễn Hoàng Tín (PM)

**Capacity:**
- Sprint 7: 14 ngày làm việc (02/01 – 14/01/2026)
- Phạm Văn Đức: 10/10 ngày (full capacity)
- Ngô Thị Hoa: 9/10 ngày (off ngày 08/01)
- Trần Quốc Bảo: 10/10 ngày
- Đỗ Lan Phương: 10/10 ngày
- Vũ Minh Quang: 8/10 ngày (off 2 ngày đầu tuần 2)

**Kết luận:** 47 SP commit hợp lý với velocity Sprint 6 = 42 SP (buffer 10% cho bug fix).

---

## Quyết Định Đã Thống Nhất

| #   | Quyết định                                                                        | Người ra quyết định   | Ngày hiệu lực |
|-----|-----------------------------------------------------------------------------------|-----------------------|---------------|
| D01 | `deposit_amount` là optional field trong pre-order schema Sprint 7                | Tech Lead, BA/PO      | 02/01/2026    |
| D02 | Pre-order code format: `DC360-YYYYMMDD-XXXX`                                      | BA/PO                 | 02/01/2026    |
| D03 | Không implement `PreOrderStatusHistory` trong Sprint 7                            | Tech Lead, PM         | 02/01/2026    |
| D04 | `REFUNDED` chỉ transition từ `PAID`, không từ `CANCELLED`                        | BA/PO, Tech Lead      | 02/01/2026    |
| D05 | Carry-over 3 SP Swagger docs từ Sprint 6 vào Sprint 7                             | PM                    | 02/01/2026    |

## Action Items

| ID   | Mô tả công việc                                                              | Người thực hiện   | Deadline     | Trạng thái |
|------|------------------------------------------------------------------------------|-------------------|--------------|------------|
| A01  | Tạo Prisma migration PreOrders schema, push lên branch `feature/sprint7-db`  | Phạm Văn Đức      | 03/01/2026   | Open       |
| A02  | Viết technical spec cho state machine (diagram + transition table) vào Confluence | Lê Minh Tuấn | 04/01/2026   | Open       |
| A03  | Kiểm tra Cloudflare cache headers cho static images, tối ưu Cache-Control    | Nguyễn Văn Hải    | 06/01/2026   | Open       |
| A04  | Gửi wireframe pre-order admin UI cho Huỳnh Thị Kim review (async)           | Trần Thị Minh     | 04/01/2026   | Open       |
| A05  | Setup Sprint 7 board trên Jira / Linear, gán story cho đúng người           | Nguyễn Hoàng Tín  | 02/01/2026   | Done       |
| A06  | Pair programming session: Tech Lead + BE1 cho state machine (ngày 03/01)    | Lê Minh Tuấn      | 03/01/2026   | Open       |
| A07  | Cập nhật DOMAIN.md với pre-order state machine mô tả                        | Trần Thị Minh     | 05/01/2026   | Open       |

## Issues / Blockers

| ID   | Mô tả vấn đề                                                    | Ảnh hưởng           | Người xử lý       | Hạn xử lý   |
|------|------------------------------------------------------------------|---------------------|-------------------|-------------|
| I01  | UI/UX Designer Huỳnh Thị Kim vắng (bệnh) — pre-order UI chưa có mockup | Sprint 7 UI stories | Trần Thị Minh (tạm) | 05/01/2026  |
| I02  | Neon DB cold start delay ~2-3s khi traffic thấp — cần check pool config | UX public catalog | Nguyễn Văn Hải   | 07/01/2026  |

## Cuộc Họp Tiếp Theo

| Trường          | Nội dung                               |
|-----------------|----------------------------------------|
| Loại họp        | Daily Standup                          |
| Ngày & Giờ      | 03/01/2026 – 09:15                     |
| Link            | meet.google.com/abc-defg-hij           |
| Agenda dự kiến  | Progress update, blockers, pair programming setup |

---

*Ghi chú bổ sung:* Huỳnh Thị Kim sẽ nhận lại công việc UI từ ngày 05/01. Trần Thị Minh tạm thời sketch wireframe thô dựa trên spec.

*Minutes được ghi chép bởi: Trần Thị Minh | Được approve bởi: Nguyễn Hoàng Tín | Gửi lúc: 13:30 02/01/2026*

---

## Section 4: Daily Standup Template (rút gọn)

Cho Daily Standup (15 phút), ghi chép ngắn gọn theo format sau:

```
**Daily Standup — [DD/MM/YYYY] — Sprint X**

**Người tham dự:** [danh sách, ghi ai vắng]

| Người          | Hôm qua đã làm                    | Hôm nay sẽ làm                  | Blocker             |
|----------------|-----------------------------------|----------------------------------|---------------------|
| [Tên]          | [Mô tả ngắn]                      | [Mô tả ngắn]                    | [Blocker / Không]   |
| [Tên]          | [Mô tả ngắn]                      | [Mô tả ngắn]                    | [Blocker / Không]   |

**Blockers cần xử lý:**
- [Mô tả blocker] → [Người xử lý] → [Hạn]

**Ghi chú:** [nếu có]
```

---

*Template này được maintain bởi PM. Mọi góp ý về template gửi cho PM.*

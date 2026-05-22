---
title: Stakeholder Analysis
version: 1.0
created: 2026-05-22
author: BA/PO Team
project: Diecast360
---

# Stakeholder Analysis — Diecast360

## 1. Stakeholder Register

| ID | Tên / Vai trò | Tổ chức / Nhóm | Mức quan tâm (Interest) | Mức ảnh hưởng (Influence) | Kỳ vọng chính | Chiến lược giao tiếp |
|----|--------------|----------------|------------------------|--------------------------|---------------|----------------------|
| S01 | Platform Owner (Chủ nền tảng) | Diecast360 Core Team | Rất cao | Rất cao | Sản phẩm ổn định, có doanh thu SaaS, dễ scale | Weekly sync, OKR review hàng tháng |
| S02 | Product Owner / BA | Diecast360 Core Team | Rất cao | Cao | Backlog rõ ràng, sprint đúng hạn, ít rework | Daily standup, sprint planning |
| S03 | Lead Developer | Diecast360 Dev Team | Cao | Cao | Kiến trúc sạch, không nợ kỹ thuật, spec rõ | Grooming session, design review |
| S04 | Frontend Developer (2 người) | Diecast360 Dev Team | Cao | Trung bình | UI/UX spec đủ, API contract ổn định | Sprint planning, Slack |
| S05 | Backend Developer (2 người) | Diecast360 Dev Team | Cao | Trung bình | API contract rõ, không breaking change | Sprint planning, Slack |
| S06 | QA Engineer | Diecast360 Dev Team | Cao | Trung bình | Test case đầy đủ, môi trường staging ổn | Test review, bug triage |
| S07 | DevOps / Infra | Diecast360 Dev Team | Trung bình | Trung bình | CI/CD ổn, monitoring đầy đủ | Incident channel, sprint review |
| S08 | Shop Admin Tiên phong (Anh Minh) | Pilot Shop #1 | Rất cao | Cao | Đăng hàng nhanh, copy caption dễ, pre-order rõ | Demo hàng tuần, feedback form |
| S09 | Shop Admin #2, #3 | Pilot Shops | Cao | Trung bình | Ổn định, không mất data, UI dễ dùng | Newsletter, onboarding guide |
| S10 | Shop Staff (Bạn Linh) | Pilot Shop #1 | Trung bình | Thấp | Giao diện đơn giản, không cần training nhiều | User guide PDF, in-app tooltip |
| S11 | End Customer (Khách mua) | Cộng đồng diecast | Cao | Thấp | Xem hàng đẹp, đặt được, không bị lỡ hàng | Public catalog, email notification |
| S12 | AI API Provider (OpenAI/Gemini) | Vendor bên thứ ba | Thấp | Cao | Không vi phạm TOS, API key valid | Monitoring uptime, fallback plan |
| S13 | Cloudflare (R2 Storage) | Vendor bên thứ ba | Thấp | Trung bình | Không vượt quota, bucket config đúng | Alert khi gần quota |
| S14 | Investor / Sponsor | — | Trung bình | Cao | ROI rõ ràng, roadmap khả thi, tăng trưởng user | Monthly report, demo |

---

## 2. Power / Interest Matrix

```
HIGH POWER
│
│  S01 (Platform Owner)    S08 (Shop Anh Minh)
│  S02 (PO/BA)             S03 (Lead Dev)
│  S14 (Investor)          S12 (AI Provider)
│
│  S13 (Cloudflare)        S09 (Shop #2,3)
│  S07 (DevOps)            S04,S05 (Dev teams)
│                          S06 (QA)
│
│  ──────────────────────────────────────────
│  S10 (Shop Staff)        S11 (Customers)
│
LOW POWER
└──────────────────────────────────────────────
   LOW INTEREST                    HIGH INTEREST
```

### Phân loại nhóm

| Nhóm | Stakeholders | Chiến lược |
|------|--------------|------------|
| **Manage Closely** (High Power, High Interest) | S01, S02, S03, S08 | Tham gia sâu, cập nhật thường xuyên, lấy feedback liên tục |
| **Keep Satisfied** (High Power, Low Interest) | S12, S13, S14 | Báo cáo định kỳ, alert khi có vấn đề |
| **Keep Informed** (Low Power, High Interest) | S04, S05, S06, S09, S11 | Newsletter, release notes, demo video |
| **Monitor** (Low Power, Low Interest) | S07, S10 | Cập nhật khi có thay đổi lớn |

---

## 3. Engagement Strategy cho từng nhóm

### S01 — Platform Owner
- **Tần suất:** Weekly OKR check-in (30 phút thứ Hai)
- **Kênh:** Google Meet + Notion OKR board
- **Nội dung:** Tiến độ sprint, metrics, rủi ro, quyết định cần escalate
- **Output:** Action items có owner và deadline

### S02 — Product Owner / BA
- **Tần suất:** Hàng ngày (standup) + Sprint Planning (2 tuần/lần)
- **Kênh:** Slack #product, Jira/Linear
- **Nội dung:** Backlog grooming, story refinement, acceptance criteria
- **Output:** Sprint backlog finalized 2 ngày trước sprint start

### S03 — Lead Developer
- **Tần suất:** 2 lần/tuần (tech review + grooming)
- **Kênh:** Slack #dev, GitHub PR review
- **Nội dung:** Architecture decisions, API contract review, tech debt đánh giá
- **Output:** Architecture Decision Records (ADR), tech debt log

### S04, S05 — Dev Teams
- **Tần suất:** Sprint Planning + Daily standup
- **Kênh:** Slack #frontend, #backend, GitHub
- **Nội dung:** Story breakdown, task assignment, blocker removal
- **Output:** Sprint commitment, daily progress update

### S06 — QA Engineer
- **Tần suất:** Sprint Planning + Test Review trước release
- **Kênh:** Slack #qa, TestRail/Notion
- **Nội dung:** Test case review, bug triage, regression scope
- **Output:** Test report, go/no-go decision cho release

### S08 — Shop Admin Tiên phong (Anh Minh)
- **Tần suất:** Demo hàng tuần (thứ Sáu, 30 phút)
- **Kênh:** Zalo, Google Meet
- **Nội dung:** Demo tính năng mới, thu thập feedback thực tế, ưu tiên backlog
- **Output:** Feedback log, priority adjustment nếu cần

### S09 — Shop Admin #2, #3
- **Tần suất:** Bi-weekly newsletter + onboarding khi join
- **Kênh:** Email, Zalo group "Diecast360 Shops"
- **Nội dung:** Release notes, hướng dẫn tính năng mới, FAQ
- **Output:** Tỉ lệ adoption feature mới

### S10 — Shop Staff
- **Tần suất:** Onboarding 1 lần + update khi có thay đổi lớn
- **Kênh:** In-app tooltip, PDF guide, Zalo
- **Nội dung:** Hướng dẫn sử dụng, giải đáp thắc mắc
- **Output:** Thời gian training < 2 giờ

### S11 — End Customers
- **Tần suất:** Khi có thay đổi catalog/pre-order flow
- **Kênh:** Public catalog, email notification (khi pre-order có cập nhật)
- **Nội dung:** Trạng thái đơn hàng, sản phẩm mới, khuyến mãi
- **Output:** CSAT ≥ 4.0, tỉ lệ quay lại ≥ 40%

### S12 — AI Provider (OpenAI/Gemini)
- **Tần suất:** Monitor tự động 24/7
- **Kênh:** API status page, PagerDuty alert
- **Nội dung:** Uptime, rate limit, cost monitoring
- **Output:** Fallback plan khi API down

### S13 — Cloudflare R2
- **Tần suất:** Alert khi storage > 80% quota
- **Kênh:** CloudFlare dashboard, email alert
- **Nội dung:** Bandwidth, storage usage
- **Output:** Tự động scale hoặc cleanup policy

### S14 — Investor / Sponsor
- **Tần suất:** Monthly business review
- **Kênh:** Email report, Google Slides
- **Nội dung:** KPI dashboard, roadmap tiến độ, financial outlook
- **Output:** Continued funding, strategic guidance

---

## 4. Communication Plan

### 4.1 Regular Meetings

| Cuộc họp | Tần suất | Người tham dự | Thời lượng | Mục tiêu | Output |
|----------|----------|---------------|------------|---------|--------|
| Daily Standup | Hàng ngày (9:00) | Dev team + PO | 15 phút | Đồng bộ tiến độ, unblock | Yesterday/Today/Blocker |
| Sprint Planning | 2 tuần/lần (thứ Hai) | Full team | 2 giờ | Commit sprint backlog | Sprint backlog confirmed |
| Sprint Review | 2 tuần/lần (thứ Sáu) | Full team + S08 | 1 giờ | Demo, feedback | Release decision |
| Sprint Retrospective | 2 tuần/lần | Dev team + PO | 1 giờ | Cải thiện process | Action items |
| Backlog Grooming | Hàng tuần (thứ Tư) | PO + Lead Dev | 1 giờ | Refine stories | Groomed backlog |
| OKR Review | Hàng tháng | S01 + S02 + S03 | 1 giờ | Đánh giá tiến độ mục tiêu | OKR update |
| Shop Feedback Demo | Hàng tuần (thứ Sáu) | PO + S08 | 30 phút | Demo + feedback | Feedback log |
| Investor Review | Hàng tháng | S01 + S14 | 1 giờ | Business update | Investor report |

### 4.2 Communication Channels

| Kênh | Mục đích | Người dùng |
|------|----------|------------|
| Slack #general | Thông báo chung | Toàn team |
| Slack #dev | Thảo luận kỹ thuật | Dev team |
| Slack #product | Thảo luận product | PO + Dev |
| Slack #incidents | Alert và incident | Dev + DevOps |
| GitHub PR/Issues | Code review, bug | Dev team |
| Jira/Linear | Task tracking | Full team |
| Notion | Documentation | Full team |
| Zalo "Diecast360 Shops" | Giao tiếp shop | PO + Shop owners |
| Email | Báo cáo chính thức | S14, newsletter |

### 4.3 Escalation Path

```
Issue Level 1 (Bug/blocker) → Lead Dev → giải quyết trong 24h
Issue Level 2 (Conflict/priority) → PO → quyết định trong 48h
Issue Level 3 (Scope/resource) → Platform Owner → quyết định trong 1 tuần
Issue Level 4 (Strategic/financial) → Investor/Board → quyết định trong 2 tuần
```

### 4.4 Artifacts & Delivery

| Artifact | Tần suất | Người tạo | Người nhận |
|----------|----------|-----------|------------|
| Sprint Report | Mỗi sprint | PO | Full team + S01 |
| Release Notes | Mỗi release | PO | Shops + S09 |
| Monthly KPI Dashboard | Hàng tháng | PO + DevOps | S01, S14 |
| Bug Report | Ad hoc | QA | Dev + PO |
| ADR (Architecture Decision) | Ad hoc | Lead Dev | Dev team + PO |
| Onboarding Guide | Khi có shop mới | PO | Shop admin mới |

---
version: "1.0"
created: "2026-05-22"
author: "Nguyễn Hoàng Tín – Project Manager"
status: "Approved"
---

# RACI Matrix — Diecast360

## 1. Chú Giải

| Ký hiệu | Tiếng Anh    | Ý nghĩa                                                                              |
|---------|--------------|--------------------------------------------------------------------------------------|
| **R**   | Responsible  | Người trực tiếp thực hiện công việc. Có thể có nhiều người R cho 1 hoạt động.        |
| **A**   | Accountable  | Người chịu trách nhiệm cuối cùng về kết quả. Chỉ có 1 người A cho mỗi hoạt động.    |
| **C**   | Consulted    | Người được hỏi ý kiến, cung cấp đầu vào trước khi quyết định. Giao tiếp 2 chiều.    |
| **I**   | Informed     | Người được thông báo về kết quả/quyết định. Giao tiếp 1 chiều.                      |
| **–**   | –            | Không tham gia vào hoạt động này.                                                   |

## 2. Danh Sách Vai Trò

| Viết tắt | Vai trò              | Số người |
|----------|----------------------|----------|
| PM       | Project Manager      | 1        |
| TL       | Tech Lead            | 1        |
| BE1      | Backend Developer 1  | 1        |
| BE2      | Backend Developer 2  | 1        |
| FE1      | Frontend Developer 1 | 1        |
| FE2      | Frontend Developer 2 | 1        |
| UX       | UI/UX Designer       | 1        |
| QA       | QA Engineer          | 1        |
| PO       | BA / Product Owner   | 1        |
| DO       | DevOps Engineer      | 1        |

---

## 3. RACI Matrix — Project Management

| Hoạt động                           | PM | TL | BE1 | BE2 | FE1 | FE2 | UX | QA | PO | DO |
|-------------------------------------|----|----|-----|-----|-----|-----|----|----|----|----|
| Project Charter & Vision            | A  | C  | I   | I   | I   | I   | I  | I  | C  | I  |
| Lập kế hoạch dự án / Roadmap        | A  | C  | I   | I   | I   | I   | I  | I  | R  | I  |
| Sprint Planning                     | A  | C  | R   | R   | R   | R   | C  | R  | R  | C  |
| Daily Standup facilitation          | R  | I  | R   | R   | R   | R   | R  | R  | R  | R  |
| Sprint Review / Demo                | A  | R  | R   | R   | R   | R   | R  | R  | R  | I  |
| Sprint Retrospective                | A  | R  | R   | R   | R   | R   | R  | R  | R  | R  |
| Backlog Grooming / Refinement       | C  | C  | C   | C   | C   | C   | C  | C  | A  | I  |
| Story Point Estimation              | I  | C  | R   | R   | R   | R   | C  | C  | A  | I  |
| Quản lý rủi ro (Risk Register)      | A  | C  | I   | I   | I   | I   | I  | I  | C  | C  |
| Báo cáo tiến độ (Status Report)     | A  | I  | I   | I   | I   | I   | I  | I  | I  | I  |
| Quản lý thay đổi (Change Request)   | A  | C  | I   | I   | I   | I   | I  | I  | R  | I  |
| Họp Stakeholder / Sponsor           | A  | C  | I   | I   | I   | I   | I  | I  | R  | I  |
| Team onboarding                     | A  | R  | I   | I   | I   | I   | I  | I  | I  | R  |
| Budget tracking                     | A  | I  | –   | –   | –   | –   | –  | –  | C  | I  |
| Quản lý velocity & burndown         | A  | C  | I   | I   | I   | I   | I  | I  | C  | –  |

---

## 4. RACI Matrix — Requirements & Analysis

| Hoạt động                                  | PM | TL | BE1 | BE2 | FE1 | FE2 | UX | QA | PO | DO |
|--------------------------------------------|----|----|-----|-----|-----|-----|----|----|----|----|
| Thu thập yêu cầu từ Shop Owner             | C  | I  | –   | –   | –   | –   | C  | –  | A  | –  |
| Phân tích nghiệp vụ (Business Analysis)    | I  | C  | C   | –   | –   | –   | –  | –  | A  | –  |
| Viết User Stories                          | C  | C  | C   | –   | C   | –   | –  | C  | A  | –  |
| Viết Acceptance Criteria                   | I  | C  | C   | C   | C   | C   | –  | R  | A  | –  |
| Cập nhật DOMAIN.md                         | I  | C  | C   | C   | –   | –   | –  | –  | A  | –  |
| Cập nhật API_CONTRACT.md                   | I  | C  | R   | R   | I   | I   | –  | C  | A  | –  |
| Cập nhật DB_SCHEMA.md                      | I  | C  | R   | R   | –   | –   | –  | –  | A  | –  |
| Domain model & Entity design               | I  | A  | R   | R   | I   | I   | –  | –  | C  | –  |
| API design (REST endpoints)                | I  | A  | R   | R   | C   | C   | –  | C  | C  | –  |
| Pre-order state machine design             | I  | A  | R   | C   | –   | –   | –  | C  | C  | –  |
| Ledger design (Inventory/Points)           | I  | A  | R   | R   | –   | –   | –  | C  | C  | –  |
| Đặc tả tính năng AI (prompts)              | C  | C  | R   | –   | –   | –   | –  | –  | A  | –  |
| Đặc tả tích hợp Facebook                  | I  | C  | –   | R   | –   | –   | –  | –  | A  | –  |

---

## 5. RACI Matrix — UX/UI Design

| Hoạt động                                  | PM | TL | BE1 | BE2 | FE1 | FE2 | UX | QA | PO | DO |
|--------------------------------------------|----|----|-----|-----|-----|-----|----|----|----|----|
| UX Research & User Interview               | C  | –  | –   | –   | –   | –   | A  | –  | R  | –  |
| Information Architecture                   | I  | I  | –   | –   | C   | C   | A  | –  | C  | –  |
| Wireframe (Low-fidelity)                   | I  | I  | –   | –   | C   | C   | A  | –  | C  | –  |
| UI Design System / Tokens                  | I  | I  | –   | –   | C   | C   | A  | –  | I  | –  |
| High-fidelity Mockup                       | I  | I  | –   | –   | C   | C   | A  | I  | C  | –  |
| Prototype (interactive)                    | I  | I  | –   | –   | C   | C   | A  | C  | C  | –  |
| Design Review / Feedback session           | C  | I  | –   | –   | C   | C   | A  | –  | R  | –  |
| Responsive design spec                     | I  | I  | –   | –   | R   | R   | A  | C  | I  | –  |
| Accessibility (WCAG) check                 | I  | C  | –   | –   | R   | R   | A  | C  | I  | –  |
| Icon & asset export                        | –  | –  | –   | –   | I   | I   | A  | –  | –  | –  |
| Design Handoff (Figma/Zeplin)              | –  | I  | –   | –   | R   | R   | A  | –  | I  | –  |
| Admin Panel UX review                      | C  | I  | –   | –   | C   | C   | A  | C  | R  | –  |
| Public Catalog UX review                   | C  | I  | –   | –   | C   | C   | A  | C  | R  | –  |
| SpinViewer 360° UX spec                    | I  | C  | –   | –   | R   | C   | A  | C  | C  | –  |

---

## 6. RACI Matrix — Backend Development

| Hoạt động                                        | PM | TL | BE1 | BE2 | FE1 | FE2 | UX | QA | PO | DO |
|--------------------------------------------------|----|----|-----|-----|-----|-----|----|----|----|----|
| Prisma schema design & migration                 | –  | C  | A   | C   | –   | –   | –  | I  | I  | –  |
| Auth module (JWT cookie, CSRF)                   | I  | A  | C   | R   | I   | I   | –  | C  | I  | –  |
| RBAC & TenantGuard implementation                | I  | A  | R   | C   | I   | I   | –  | C  | I  | –  |
| Items module (CRUD, status, soft delete)         | I  | C  | A   | C   | I   | I   | –  | C  | I  | –  |
| Image upload & StorageService                    | I  | C  | C   | A   | I   | I   | –  | C  | I  | –  |
| SpinSet/SpinFrame module                         | I  | C  | A   | R   | I   | I   | –  | C  | I  | –  |
| Signed media URL (HMAC)                          | I  | A  | R   | C   | I   | I   | –  | I  | –  | –  |
| Public catalog API (unauthenticated)             | I  | C  | A   | C   | I   | I   | –  | C  | C  | –  |
| Pre-order module (state machine)                 | I  | C  | A   | R   | I   | I   | –  | C  | C  | –  |
| Inventory ledger (InventoryTransaction)          | I  | C  | A   | R   | I   | I   | –  | C  | C  | –  |
| Members module                                   | I  | C  | A   | C   | I   | I   | –  | C  | C  | –  |
| MemberPointsLedger service                       | I  | C  | C   | A   | I   | I   | –  | C  | C  | –  |
| Reports & Analytics API                          | I  | C  | A   | R   | I   | I   | –  | C  | C  | –  |
| AI service (Claude API integration)              | I  | A  | R   | C   | I   | I   | –  | C  | C  | –  |
| Facebook Graph API integration                   | I  | C  | C   | A   | I   | I   | –  | C  | C  | –  |
| Rate limiting & throttling                       | I  | A  | R   | C   | –   | –   | –  | I  | –  | –  |
| Error handling & global exception filter         | I  | A  | R   | R   | I   | I   | –  | C  | –  | –  |
| Swagger / OpenAPI documentation                  | I  | C  | R   | R   | C   | C   | –  | I  | I  | –  |
| Unit tests (backend)                             | –  | C  | R   | R   | –   | –   | –  | A  | –  | –  |
| Integration tests                                | –  | C  | R   | R   | –   | –   | –  | A  | –  | –  |

---

## 7. RACI Matrix — Frontend Development

| Hoạt động                                        | PM | TL | BE1 | BE2 | FE1 | FE2 | UX | QA | PO | DO |
|--------------------------------------------------|----|----|-----|-----|-----|-----|----|----|----|----|
| Project setup (Vite, React, TanStack, Tailwind)  | –  | C  | –   | –   | A   | C   | –  | –  | –  | –  |
| Routing (React Router)                           | –  | C  | –   | –   | A   | R   | –  | –  | –  | –  |
| Authentication flow (cookie, refresh)            | –  | C  | C   | C   | A   | R   | –  | C  | –  | –  |
| API client layer (TanStack Query)                | –  | C  | C   | C   | A   | R   | –  | –  | –  | –  |
| Admin Items list & filter UI                     | –  | I  | I   | –   | A   | C   | C  | C  | I  | –  |
| Create/Edit Item form                            | –  | I  | I   | –   | C   | A   | C  | C  | I  | –  |
| Image upload UI (drag-drop, preview)             | –  | I  | I   | C   | A   | C   | C  | C  | I  | –  |
| SpinSet upload & frame reorder UI                | –  | C  | C   | C   | A   | C   | C  | C  | I  | –  |
| SpinViewer 360° component                        | –  | C  | –   | –   | A   | C   | C  | C  | I  | –  |
| Public catalog page                              | –  | I  | I   | –   | A   | C   | C  | C  | C  | –  |
| Public item detail page                          | –  | I  | I   | –   | C   | A   | C  | C  | C  | –  |
| Public pre-order form                            | –  | I  | C   | C   | A   | C   | C  | C  | C  | –  |
| Admin pre-order management UI                    | –  | I  | C   | C   | C   | A   | C  | C  | C  | –  |
| Members & points UI                              | –  | I  | C   | C   | A   | C   | C  | C  | C  | –  |
| Reports & charts dashboard                       | –  | I  | C   | C   | A   | R   | C  | C  | C  | –  |
| AI description button & preview UI               | –  | I  | C   | –   | C   | A   | C  | C  | I  | –  |
| Facebook integration UI                          | –  | I  | –   | C   | A   | C   | C  | C  | I  | –  |
| Responsive design implementation                 | –  | I  | –   | –   | R   | R   | A  | C  | –  | –  |
| Loading states, error boundaries, empty states   | –  | C  | –   | –   | A   | R   | C  | C  | –  | –  |
| SEO meta tags (og:image, og:title)               | –  | I  | –   | –   | A   | C   | C  | –  | I  | –  |

---

## 8. RACI Matrix — Quality Assurance

| Hoạt động                                    | PM | TL | BE1 | BE2 | FE1 | FE2 | UX | QA | PO | DO |
|----------------------------------------------|----|----|-----|-----|-----|-----|----|----|----|----|
| Lập Test Plan                                | I  | C  | C   | C   | C   | C   | –  | A  | C  | –  |
| Viết Test Cases (functional)                 | –  | C  | C   | C   | C   | C   | –  | A  | C  | –  |
| Viết E2E Tests (Playwright)                  | –  | C  | I   | I   | C   | C   | –  | A  | I  | –  |
| Unit Test review                             | –  | A  | R   | R   | R   | R   | –  | C  | –  | –  |
| Manual testing (functional)                  | –  | I  | I   | I   | I   | I   | –  | A  | C  | –  |
| Regression testing                           | –  | I  | I   | I   | I   | I   | –  | A  | I  | –  |
| API testing (Postman / curl)                 | –  | C  | R   | R   | –   | –   | –  | A  | –  | –  |
| Performance / Load testing                   | –  | C  | C   | –   | –   | –   | –  | A  | –  | R  |
| Security testing (CSRF, auth)                | –  | A  | R   | R   | –   | –   | –  | R  | –  | C  |
| Bug triage & prioritization                  | C  | C  | C   | C   | C   | C   | –  | A  | C  | –  |
| Bug verification & sign-off                  | –  | I  | I   | I   | I   | I   | –  | A  | I  | –  |
| UAT coordination                             | C  | –  | –   | –   | –   | –   | –  | A  | R  | –  |
| UAT execution (với shop owner)               | I  | –  | –   | –   | –   | –   | –  | C  | A  | –  |
| Acceptance Sign-off                          | A  | C  | –   | –   | –   | –   | –  | C  | R  | –  |
| Test coverage report                         | I  | C  | I   | I   | I   | I   | –  | A  | I  | –  |

---

## 9. RACI Matrix — DevOps & Infrastructure

| Hoạt động                                        | PM | TL | BE1 | BE2 | FE1 | FE2 | UX | QA | PO | DO |
|--------------------------------------------------|----|----|-----|-----|-----|-----|----|----|----|----|
| CI/CD pipeline thiết lập (GitHub Actions)        | I  | C  | C   | C   | C   | C   | –  | C  | –  | A  |
| Docker / container setup (local dev)             | I  | C  | C   | C   | C   | C   | –  | –  | –  | A  |
| Raspberry Pi server setup                        | I  | C  | –   | –   | –   | –   | –  | –  | –  | A  |
| Cloudflare Tunnel configuration                  | I  | C  | –   | –   | –   | –   | –  | –  | –  | A  |
| Neon PostgreSQL setup & config                   | I  | C  | R   | C   | –   | –   | –  | –  | –  | A  |
| Cloudflare R2 bucket setup                       | I  | C  | –   | C   | –   | –   | –  | –  | –  | A  |
| Cloudflare Pages deployment                      | I  | I  | –   | –   | C   | C   | –  | –  | –  | A  |
| Environment variables management                 | I  | C  | R   | R   | R   | R   | –  | –  | –  | A  |
| Database backup & restore                        | I  | C  | C   | –   | –   | –   | –  | C  | –  | A  |
| Monitoring & alerting setup                      | I  | C  | –   | –   | –   | –   | –  | C  | –  | A  |
| Log aggregation                                  | I  | C  | R   | R   | –   | –   | –  | I  | –  | A  |
| Security hardening (server)                      | I  | C  | I   | I   | –   | –   | –  | C  | –  | A  |
| Rollback procedure                               | I  | C  | C   | C   | –   | –   | –  | C  | –  | A  |
| Staging environment management                   | I  | C  | C   | C   | C   | C   | –  | R  | –  | A  |
| Production deployment                            | I  | A  | C   | C   | C   | C   | –  | C  | –  | R  |
| Post-deployment smoke test                       | –  | C  | C   | C   | C   | C   | –  | A  | –  | R  |
| SSL/TLS certificate management                   | I  | I  | –   | –   | –   | –   | –  | –  | –  | A  |

---

## 10. RACI Matrix — Documentation

| Hoạt động                                    | PM | TL | BE1 | BE2 | FE1 | FE2 | UX | QA | PO | DO |
|----------------------------------------------|----|----|-----|-----|-----|-----|----|----|----|----|
| CLAUDE.md (project guidelines)               | C  | A  | C   | C   | C   | C   | –  | –  | C  | –  |
| AGENTS.md (environment & commands)           | C  | A  | R   | R   | R   | R   | –  | –  | –  | R  |
| DOMAIN.md (business entities & rules)        | I  | C  | C   | C   | –   | –   | –  | –  | A  | –  |
| DB_SCHEMA.md                                 | I  | C  | A   | R   | –   | –   | –  | –  | C  | –  |
| API_CONTRACT.md                              | I  | C  | A   | R   | C   | C   | –  | C  | C  | –  |
| ARCHITECTURE.md                              | I  | A  | R   | C   | C   | C   | –  | –  | I  | C  |
| ENV.md                                       | I  | C  | R   | R   | R   | R   | –  | –  | –  | A  |
| ERROR_HANDLING.md                            | I  | C  | A   | R   | I   | I   | –  | C  | –  | –  |
| User Guide (cho shop admin)                  | R  | I  | –   | –   | –   | –   | C  | C  | A  | –  |
| Training materials (video, slides)           | R  | I  | –   | –   | –   | –   | C  | –  | A  | –  |
| Technical Runbook                            | I  | A  | C   | C   | –   | –   | –  | –  | –  | R  |
| Release Notes                                | A  | C  | C   | C   | C   | C   | –  | C  | R  | –  |
| PM Documents (charter, plan, RACI...)        | A  | C  | –   | –   | –   | –   | –  | –  | C  | –  |

---

## 11. Tóm Tắt Trách Nhiệm Theo Vai Trò

### PM — Project Manager
- **Accountable:** Tất cả hoạt động quản lý dự án, báo cáo tiến độ, budget, risk register.
- **Responsible:** Daily standup facilitation, báo cáo stakeholders.
- **Key decisions:** Scope, timeline, escalation.

### TL — Tech Lead
- **Accountable:** Kiến trúc kỹ thuật, code quality, security design, production deployment decisions.
- **Responsible:** Code review, technical mentoring.
- **Key decisions:** Tech stack, API design, database design.

### BE1 — Backend Developer 1
- **Accountable:** Items module, public catalog API, inventory ledger, AI service, Prisma schema.
- **Focus area:** Core CRUD, tenant isolation, AI integration.

### BE2 — Backend Developer 2
- **Accountable:** Auth module, image upload/StorageService, points ledger, Facebook integration.
- **Focus area:** Auth/security, media, third-party APIs.

### FE1 — Frontend Developer 1
- **Accountable:** Admin Items UI, SpinViewer component, public catalog, reports dashboard.
- **Focus area:** Core admin screens, public-facing pages, data visualization.

### FE2 — Frontend Developer 2
- **Accountable:** Item form, pre-order management UI, AI description UI, public pre-order form.
- **Focus area:** Forms, workflows, interactive UI.

### UX — UI/UX Designer
- **Accountable:** Tất cả design artifacts (wireframe, mockup, design system, handoff).
- **Focus area:** User experience, visual design, accessibility.

### QA — QA Engineer
- **Accountable:** Test plan, E2E test suite (Playwright), bug triage, UAT, test coverage.
- **Focus area:** Quality gate, regression, acceptance.

### PO — BA / Product Owner
- **Accountable:** Backlog grooming, user stories, acceptance criteria, domain documentation, UAT.
- **Focus area:** Requirements, product vision, stakeholder voice.

### DO — DevOps Engineer
- **Accountable:** Infrastructure, CI/CD, deployment, monitoring, backup.
- **Focus area:** Reliability, security hardening, automated pipeline.

---

*RACI Matrix này được review mỗi Phase. Thay đổi vai trò phải được PM và tất cả affected parties đồng ý.*

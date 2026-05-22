---
title: "Tài Liệu Bàn Giao Dự Án - Project Handover Document"
document_id: "38"
version: "1.0"
date: "2026-05-22"
author: "PM & Tech Lead - Diecast360"
status: "Final"
---

# Tài Liệu Bàn Giao Dự Án — Diecast360

## Mục Lục

1. [Tổng Kết Dự Án](#1-tổng-kết-dự-án)
2. [Danh Mục Bàn Giao (Deliverables)](#2-danh-mục-bàn-giao)
3. [Checklist Bàn Giao Quyền Truy Cập](#3-checklist-bàn-giao-quyền-truy-cập)
4. [Vị Trí Secrets và Credentials](#4-vị-trí-secrets-và-credentials)
5. [Kế Hoạch Chuyển Giao Kiến Thức](#5-kế-hoạch-chuyển-giao-kiến-thức)
6. [Nợ Kỹ Thuật và Vấn Đề Còn Tồn Đọng](#6-nợ-kỹ-thuật-và-vấn-đề-còn-tồn-đọng)
7. [Điều Khoản Bảo Hành](#7-điều-khoản-bảo-hành)
8. [Liên Hệ Sau Bàn Giao](#8-liên-hệ-sau-bàn-giao)
9. [Biên Bản Ký Kết](#9-biên-bản-ký-kết)

---

## 1. Tổng Kết Dự Án

### Thông tin chung

| Hạng mục | Thông tin |
|---------|----------|
| **Tên dự án** | Diecast360 — Ứng dụng quản lý & bán mô hình xe diecast 1:64 |
| **Thời gian** | 10/2025 – 05/2026 (7 tháng) |
| **Team** | 10 người (PM, Tech Lead, 2 Backend, 2 Frontend, DevOps, QA, UI/UX, BA/PO) |
| **Phiên bản bàn giao** | v1.0.0 (Production Release) |
| **Ngày bàn giao** | 2026-05-22 |

### Những gì đã xây dựng

Diecast360 là ứng dụng web đa tenant, cho phép nhiều shop cùng vận hành trên một nền tảng, với các tính năng chính:

**Core Features đã hoàn thành:**

| Module | Tính năng | Trạng thái |
|--------|---------|-----------|
| Auth & RBAC | Login, CSRF, JWT cookie, phân quyền 3 tầng | ✅ Hoàn thành |
| Multi-tenant | TenantGuard, shop isolation, switch-shop | ✅ Hoàn thành |
| Items/Products | CRUD, soft delete, ảnh gallery, trạng thái kho | ✅ Hoàn thành |
| SpinSet 360° | Upload frame, reorder, viewer | ✅ Hoàn thành |
| Pre-Order | State machine, ledger points tích hợp | ✅ Hoàn thành |
| Inventory | Stock in/out/adjustment, ledger, reconciliation | ✅ Hoàn thành |
| Members | CRUD, tier tự động, điểm ledger | ✅ Hoàn thành |
| Reports | Summary dashboard, trends charts | ✅ Hoàn thành |
| AI Features | Mô tả AI, caption Facebook AI, import từ ảnh | ✅ Hoàn thành |
| Facebook | Caption copy, auto-post, link lưu | ✅ Hoàn thành |
| Storage | Local + Cloudflare R2, signed URLs | ✅ Hoàn thành |
| Public Catalog | Item public, shop contact, SpinViewer public | ✅ Hoàn thành |
| Platform Admin | Shop management, platform_super | ✅ Hoàn thành |

**Số liệu kỹ thuật:**
- 53 Playwright E2E tests
- 40 tài liệu kỹ thuật và vận hành
- ~15,000 dòng code backend (NestJS)
- ~20,000 dòng code frontend (React)
- 18 Prisma migrations
- 12 Prisma models

---

## 2. Danh Mục Bàn Giao

### 2.1 Source Code

| Repository | Branch | Commit cuối | Ghi chú |
|-----------|--------|-------------|---------|
| `github.com/org/diecast360` | `main` | `37235e6` | Monorepo (backend + frontend) |

**Cấu trúc monorepo:**
```
diecast360/
├── backend/          # NestJS 11 API
│   ├── src/
│   ├── prisma/
│   └── test/
├── frontend/         # React 19 + Vite
│   ├── src/
│   └── e2e/          # Playwright tests
├── docs/             # 40 tài liệu
│   ├── project-docs/ # Tài liệu bàn giao theo nhóm
│   ├── DOMAIN.md
│   ├── DB_SCHEMA.md
│   ├── API_CONTRACT.md
│   ├── ARCHITECTURE.md
│   ├── ENV.md
│   └── ERROR_HANDLING.md
├── CLAUDE.md         # AI coding guidelines
└── AGENTS.md         # Environment & commands
```

### 2.2 Tài Liệu Kỹ Thuật (40 files)

| Nhóm | Files | Mô tả |
|------|-------|-------|
| Group 1 - PM | docs 01-07 | Kế hoạch, timeline, stakeholder, risk |
| Group 2 - Product | docs 08-14 | PRD, user stories, acceptance criteria |
| Group 3 - Technical | docs 15-21 | Architecture, API contract, DB schema |
| Group 4 - Design | docs 22-28 | UI/UX, wireframes, design system |
| Group 5 - DevOps | docs 29-31 | CI/CD, deployment, environments |
| Group 6 - QA | docs 32-34 | Test plan, E2E coverage, test cases |
| Group 7 - Handover | docs 35-40 | Sysadmin, user manual, runbook, SLA |

### 2.3 Database

- **Schema**: 18 migrations đã áp dụng, file tại `backend/prisma/migrations/`
- **Seed data**: `backend/prisma/seed.ts` (tạo dữ liệu demo)
- **Production DB**: Neon PostgreSQL (xem thông tin truy cập ở phần 3)

### 2.4 Test Suite

- **Framework**: Playwright v1.x
- **Số tests**: 53 E2E tests
- **Location**: `frontend/e2e/`
- **Coverage**: Auth, Items, SpinSet, Pre-Order, Inventory, Members, Reports, AI
- **CI**: Chạy tự động trên mỗi PR qua GitHub Actions

### 2.5 Cấu Hình Deployment

| File | Vị trí | Mô tả |
|------|-------|-------|
| `ecosystem.config.js` | Server: `/home/pi/diecast360/backend/` | PM2 config |
| `.env` (production) | Server: `/home/pi/diecast360/backend/` | Env vars |
| `wrangler.toml` | `frontend/` | Cloudflare Pages config |
| `cloudflared config` | Server: `/home/pi/.cloudflared/config.yml` | Tunnel config |
| GitHub Actions | `.github/workflows/` | CI/CD pipeline |

---

## 3. Checklist Bàn Giao Quyền Truy Cập

Mỗi mục phải được bàn giao và xác nhận bởi người nhận trước khi ký biên bản.

### 3.1 Infrastructure & Code

- [ ] **GitHub Repository** — Add người nhận làm Admin/Owner
  - URL: `https://github.com/org/diecast360`
  - Người bàn giao: Tech Lead
  - Người nhận: _______________

- [ ] **Server SSH Access** (Raspberry Pi / VPS)
  - IP: _______________ (xem trong tài liệu nội bộ)
  - SSH Key: generate key mới cho người nhận, xóa key của team cũ
  - Người bàn giao: DevOps
  - Người nhận: _______________

### 3.2 Cloudflare

- [ ] **Cloudflare Account** (Pages + R2 + DNS + Tunnel)
  - Email account: _______________
  - Thêm người nhận làm Member/Admin trên Cloudflare account
  - Người bàn giao: DevOps
  - Người nhận: _______________

- [ ] **Cloudflare Pages** — Dự án `diecast360-frontend`
  - Production URL: `https://app.diecast360.com`
  - Người bàn giao: DevOps
  - Người nhận: _______________

- [ ] **Cloudflare R2** — Bucket `diecast360-prod`
  - Tạo API token mới cho người nhận
  - Thu hồi token cũ của team
  - Người bàn giao: DevOps
  - Người nhận: _______________

### 3.3 Database

- [ ] **Neon Database Console**
  - URL: `https://console.neon.tech`
  - Project: `diecast360`
  - Mời người nhận làm project member
  - Người bàn giao: Backend Dev
  - Người nhận: _______________

### 3.4 External Services

- [ ] **OpenAI API Account**
  - URL: `https://platform.openai.com`
  - Tạo API key mới cho người nhận
  - Thu hồi key cũ
  - Người bàn giao: Tech Lead
  - Người nhận: _______________

- [ ] **Pinecone Account**
  - URL: `https://app.pinecone.io`
  - Index: `diecast360-items`
  - Mời người nhận làm project member
  - Người bàn giao: Backend Dev
  - Người nhận: _______________

- [ ] **Facebook Developer App**
  - App ID: (xem trong .env)
  - Thêm người nhận làm Admin của App
  - Hướng dẫn gia hạn token
  - Người bàn giao: Backend Dev / BA
  - Người nhận: _______________

### 3.5 Domain & DNS

- [ ] **Domain Management** (nơi quản lý domain `diecast360.com`)
  - Registrar: _______________
  - Chuyển quyền sở hữu domain
  - Người bàn giao: PM
  - Người nhận: _______________

### 3.6 GitHub Actions Secrets

Các secrets được cấu hình trên GitHub Actions (không cần bàn giao thủ công nếu người nhận đã có quyền repo Admin):

| Secret | Mô tả |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Deploy Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account |
| `DATABASE_URL` | Neon connection (cho CI) |
| `DIRECT_URL` | Neon direct connection |

---

## 4. Vị Trí Secrets và Credentials

> **Bảo mật**: Phần này chỉ ghi vị trí, **KHÔNG ghi giá trị thực** của credentials.

### Trên Server Production

```
/home/pi/diecast360/backend/.env
```

Nội dung gồm các biến (tham khảo `docs/ENV.md` để giải thích chi tiết):
- `DATABASE_URL`, `DIRECT_URL` (Neon)
- `JWT_SECRET`, `COOKIE_SECRET`
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`
- `MEDIA_SIGNING_SECRET`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_PAGE_ACCESS_TOKEN`
- `CORS_ORIGINS`

### Trên Server — PM2 Config

```
/home/pi/diecast360/backend/ecosystem.config.js
```

### Password Manager (Team)

Tất cả passwords và credentials nhạy cảm được lưu trong **[tên password manager đang dùng]**:
- Vault: `Diecast360 Production`
- Người nhận quyền truy cập: _______________
- Ngày bàn giao: _______________

### GitHub Actions Secrets

Xem trong Settings → Secrets and variables → Actions của repository.

---

## 5. Kế Hoạch Chuyển Giao Kiến Thức

### Session 1: Architecture Walkthrough (2 giờ)

**Người trình bày**: Tech Lead
**Người tham dự**: Dev nhận bàn giao (backend + frontend)
**Thời gian dự kiến**: Tuần 1 sau bàn giao

**Nội dung:**
- [ ] Giới thiệu tổng quan kiến trúc hệ thống (xem `docs/ARCHITECTURE.md`)
- [ ] Walkthrough backend: modules, guards, pipes, middleware
- [ ] Multi-tenant pattern và TenantGuard
- [ ] Pre-order state machine implementation
- [ ] Storage abstraction (local vs R2)
- [ ] AI integration (OpenAI + Pinecone)
- [ ] Q&A

**Materials**: `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/DOMAIN.md`

---

### Session 2: Admin Usage Training (3 giờ)

**Người trình bày**: BA/PO
**Người tham dự**: Shop Owners, Shop Admins (end users)
**Thời gian dự kiến**: Tuần 1-2 sau bàn giao

**Nội dung:**
- [ ] Giới thiệu giao diện và điều hướng (xem `docs/36_user_manual.md`)
- [ ] Demo: Tạo và quản lý sản phẩm
- [ ] Demo: SpinSet 360° workflow
- [ ] Demo: Pre-order từ đầu đến cuối
- [ ] Demo: Quản lý hội viên và điểm tích lũy
- [ ] Demo: Báo cáo và xuất CSV
- [ ] Demo: Tính năng AI (caption, mô tả, import ảnh)
- [ ] Câu hỏi thực hành: mỗi người tự tạo 1 sản phẩm và 1 pre-order

**Materials**: `docs/36_user_manual.md`, tài khoản demo trên staging

---

### Session 3: DevOps Handover (2 giờ)

**Người trình bày**: DevOps
**Người tham dự**: Ops team / người vận hành hệ thống
**Thời gian dự kiến**: Tuần 1 sau bàn giao

**Nội dung:**
- [ ] SSH vào server, cấu trúc thư mục
- [ ] PM2: start/stop/restart/logs/monitor (xem `docs/35_system_admin_guide.md`)
- [ ] Cloudflared tunnel: quản lý, restart
- [ ] Database: connect, backup thủ công, verify backup
- [ ] Deploy code mới (pull → build → reload PM2)
- [ ] Runbook walkthrough: INC-01 đến INC-05 (xem `docs/37_maintenance_runbook.md`)
- [ ] Thực hành: người nhận tự restart PM2 và verify health

**Materials**: `docs/35_system_admin_guide.md`, `docs/37_maintenance_runbook.md`

---

### Session 4: QA Handover (1.5 giờ)

**Người trình bày**: QA Lead
**Người tham dự**: Support team / QA nhận bàn giao
**Thời gian dự kiến**: Tuần 2 sau bàn giao

**Nội dung:**
- [ ] Overview 53 Playwright E2E tests
- [ ] Cách chạy test suite locally
- [ ] Cách đọc kết quả test (pass/fail/flaky)
- [ ] Quy trình báo cáo bug (template, severity, steps to reproduce)
- [ ] Known issues và workarounds
- [ ] Escalation path khi phát hiện bug mới

**Materials**: `docs/32_test_plan.md` (nếu có), `docs/33_e2e_coverage.md`, Playwright reports

---

## 6. Nợ Kỹ Thuật và Vấn Đề Còn Tồn Đọng

### Đã biết — cần xử lý sớm (Priority High)

| ID | Vấn đề | Tác động | Ước tính |
|----|--------|---------|---------|
| TD-01 | Frontend có một số pre-existing ESLint warnings chưa fix | Không ảnh hưởng chức năng, chỉ là code quality | 2-4 giờ |
| TD-02 | Chưa có password reset flow tự động (hiện phải reset thủ công qua DB) | Trải nghiệm người dùng kém khi quên mật khẩu | 1-2 ngày |
| TD-03 | Neon free tier bị "wakeup delay" 2-5 giây sau khi idle | Lần đầu tiên gọi API sau idle period chậm | Workaround: cronjob ping (xem runbook) |

### Tính năng chưa làm — Deferred

| ID | Tính năng | Lý do defer | Ghi chú |
|----|---------|------------|---------|
| DEF-01 | Email notifications (đơn hàng, điểm tích lũy) | Out of scope v1 | Cần SMTP setup |
| DEF-02 | Mobile app (iOS/Android) | Out of scope v1 | PWA là phương án tạm |
| DEF-03 | Multi-currency support | Out of scope (VNĐ only) | Không cần trong tương lai gần |
| DEF-04 | Advanced analytics (Google Analytics, custom events) | Out of scope v1 | Cloudflare Analytics cơ bản đang dùng |
| DEF-05 | Import hàng loạt từ CSV | Out of scope v1 | Import từng item hoặc AI Draft |
| DEF-06 | Payment gateway integration | Ngoài scope (thanh toán offline) | Phải làm nếu muốn online checkout |

### Lưu Ý Vận Hành

- **Neon free tier limit**: 0.5 CU compute, 3 GB storage, 20 connections. Nếu shop phát triển, cần nâng plan.
- **Sharp concurrency**: Giới hạn ở 1 (fix từ 12/2025). Xử lý ảnh tuần tự — upload nhiều ảnh cùng lúc sẽ chậm hơn song song.
- **Facebook token**: Phải gia hạn mỗi 45-60 ngày. Đặt lịch nhắc.

---

## 7. Điều Khoản Bảo Hành

### Phạm Vi Bảo Hành

Trong vòng **30 ngày** kể từ ngày bàn giao (đến **2026-06-21**), team Diecast360 cam kết:

**Được hỗ trợ miễn phí:**
- Sửa bug (defect) được xác nhận là lỗi từ phía phát triển
- Hỗ trợ kỹ thuật qua email/Zalo trong giờ hành chính (9:00-18:00 GMT+7, thứ 2-6)
- Hỗ trợ deploy emergency patch cho lỗi nghiêm trọng (P1/P2)

**Không thuộc phạm vi bảo hành:**
- Thêm tính năng mới hoặc thay đổi yêu cầu
- Lỗi do sử dụng sai quy trình (user error)
- Sự cố từ dịch vụ bên thứ ba (Neon, Cloudflare, OpenAI, Facebook)
- Thay đổi cấu hình môi trường do phía khách hàng tự thực hiện
- Sự cố sau khi khách hàng tự sửa code

### SLA Bảo Hành

| Mức độ | Thời gian phản hồi | Thời gian xử lý |
|--------|-------------------|----------------|
| P1 - Hệ thống không vào được | 2 giờ | 8 giờ |
| P2 - Tính năng chính bị lỗi | 4 giờ (giờ HC) | 24 giờ |
| P3 - Lỗi nhỏ, có workaround | Ngày hôm sau | 72 giờ |

---

## 8. Liên Hệ Sau Bàn Giao

| Vai trò | Họ tên | Email | Zalo/Phone | Thời gian phản hồi |
|---------|--------|-------|-----------|------------------|
| Tech Lead | [Tên] | tl@company.com | 09xxxxxxxx | Trong giờ HC |
| Backend Lead | [Tên] | be@company.com | 09xxxxxxxx | Trong giờ HC |
| DevOps | [Tên] | devops@company.com | 09xxxxxxxx | Trong giờ HC |
| PM | [Tên] | pm@company.com | 09xxxxxxxx | Trong giờ HC |

**Kênh liên hệ chính**: Email `support@diecast360.com` hoặc nhóm Zalo đã tạo.

---

## 9. Biên Bản Ký Kết

### Xác Nhận Bàn Giao

Chúng tôi xác nhận rằng tất cả các hạng mục trong tài liệu này đã được bàn giao đầy đủ.

---

**Bên bàn giao — Diecast360 Dev Team**

| Họ tên | Vai trò | Chữ ký | Ngày |
|--------|---------|--------|------|
| | Tech Lead | | |
| | PM | | |
| | DevOps | | |

---

**Bên nhận — Khách hàng / Đội vận hành**

| Họ tên | Vai trò | Chữ ký | Ngày |
|--------|---------|--------|------|
| | Đại diện bên nhận | | |
| | Kỹ thuật vận hành | | |

---

*Biên bản này có hiệu lực kể từ ngày ký. Bên nhận xác nhận đã nhận đầy đủ tài liệu, quyền truy cập, và được tham gia đầy đủ các session chuyển giao kiến thức.*

*Mọi tranh chấp liên quan đến phạm vi bàn giao sẽ được giải quyết dựa trên tài liệu này.*

---

*Tài liệu bàn giao v1.0 — Ngày: 2026-05-22*

---
title: "Non-Functional Requirements"
document_id: "DOC-20"
version: "1.0.0"
created_date: "2026-05-22"
author: "Tech Lead / Solution Architect"
status: "Approved"
---

# 20. Non-Functional Requirements (NFR) — Diecast360

## Mục lục
1. [Performance](#1-performance)
2. [Security](#2-security)
3. [Scalability](#3-scalability)
4. [Availability & Reliability](#4-availability--reliability)
5. [Usability](#5-usability)
6. [Maintainability](#6-maintainability)
7. [Compatibility](#7-compatibility)
8. [Data Integrity](#8-data-integrity)
9. [NFR Summary Table](#9-nfr-summary-table)

---

## 1. Performance

### NFR-PERF-01: API Response Time

| ID | NFR-PERF-01 |
|----|-------------|
| **Category** | Performance |
| **Requirement** | Thời gian phản hồi API (read operations) phải dưới ngưỡng quy định |
| **Metric / Target** | p50 < 100ms, p95 < 300ms, p99 < 1000ms |
| **Scope** | Tất cả GET endpoints, đo tại server (không tính network latency) |
| **Verification** | Load test với k6: 50 VUs, 5 phút sustained; APM monitoring (Prometheus/Grafana) |
| **Exclusions** | AI endpoints (GPT API call có thể > 5s — xem NFR-PERF-04) |

---

### NFR-PERF-02: Image Processing Throughput

| ID | NFR-PERF-02 |
|----|-------------|
| **Category** | Performance |
| **Requirement** | Upload và xử lý 1 ảnh (full + thumbnail) hoàn thành trong thời gian quy định |
| **Metric / Target** | < 5 giây cho file JPEG 5MB (Sharp resize + WebP conversion) |
| **Scope** | POST /items/:id/images, POST /spinner/:setId/frames |
| **Verification** | Manual test với file ảnh lớn nhất (MAX_UPLOAD_MB); CI upload test |
| **Notes** | Sharp.concurrency(2) trên RPi 5 — cần test thực tế trên hardware đích |

---

### NFR-PERF-03: 360° Viewer Preload

| ID | NFR-PERF-03 |
|----|-------------|
| **Category** | Performance |
| **Requirement** | 360° spinner phải bắt đầu interactive trong thời gian hợp lý |
| **Metric / Target** | First frame hiển thị < 500ms; Toàn bộ 24 frames preloaded < 5s (broadband) |
| **Scope** | SpinViewer component, frame loading strategy |
| **Verification** | Lighthouse performance test; manual test trên 4G mobile |
| **Implementation** | Lazy load frames sau first frame; thumbnail trước, full frame sau |

---

### NFR-PERF-04: AI Endpoint Timeout

| ID | NFR-PERF-04 |
|----|-------------|
| **Category** | Performance |
| **Requirement** | AI endpoints phải có timeout và feedback rõ ràng cho user |
| **Metric / Target** | Client timeout: 30s; Server-side: 25s timeout với OpenAI API |
| **Scope** | POST /ai/ai-description, POST /ai/fb-post |
| **Verification** | Mock OpenAI slow response test; verify loading state hiển thị |

---

### NFR-PERF-05: Database Query Performance

| ID | NFR-PERF-05 |
|----|-------------|
| **Category** | Performance |
| **Requirement** | Queries phổ biến phải được index phù hợp, không có N+1 |
| **Metric / Target** | Không có query nào > 100ms trong EXPLAIN ANALYZE (production data volume) |
| **Scope** | Tất cả Prisma queries trong Service layer |
| **Verification** | Prisma query logging trong dev; EXPLAIN ANALYZE trên queries phức tạp |
| **Implementation** | Dùng `include` thay vì lazy load; composite indexes cho filter patterns |

---

## 2. Security

### NFR-SEC-01: OWASP Top 10 Compliance

| ID | NFR-SEC-01 |
|----|-------------|
| **Category** | Security |
| **Requirement** | Hệ thống phải phòng chống OWASP Top 10 web vulnerabilities |
| **Metric / Target** | 0 critical/high vulnerabilities trong security audit |
| **Verification** | OWASP ZAP scan; code review checklist; penetration test trước go-live |

**Mapping:**
| OWASP Category | Implementation |
|----------------|----------------|
| A01: Broken Access Control | TenantGuard, RolesGuard, shop_id scoping |
| A02: Cryptographic Failures | HTTPS mandatory, bcrypt, JWT HMAC |
| A03: Injection | Prisma ORM (parameterized), ValidationPipe (whitelist) |
| A04: Insecure Design | State machine validation, RESTRICT FK |
| A05: Security Misconfiguration | Helmet, CORS whitelist, env validation |
| A06: Vulnerable Components | Dependabot alerts, pnpm audit |
| A07: Auth Failures | HttpOnly cookies, token rotation, CSRF |
| A08: Software Integrity | Lockfile (pnpm-lock.yaml), signed commits |
| A09: Logging Failures | shop_audit_logs, structured logging |
| A10: SSRF | Input validation, whitelist external URLs |

---

### NFR-SEC-02: HTTPS Mandatory

| ID | NFR-SEC-02 |
|----|-------------|
| **Category** | Security |
| **Requirement** | Tất cả traffic phải qua HTTPS — không có HTTP fallback |
| **Metric / Target** | 100% requests qua TLS 1.2+ |
| **Verification** | Cloudflare Tunnel config; HSTS header (max-age=31536000) |

---

### NFR-SEC-03: Cookie Security

| ID | NFR-SEC-03 |
|----|-------------|
| **Category** | Security |
| **Requirement** | Auth cookies phải có đầy đủ security attributes |
| **Metric / Target** | HttpOnly=true, Secure=true, SameSite=Strict |
| **Verification** | Browser DevTools check; manual inspection Set-Cookie headers |

---

### NFR-SEC-04: RBAC Enforcement

| ID | NFR-SEC-04 |
|----|-------------|
| **Category** | Security |
| **Requirement** | Mọi mutating endpoint phải enforce RBAC — shop_staff không được write |
| **Metric / Target** | 0 unauthorized write operations; 403 trả về đúng cho shop_staff |
| **Verification** | Integration tests: gọi POST/PATCH/DELETE với shop_staff token → 403 |

---

### NFR-SEC-05: Rate Limiting

| ID | NFR-SEC-05 |
|----|-------------|
| **Category** | Security |
| **Requirement** | Bảo vệ endpoints khỏi brute force và DDoS |
| **Metric / Target** | Global: 300 req/15min/IP; Login: 10 req/min/IP |
| **Verification** | Test vượt giới hạn → 429 RATE_LIMIT_EXCEEDED |

---

### NFR-SEC-06: File Upload Security

| ID | NFR-SEC-06 |
|----|-------------|
| **Category** | Security |
| **Requirement** | Validate và sanitize file uploads để ngăn malicious content |
| **Metric / Target** | Chỉ chấp nhận ALLOWED_MIME types; kích thước ≤ MAX_UPLOAD_MB |
| **Verification** | Test upload file .exe, .php, oversized file → 400/413 |
| **Notes** | Sharp xử lý ảnh loại bỏ EXIF metadata (privacy protection) |

---

### NFR-SEC-07: Secret Management

| ID | NFR-SEC-07 |
|----|-------------|
| **Category** | Security |
| **Requirement** | Secrets không được commit vào git, phải dùng env vars |
| **Metric / Target** | 0 secrets trong git history; .env trong .gitignore |
| **Verification** | git-secrets hoặc truffleHog scan; AGENTS.md checklist |

---

## 3. Scalability

### NFR-SCALE-01: Horizontal Backend Scaling

| ID | NFR-SCALE-01 |
|----|-------------|
| **Category** | Scalability |
| **Requirement** | Backend phải stateless để có thể scale horizontal |
| **Metric / Target** | Không lưu state trong process memory (JWT stateless, không server-side session) |
| **Verification** | Chạy 2 instances PM2 cluster → cùng behavior |
| **Notes** | Rate limiting sẽ cần Redis khi scale > 1 instance |

---

### NFR-SCALE-02: CDN cho Static Assets

| ID | NFR-SCALE-02 |
|----|-------------|
| **Category** | Scalability |
| **Requirement** | Frontend static assets phải được phục vụ qua CDN |
| **Metric / Target** | Cloudflare Pages CDN; TTFB < 50ms globally |
| **Verification** | WebPageTest từ nhiều regions |

---

### NFR-SCALE-03: Media Storage Scalability

| ID | NFR-SCALE-03 |
|----|-------------|
| **Category** | Scalability |
| **Requirement** | Storage layer phải có thể scale không giới hạn |
| **Metric / Target** | Cloudflare R2: unlimited storage; Local FS: bounded bởi disk |
| **Verification** | STORAGE_DRIVER=r2 cho production; Local chỉ cho dev |

---

### NFR-SCALE-04: Database Scaling

| ID | NFR-SCALE-04 |
|----|-------------|
| **Category** | Scalability |
| **Requirement** | Database phải handle concurrent connections từ nhiều users |
| **Metric / Target** | Neon pooler: 25 connections free tier; upgrade plan khi cần |
| **Verification** | Monitor connection count; set alerts khi > 80% |

---

## 4. Availability & Reliability

### NFR-AVAIL-01: Uptime SLA

| ID | NFR-AVAIL-01 |
|----|-------------|
| **Category** | Availability |
| **Requirement** | Backend API uptime target |
| **Metric / Target** | 99.5% monthly uptime (< 3.6 giờ downtime/tháng) |
| **Verification** | UptimeRobot hoặc BetterUptime monitoring; monthly report |
| **Dependencies** | Neon DB (99.9% SLA), Cloudflare (99.9% SLA) |

---

### NFR-AVAIL-02: Graceful Degradation — Spinner Fallback

| ID | NFR-AVAIL-02 |
|----|-------------|
| **Category** | Availability |
| **Requirement** | Nếu không có spin set, hiển thị gallery ảnh thay thế — không hiển thị blank |
| **Metric / Target** | 100% items luôn có fallback hiển thị (ít nhất cover image) |
| **Verification** | Test item không có spin_set → hiển thị image gallery |

---

### NFR-AVAIL-03: PM2 Auto-Restart

| ID | NFR-AVAIL-03 |
|----|-------------|
| **Category** | Reliability |
| **Requirement** | Backend tự restart nếu process crash |
| **Metric / Target** | MTTR < 30 giây sau crash (PM2 restart time) |
| **Verification** | kill -9 process → verify PM2 restart trong < 30s |

---

### NFR-AVAIL-04: Database Migration Safety

| ID | NFR-AVAIL-04 |
|----|-------------|
| **Category** | Reliability |
| **Requirement** | Migrations không gây downtime hoặc data loss |
| **Metric / Target** | 0 data loss; 0 migration-induced outages |
| **Verification** | Review migration SQL trước apply; test trên dev branch Neon trước |
| **Implementation** | Dùng non-blocking index creation (`CONCURRENTLY`); backward-compatible changes |

---

### NFR-AVAIL-05: Soft Delete Data Safety

| ID | NFR-AVAIL-05 |
|----|-------------|
| **Category** | Reliability |
| **Requirement** | Items "đã xóa" phải recoverable trong 30 ngày |
| **Metric / Target** | Soft delete — `deleted_at` không phải hard delete; recovery script available |
| **Verification** | DELETE item → xác nhận record vẫn trong DB; test recovery |

---

## 5. Usability

### NFR-UX-01: Mobile Responsive

| ID | NFR-UX-01 |
|----|-------------|
| **Category** | Usability |
| **Requirement** | UI phải responsive trên tất cả thiết bị phổ biến |
| **Metric / Target** | Hiển thị đúng trên 320px - 2560px viewport width |
| **Verification** | Chrome DevTools responsive test; test trên iPhone SE, iPad, Desktop |

---

### NFR-UX-02: Touch Support cho 360° Viewer

| ID | NFR-UX-02 |
|----|-------------|
| **Category** | Usability |
| **Requirement** | SpinViewer phải hoạt động với touch gesture trên mobile |
| **Metric / Target** | Swipe left/right để rotate; smooth 60fps on modern mobile |
| **Verification** | Test trên iOS Safari, Android Chrome với touch device |

---

### NFR-UX-03: Loading States

| ID | NFR-UX-03 |
|----|-------------|
| **Category** | Usability |
| **Requirement** | Mọi async operation phải có loading state rõ ràng |
| **Metric / Target** | Skeleton loading cho danh sách; spinner cho mutations; 100% coverage |
| **Verification** | Network throttle (Slow 3G) → verify không có blank screens |

---

### NFR-UX-04: Error Messages

| ID | NFR-UX-04 |
|----|-------------|
| **Category** | Usability |
| **Requirement** | Error messages phải có nghĩa với người dùng, không hiển thị technical details |
| **Metric / Target** | Mọi error code phải có user-friendly message mapping trong frontend |
| **Verification** | Force các error states → xem message hiển thị |

---

## 6. Maintainability

### NFR-MAINT-01: Code Standards

| ID | NFR-MAINT-01 |
|----|-------------|
| **Category** | Maintainability |
| **Requirement** | Code phải tuân theo coding standards được định nghĩa |
| **Metric / Target** | 0 ESLint errors (new code); TypeScript strict mode |
| **Verification** | CI lint check trên mọi PR; TypeScript compiler không lỗi |

---

### NFR-MAINT-02: Test Coverage

| ID | NFR-MAINT-02 |
|----|-------------|
| **Category** | Maintainability |
| **Requirement** | Critical business logic phải có test coverage |
| **Metric / Target** | E2E (Playwright): 53 tests pass; Unit: tất cả service methods có test |
| **Verification** | CI test suite: `pnpm test` phải pass; Playwright: 53 specs |

---

### NFR-MAINT-03: Documentation Currency

| ID | NFR-MAINT-03 |
|----|-------------|
| **Category** | Maintainability |
| **Requirement** | Tài liệu phải được cập nhật cùng lúc với code change |
| **Metric / Target** | API_CONTRACT.md, DOMAIN.md cập nhật trong cùng PR với code |
| **Verification** | PR review checklist; reviewer kiểm tra docs update |

---

### NFR-MAINT-04: Environment Configuration

| ID | NFR-MAINT-04 |
|----|-------------|
| **Category** | Maintainability |
| **Requirement** | Tất cả environment variables phải được validate khi app khởi động |
| **Metric / Target** | App fail fast với error rõ ràng nếu thiếu required env vars |
| **Verification** | Remove required env var → verify startup error message |
| **Implementation** | `class-validator` + `@nestjs/config` với validation schema |

---

## 7. Compatibility

### NFR-COMPAT-01: Browser Support

| ID | NFR-COMPAT-01 |
|----|-------------|
| **Category** | Compatibility |
| **Requirement** | Frontend phải hoạt động trên các browsers phổ biến |
| **Metric / Target** | Chrome 100+, Safari 15+, Firefox 100+, Edge 100+; iOS Safari 15+ |
| **Verification** | BrowserStack hoặc manual test trên target browsers |
| **Notes** | IE11 không supported; React 19 + Vite 7 yêu cầu modern browser |

---

### NFR-COMPAT-02: Responsive Breakpoints

| ID | NFR-COMPAT-02 |
|----|-------------|
| **Category** | Compatibility |
| **Requirement** | UI phải có layout phù hợp ở các breakpoints tiêu chuẩn |
| **Metric / Target** | |
| **Breakpoints** | Mobile: 320-767px, Tablet: 768-1023px, Desktop: 1024px+ |
| **Verification** | Visual regression test ở 3 breakpoints |

---

### NFR-COMPAT-03: API Backward Compatibility

| ID | NFR-COMPAT-03 |
|----|-------------|
| **Category** | Compatibility |
| **Requirement** | v1 API không được có breaking changes trong cùng version |
| **Metric / Target** | 0 breaking changes trong v1; deprecation notice 30 ngày trước khi xóa |
| **Verification** | API contract test; consumer-driven contract testing |

---

## 8. Data Integrity

### NFR-DATA-01: Multi-Tenant Isolation

| ID | NFR-DATA-01 |
|----|-------------|
| **Category** | Data Integrity |
| **Requirement** | Data của một shop không bao giờ accessible từ shop khác |
| **Metric / Target** | 0 cross-tenant data leaks; TenantGuard phải active trên 100% data endpoints |
| **Verification** | Security test: token của shop A không được xem data shop B |

---

### NFR-DATA-02: Points Ledger Immutability

| ID | NFR-DATA-02 |
|----|-------------|
| **Category** | Data Integrity |
| **Requirement** | member_points_ledger entries không được sửa hoặc xóa |
| **Metric / Target** | 0 UPDATE/DELETE trên ledger table; chỉ INSERT |
| **Verification** | Code review: không có `.update()` hoặc `.delete()` trên ledger |

---

### NFR-DATA-03: Transaction Consistency

| ID | NFR-DATA-03 |
|----|-------------|
| **Category** | Data Integrity |
| **Requirement** | Các operation liên quan nhiều bảng phải atomic |
| **Metric / Target** | Dùng Prisma `$transaction()` cho tất cả multi-table operations |
| **Verification** | Code review; test failure mid-transaction → rollback |

---

## 9. NFR Summary Table

| ID | Category | Metric | Priority |
|----|----------|--------|----------|
| NFR-PERF-01 | Performance | API p95 < 300ms | High |
| NFR-PERF-02 | Performance | Image processing < 5s | High |
| NFR-PERF-03 | Performance | First spinner frame < 500ms | Medium |
| NFR-PERF-04 | Performance | AI timeout 30s | Medium |
| NFR-PERF-05 | Performance | No queries > 100ms | High |
| NFR-SEC-01 | Security | OWASP Top 10 compliant | Critical |
| NFR-SEC-02 | Security | HTTPS mandatory | Critical |
| NFR-SEC-03 | Security | Cookie security attributes | Critical |
| NFR-SEC-04 | Security | RBAC enforced 100% | Critical |
| NFR-SEC-05 | Security | Rate limiting active | High |
| NFR-SEC-06 | Security | File upload validation | High |
| NFR-SEC-07 | Security | 0 secrets in git | Critical |
| NFR-SCALE-01 | Scalability | Stateless backend | High |
| NFR-SCALE-02 | Scalability | CDN for static assets | High |
| NFR-SCALE-03 | Scalability | R2 for media | Medium |
| NFR-SCALE-04 | Scalability | DB connection pooling | High |
| NFR-AVAIL-01 | Availability | 99.5% uptime | High |
| NFR-AVAIL-02 | Availability | Spinner fallback | Medium |
| NFR-AVAIL-03 | Reliability | PM2 auto-restart < 30s | High |
| NFR-AVAIL-04 | Reliability | Zero-downtime migrations | High |
| NFR-AVAIL-05 | Reliability | Soft delete 30d retention | Medium |
| NFR-UX-01 | Usability | Responsive 320-2560px | High |
| NFR-UX-02 | Usability | Touch support | Medium |
| NFR-UX-03 | Usability | Loading states 100% | High |
| NFR-UX-04 | Usability | Friendly error messages | Medium |
| NFR-MAINT-01 | Maintainability | 0 ESLint errors (new) | High |
| NFR-MAINT-02 | Maintainability | 53 E2E tests pass | High |
| NFR-MAINT-03 | Maintainability | Docs updated with code | High |
| NFR-MAINT-04 | Maintainability | Env validation on boot | High |
| NFR-COMPAT-01 | Compatibility | Modern browser support | High |
| NFR-COMPAT-02 | Compatibility | 3 responsive breakpoints | High |
| NFR-COMPAT-03 | Compatibility | v1 API backward compat | High |
| NFR-DATA-01 | Data Integrity | 0 cross-tenant leaks | Critical |
| NFR-DATA-02 | Data Integrity | Ledger immutable | Critical |
| NFR-DATA-03 | Data Integrity | Atomic transactions | Critical |

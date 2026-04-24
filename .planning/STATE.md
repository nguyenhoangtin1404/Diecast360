# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** A seller can publish a diecast listing with complete media and ready-to-post content in one flow.
**Current focus:** Phase 13 — Playwright Phase 2 (Issue #33) extended coverage and quality-gate hardening.

## Current Position

Phase: **12 of 14**
Plan: Phase 12 **đã hoàn thành** (12-01, 12-02, 12-03)
Status: Phase 12 complete (2026-04-24). Next phase: 13 (Playwright Phase 2).
Last activity: 2026-04-24 — Fixtures baseline, auth/items/public-catalog smoke specs, CI artifact upload.

Progress: [##########] 100% (Phase 12)

## Performance Metrics

**Velocity:**
- Total plans completed: 18+ (cộng thêm 09-04)
- Average duration: 1 session
- Tracked execution time: 6+ hours

## Accumulated Context

### Decisions

- Initialized GSD planning baseline from existing project docs.
- Enforced inventory status transitions with terminal-state guard (`da_ban` cannot move backward).
- Added category metadata integrity checks against active taxonomy categories.
- Standardized admin inventory list contract (deterministic ordering, category filters, case-insensitive search).
- Hardened media pipeline concurrency paths (reorder/delete/upload) with transaction-safe ordering and retries.
- Added phase-2 verification coverage for backend media services, frontend spinner/media checks, and CI backend unit tests.
- Public catalog query/filter/sort state is URL-synchronized for deterministic browsing behavior.
- Public detail media rendering now has explicit spinner/gallery/empty fallback branches.
- Hardened AI description/Facebook caption generation with contract-safe parsing and provider-error normalization.
- Added AI draft import cleanup guarantees plus warning surfacing for partial media import.
- Completed manual Facebook selling workflow with caption snapshotting, copy actions, and cross-page state coherence.
- Production-hardened Docker stack, CI pipeline, and Facebook Graph API integration with error mapping and admin publish UX.
- Completed mobile responsive hardening across admin/public core pages and verified the responsive smoke checklist on target viewports.
- Implemented robust Multi-Tenant Shop isolation with dual role-based access control (`super_admin` vs `shop_admin`) and strict `TenantGuard` data boundaries.
- Legacy item quantities are backfilled from status (`da_ban` -> `0`, others -> `1`) to avoid inconsistent stock after schema rollout.
- Flexible per-item custom attributes are stored as JSON/JSONB with an empty-object default so downstream API/UI work can assume a stable object payload.
- Item APIs accept only flat scalar custom attributes and reject nested/null payloads to keep validation deterministic.
- Sold items are forced to `quantity = 0` at the API/service layer even when clients submit a non-zero quantity.
- Admin item workflow exposes quantity and a key/value custom-attributes editor on step 1, with validation matching backend rules before save.
- (2026-04-20) Completed Phase 8 implementation: inventory ledger schema/migration, tenant-scoped inventory APIs, `FOR UPDATE` locking, reconciliation/reverse safeguards, and admin inventory timeline UI.
- (2026-04-20) Signed media URLs (`/api/v1/media`), optional `MEDIA_SIGNING_SECRET`, CSRF double-submit + client retry, stricter JWT/cookie secrets, `TenantGuard` trên AI, throttle auth/upload/AI — nhánh `feat/security-signed-media-csrf-throttle`.
- (2026-04-20) Pre-order Phase 9 closure: public `/preorders` không phụ thuộc auth khi có `shop_id`/env; admin campaign selection ổn định; lỗi chuyển trạng thái hiển thị message backend; unit test cho extract message.
- (2026-04-23) Completed Phase 11 membership foundation: tier/member/ledger schema + constraints, deterministic points/tier rule engine, tenant-scoped members APIs, admin members dashboard, and members Playwright smoke scenario.
- (2026-04-24) Completed Phase 12 Playwright baseline: shared fixture layer (`fixtures/index.ts`), auth/items/public-catalog smoke specs (10 passing E2E tests total with 32 across full suite), CI Playwright report artifact upload on failure, HTML reporter, QA workflow docs.

### Pending Todos

- Merge nhánh `feat/security-signed-media-csrf-throttle` + cập nhật `docs/API_CONTRACT.md` / `ENV.md` nếu chưa làm.
- Phase 13: Playwright Phase 2 — extended coverage and quality-gate hardening (Issue #33).

### Blockers/Concerns

- Playwright local cần `pnpm exec playwright install` và đủ thư viện OS (ví dụ `libnspr4`); CI image thường đã cài — chạy E2E trên CI khi merge.

## Session Continuity

Last session: 2026-04-23 (Phase 11 implementation)
Stopped at: Phase 11 marked complete; ready to start Phase 12
Resume file: `.planning/phases/12-issue-44-playwright-automation-phase-1/12-01-PLAN.md`

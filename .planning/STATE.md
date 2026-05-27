---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-05-27T11:00:00.000Z"
progress:
  total_phases: 27
  completed_phases: 25
  total_plans: 59
  completed_plans: 53
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-30)

**Core value:** A seller can publish a diecast listing with complete media and ready-to-post content in one flow.
**Current focus:** Phase 26 (Auth Security Hardening Wave 1) — planning and feedback.

## Current Position

Phase: **26** — Issue #232/#237/#243/#244/#246 Auth Security Hardening Wave 1 (**planned**: 0/3 plans completed)
Plan: **26-01** Login audit log + X-Trace-Id tracing
Status: Planned — Ready to initiate execution after user approval.
Last activity: 2026-05-27 — Created Context and Plan documents for Phase 26 & 27; updated ROADMAP.md and STATE.md.

Progress: [#########################  ] 25/27 phases shipped.

## Performance Metrics

**Velocity:**
- Total plans completed: 53
- Average duration: 1-2 sessions per phase
- Tracked execution time: 24+ hours

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
- (2026-04-29) Completed Phase 13: advanced Playwright specs (`spinner`, `social-selling`, `responsive`), CI runner tuning (retries/workers), E2E triage notes in `docs/TODO.md`, `stubAuthCsrf` helper for admin mocks.
- (2026-04-29) Completed Phase 15: PlatformRole enum + User.platform_role migration+backfill; dual-layer RolesGuard (platform_role check + shop_staff HTTP-method enforcement — Option C); @PlatformRoles decorator; AddShopAdminDto extended with role field; frontend isPlatformSuper + useIsSuperAdmin updated; AddMemberModal role picker (shop_admin/shop_staff); audit labels for new actions.
- (2026-04-30) **Phase 16:** Public catalog/detail accept optional `shop_id` (UUID or slug); explicit query overrides JWT for reads; frontend propagates `shop_id` via URL, `VITE_PUBLIC_CATALOG_SHOP_ID`, or JWT after auth settles (`shopContextReady`); Playwright two-shop mock proves UI isolation.
- (2026-05-16) **Phase 18 / Issue #59:** Tenant-layer `RolesGuard` now loads `shop.is_active` per request (`shop.findUnique`) after role match so deactivated shops cannot authorize mutating routes (including category PATCH/DELETE) with stale JWT `active_shop_id`; platform_super still bypasses tenant branch; regression tests in `roles.guard.spec.ts`.
- (2026-05-20) **Phase 19:** Member points awarded on pre-order transition to `PAID` with idempotency safeguards, reversed on order cancelation.
- (2026-05-20) **Phase 21:** Defense-in-Depth security hardening including Helmet, CSP, JWT Bearer toggle flag, AI route limits, and structured warn logs.
- (2026-05-22–24) **Phase 20:** Tokenized QR Gateway implemented with stable unique tokens, 302 public redirector, and direct thermal printing layouts.
- (2026-05-23–26) **Phase 22:** Pre-order UX Enhancements completed: countdown progress bars, UUID v7 DB-wide migration, atomic refresh token revocation, and campaign shortcut button.
- (2026-05-26) **Phase 23:** Monorepo standard lockfile and CI/CD Overhaul standardizing on pnpm, multi-job aggregator checks, and Pi rsync deployment with `UPLOAD_DIR` wipe protection.
- (2026-05-26) **Phase 24:** Pre-order thermal printable receipt (58mm) and PNG image share export.
- (2026-05-27) **Phase 25:** Vercel backend staging deploy automated on build success, gated by staging DB migration check.

### Roadmap Evolution

- Phase 17 added: Cloudflare R2 upload — migrate backend media from local disk to object storage (2026-05-08).
- Phase 18 added: Issue #59 Category Tenant Guard Hardening (2026-05-12).
- Phase 19-25 completed: Pre-order points, QR Gateway, Security Hardening, Pre-order UX, CI/CD Overhaul, Thermal Receipt, and Staging Deploy (2026-05-20 to 2026-05-27).
- Phase 26 & 27 planned: Auth Security Hardening Wave 1 & Wave 2 (2026-05-27).

### Pending Todos

- Obtain user feedback on Phase 26 & 27 plans.
- Initiate Phase 26-01 execution once approved.

### Blockers/Concerns

- None.

## Session Continuity

Last session: 2026-05-27 (Created Phase 26 & 27 Contexts and Plans)
Stopped at: **Planning** — Ready to request feedback/approval for Auth Security Hardening Phase 26 and Phase 27.
Resume file: `.planning/phases/26-auth-security-hardening-wave-1/26-01-PLAN.md`

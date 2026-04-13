# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** A seller can publish a diecast listing with complete media and ready-to-post content in one flow.
**Current focus:** Phase 9 - Pre-Order Management (Issue #13) for MVP-first delivery

## Current Position

Phase: 9 of 14 (Issue #13 - Pre-Order Management)
Plan: 1 of 4 in current phase (09-03 complete; 09-04 planned)
Status: Phase 9 in progress; follow-up execution plan (09-04) created to close review gaps before phase closure
Last activity: 2026-04-13 — Added 09-04 plan for gap closure (public access resolution, campaign UX wiring, invalid-transition e2e, transition parity)

Progress: [#######---] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 14
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

### Pending Todos

None.

### Blockers/Concerns

- Phase 9 has known follow-up gaps documented in `.planning/phases/09-issue-13-pre-order-management/09-03-SUMMARY.md` (Review Round 2 section).

## Session Continuity

Last session: 2026-04-13 (Plan 09-03)
Stopped at: Phase 9 review gaps translated into executable follow-up plan 09-04
Resume file: .planning/phases/09-issue-13-pre-order-management/09-04-PLAN.md

# Roadmap: Diecast360

## Overview

This roadmap organizes Diecast360 delivery from core product foundations to operations, automation, and scale features.

## Phases

- [x] **Phase 1: Inventory Foundation** - Data model and item lifecycle management.
- [x] **Phase 2: Media Pipeline** - Image and spinner asset management.
- [x] **Phase 3: Public Experience** - Public catalog and product viewing workflow.
- [x] **Phase 4: AI and Social Selling** - Content generation and seller assist tools.
- [x] **Phase 5: Production and Integrations** - Docker, CI, and Facebook API baseline.
- [x] **Phase 6: Issue #58 - Mobile Responsive UI** - Mobile-first UX hardening for admin/public pages.
- [x] **Phase 7: Issue #57 - Quantity and Custom Attributes** - Extend product model with stock quantity and custom metadata.
- [x] **Phase 8: Issue #46 - Advanced Inventory Management** - Transaction-based inventory and stock audit trail.
- [x] **Phase 9: Issue #13 - Pre-Order Management** - Pre-order lifecycle management for model products.
- [x] **Phase 10: Issue #49 - Reporting and Analytics** - KPI dashboard and analytics APIs.
- [x] **Phase 11: Issue #48 - Membership and Points** - Member tiers and points ledger system.
- [x] **Phase 12: Issue #44 - Playwright Phase 1** - E2E smoke automation setup and CI integration. *(2026-04-24)*
- [x] **Phase 13: Issue #33 - Playwright Phase 2** - Extended E2E coverage and quality-gate hardening. *(2026-04-29)*
- [x] **Phase 14: Multi-Tenant Shop** - Support multiple isolated diecast shops on a single deployment with scoped access.
- [x] **Phase 15: Admin RBAC & Tenant Authorization** - Separate platform operator permissions from per-shop roles; extend shop roles (e.g. read-only staff) and align API + admin UI.
- [x] **Phase 18: Issue #59 - Category Tenant Guard Hardening** - Close inactive-shop authorization lifecycle gap on category mutate routes. *(2026-05-16)*
- [x] **Phase 16: Per-Shop Public Homepage** - Resolve public catalog and item detail to a single shop tenant via URL or explicit query param, aligned with existing multi-tenant isolation. *(completed 2026-04-30)*
- [x] **Phase 17: Cloudflare R2 upload — migrate backend media from local disk to object storage** - S3-compatible R2 behind `IStorageService`; presigned or proxied media URLs; optional disk→R2 migration. *(completed 2026-05-09)*
- [x] **Phase 19: Pre-order PAID → Member Points** - Bind `Member` on pre-order create; award loyalty points on `PAID` per shop config; reverse points idempotently on refund (FSM + ledger). *(completed 2026-05-20)*
- [x] **Phase 20: Issue #145 - Tokenized QR Gateway** - Token-based QR code per product; public gateway redirects to catalog; admin step 5 with preview, copy-link, download, and direct thermal print. *(completed 2026-05-24)*
- [x] **Phase 21: Defense-in-Depth Security Hardening** - Helmet CSP/CORP headers, JWT bearer toggle, AI route throttle + custom instruction cap, structured 4xx/5xx observability logging, and Dependabot auto-updates. *(completed 2026-05-20)*
- [x] **Phase 22: Pre-order UX Enhancements** - Item-level pre-order status with campaign shortcut button; closing-date selector; countdown progress bar; persist `preorder_opens_at` from item `created_at`; UUID v4→v7 migration; atomic refresh-token revocation. *(completed 2026-05-26)*
- [x] **Phase 23: CI/CD Overhaul — pnpm-first pipelines & gated Pi deploy** - Monorepo standardized on `pnpm-lock.yaml`; full backend/frontend/security/health-check gate with `CI Success` aggregator; gated Pi deploy via `workflow_run`; Gitleaks, Commitlint, PR title lint, Labeler, CODEOWNERS, Dependabot. *(completed 2026-05-26)*
- [x] **Phase 24: Pre-order Receipt — Thermal Print & Share Image** - `GET /preorders/:id/receipt` API; 58mm thermal print layout; PNG export/share via `html-to-image`; member address field; print/share actions on admin and My Orders; E2E coverage. *(completed 2026-05-26)*
- [x] **Phase 25: Backend Staging Deploy on Vercel** - Separate staging workflow gated on build success; automated migrate + deploy to Vercel staging environment; aligned deploy checks. *(completed 2026-05-27)*
- [ ] **Phase 26: Issue #232/#237/#243/#244/#246 - Auth Security Hardening Wave 1** - Login audit log + X-Trace-Id; per-email rate limit + account lockout (PostgreSQL-backed, survive restart); admin UI to view audit log and unlock accounts; Google reCAPTCHA v3 on admin login.
- [ ] **Phase 27: Issue #238/#242/#245/#289 - Auth Security Wave 2 — Alerting, E2E & Ops** - Telegram security alerts with dedupe; Playwright E2E for lockout/CAPTCHA/rate-limit flows; production ops security checklist; staging pipeline completion.
## Phase Details

### Phase 1: Inventory Foundation
**Goal**: Stable item lifecycle and metadata management.
**Depends on**: Nothing (first phase)
**Requirements**: INVT-01, INVT-02
**Plans**: 1 plan

Plans:
- [x] 01-01: Finalize inventory lifecycle and taxonomy contracts

### Phase 2: Media Pipeline
**Goal**: Deterministic media upload and spinner frame ordering.
**Depends on**: Phase 1
**Requirements**: MEDI-01, MEDI-02
**Plans**: 1 plan

Plans:
- [x] 02-01: Harden image and spinner upload workflows

### Phase 3: Public Experience
**Goal**: Reliable public browsing and item detail presentation.
**Depends on**: Phase 2
**Requirements**: MEDI-03, PBLC-01, PBLC-02
**Plans**: 1 plan

Plans:
- [x] 03-01: Deliver public catalog and detail UX consistency

### Phase 4: AI and Social Selling
**Goal**: AI-generated listing content and social-ready outputs.
**Depends on**: Phase 3
**Requirements**: AISO-01, AISO-02, AISO-03
**Plans**: 1 plan

Plans:
- [x] 04-01: Complete AI-assisted listing and social publishing flow

### Phase 5: Production and Integrations
**Goal**: Production-ready operations and Facebook API integration baseline.
**Depends on**: Phase 4
**Requirements**: PLAT-01, PLAT-02, PLAT-03
**Plans**: 1 plan

Plans:
- [x] 05-01: Ship production hardening and Facebook integration baseline

### Phase 6: Issue #58 - Mobile Responsive UI
**Goal**: Complete mobile-first responsive UX for admin/public core screens.
**Depends on**: Phase 5
**Requirements**: RESP-01
**Plans**: 2 plans

Plans:
- [x] 06-01: Harden admin mobile UX and responsive navigation
- [x] 06-02: Harden public mobile UX and responsive smoke checks

### Phase 7: Issue #57 - Quantity and Custom Attributes
**Goal**: Add quantity and flexible custom attributes to product domain model.
**Depends on**: Phase 5
**Requirements**: ATTR-01, ATTR-02
**Plans**: 3 plans

Plans:
- [x] 07-01: Add schema and migration for quantity/attributes
- [x] 07-02: Update item API contract and validations
- [x] 07-03: Implement admin UI and backend unit regression coverage for new fields

### Phase 8: Issue #46 - Advanced Inventory Management
**Goal**: Build advanced inventory transaction management with audit trail.
**Depends on**: Phase 7
**Requirements**: STOK-01
**Plans**: 3 plans

Plans:
- [x] 08-01: Implement inventory transaction schema and service core
- [x] 08-02: Expose inventory transaction APIs and authorization rules
- [x] 08-03: Add inventory timeline UI and reconciliation tests

### Phase 9: Issue #13 - Pre-Order Management
**Goal**: Deliver pre-order lifecycle management with admin + public mobile MVP workflows.
**Depends on**: Phase 7
**Requirements**: PORD-01, PORD-01a, PORD-01b, PORD-01c, PORD-01d
**Plans**: 4 plans

Plans:
- [x] 09-01: Add pre-order schema and state model (schema + `preorder-transition` domain trong codebase)
- [x] 09-02: Build pre-order APIs and transition rules (`PreordersModule` / controller / service)
- [x] 09-03: Add admin + public mobile pre-order UI and flow tests
- [x] 09-04: Close review gaps for public access, campaign UX, transition parity, and invalid-transition E2E coverage

Review status (2026-04-20): Các gap trong 09-03-SUMMARY đã xử lý trong code + plan 09-04 (chi tiết xem `09-04-PLAN.md` Implementation notes).

### Phase 10: Issue #49 - Reporting and Analytics
**Goal**: Add reporting and analytics dashboard for operations insights.
**Depends on**: Phase 8, Phase 9
**Requirements**: RPTG-01
**Plans**: 2 plans

Plans:
- [x] 10-01: Build KPI aggregation APIs and fixture-based validation
- [x] 10-02: Build reports dashboard UI with filter and chart states

### Phase 11: Issue #48 - Membership and Points
**Goal**: Implement membership tiers and points management.
**Depends on**: Phase 7
- [x] 13-03: Promote E2E to required quality gate in CI

### Phase 18: Issue #59 - Category Tenant Guard Hardening
**Goal**: Close inactive-shop authorization lifecycle gap on category mutate routes.
**Depends on**: Phase 15, Phase 16
**Requirements**: MULT-03, MULT-04
**Plans**: 1 plan

Plans:
- [x] 18-01: Harden category mutate tenant authorization


| 15. Admin RBAC & Tenant Authorization | 3/3 | Complete | 2026-04-29 |
| 16. Per-Shop Public Homepage | 3/3 | Complete | 2026-04-30 |
| 17. Cloudflare R2 upload | 3/3 | Complete | 2026-05-09 |
| 18. Issue #59 - Category Tenant Guard Hardening | 1/1 | Complete | 2026-05-16 |
| 19. Pre-order PAID → Member Points | 3/3 | Complete | 2026-05-20 |
| 20. Issue #145 - Tokenized QR Gateway | 2/2 | Complete | 2026-05-24 |
| 21. Defense-in-Depth Security Hardening | 1/1 | Complete | 2026-05-20 |
| 22. Pre-order UX Enhancements | 4/4 | Complete | 2026-05-26 |
| 23. CI/CD Overhaul — pnpm-first pipelines | 1/1 | Complete | 2026-05-26 |
| 24. Pre-order Receipt — Thermal Print & Share | 1/1 | Complete | 2026-05-26 |
| 25. Backend Staging Deploy on Vercel | 1/1 | Complete | 2026-05-27 |


### Phase 12: Issue #44 - Playwright Phase 1
**Goal**: Establish Playwright E2E automation baseline.
**Depends on**: Phase 5
**Requirements**: QATE-01
**Plans**: 3 plans

Plans:
- [x] 12-01: Setup Playwright infra and fixtures baseline
- [x] 12-02: Add smoke E2E coverage for critical user flows
- [x] 12-03: Integrate Playwright job and artifacts in CI

### Phase 13: Issue #33 - Playwright Phase 2
**Goal**: Expand Playwright coverage and enforce quality gates.
**Depends on**: Phase 10, Phase 11, Phase 12
**Requirements**: QATE-02
**Plans**: 3 plans

Plans:
- [x] 13-01: Add advanced E2E coverage for feature-heavy flows
- [x] 13-02: Stabilize flaky tests with isolation and reliability tuning
- [x] 13-03: Promote E2E to required quality gate in CI

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Inventory Foundation | 1/1 | Complete | 2026-03-05 |
| 2. Media Pipeline | 1/1 | Complete | 2026-03-10 |
| 3. Public Experience | 1/1 | Complete | 2026-03-10 |
| 4. AI and Social Selling | 1/1 | Complete | 2026-03-13 |
| 5. Production and Integrations | 1/1 | Complete | 2026-03-16 |
| 6. Issue #58 - Mobile Responsive UI | 2/2 | Complete | 2026-03-20 |
| 7. Issue #57 - Quantity and Custom Attributes | 3/3 | Complete | 2026-04-01 |
| 8. Issue #46 - Advanced Inventory Management | 3/3 | Complete | 2026-04-20 |
| 9. Issue #13 - Pre-Order Management | 4/4 | Complete | 2026-04-20 |
| 10. Issue #49 - Reporting and Analytics | 2/2 | Complete | 2026-04-23 |
| 11. Issue #48 - Membership and Points | 2/2 | Complete | 2026-04-23 |
| 12. Issue #44 - Playwright Phase 1 | 3/3 | Complete | 2026-04-24 |
| 13. Issue #33 - Playwright Phase 2 | 3/3 | Complete | 2026-04-29 |
| 14. Multi-Tenant Shop | 3/3 | Complete | 2026-03-23 |
| 15. Admin RBAC & Tenant Authorization | 3/3 | Complete | 2026-04-29 |
| 16. Per-Shop Public Homepage | 3/3 | Complete | 2026-04-30 |
| 19. Pre-order PAID → Member Points | 3/3 | Complete | 2026-05-20 |
| 20. Tokenized QR Gateway | 2/2 | Complete | 2026-05-24 |
| 21. Security Hardening | 1/1 | Complete | 2026-05-20 |
| 22. Pre-order UX Enhancements | 4/4 | Complete | 2026-05-26 |
| 23. CI/CD Overhaul | 1/1 | Complete | 2026-05-26 |
| 24. Pre-order Receipt | 1/1 | Complete | 2026-05-26 |
| 25. Staging Deploy | 1/1 | Complete | 2026-05-27 |
| 26. Auth Security Hardening Wave 1 | 0/3 | Planned | — |
| 27. Auth Security Wave 2 | 0/3 | Planned | — |

## Execution Update (2026-03-04)

Completed in codebase (partial roadmap delivery):
- Admin product page refactored to 4-step workflow: `Thông tin cơ bản` -> `Hình ảnh` -> `Ảnh 360` -> `AI gen nội dung FB`.
- Auto-save enforced for step navigation (`Bước tiếp`, `Bước trước`, direct step click).
- Enter key submit on step 1 is blocked to preserve deterministic step workflow.
- Final step `Hoàn tất` now performs media checks and confirm/fallback behavior.
- Added unit + integration tests for step navigation, finish-decision rules, and ItemDetailPage primary flows.

## Execution Update (2026-03-05)

Completed in codebase for Phase 1:
- Hardened backend item lifecycle validation (status transitions, pricing checks, category integrity checks).
- Expanded inventory list filter contract with deterministic pagination ordering and category-based filters.
- Synced admin Items list request flow to contract-aligned `/items` query params for stable pagination + search.
- Added regression coverage for status transition guard, soft-delete exclusion, category filters, and price validation.
- Targeted test suite passed: `npx jest src/items/items.service.spec.ts` (37 tests).

## Execution Update (2026-03-10, Phase 2)

Completed in codebase for Phase 2:
- Closed concurrency gaps for image/frame reorder/delete with transaction-safe ordering strategies.
- Hardened upload validation + rollback behavior and aligned retry/error flow in media services.
- Added backend media service unit coverage and frontend regression/E2E checks for spinner/media edge behavior.
- Added backend unit tests to CI and improved Playwright readiness/cache execution.

## Execution Update (2026-03-10, Phase 3)

Completed in codebase for Phase 3:
- Hardened public list/detail API consistency and visibility guards.
- Added public service regression tests for filtering, paging, and spinner frame normalization.
- Stabilized catalog URL query state (filters/sort/search) and public item media fallback behavior.

## Execution Update (2026-03-16, Phase 5)

Completed in codebase for Phase 5:
- Finalized Docker Compose stack: healthchecks, safe env defaults, source volume mounts, frontend dev stage.
- CI hardened: backend test env stubs for Prisma, Playwright OS deps on cache-hit.
- Facebook Graph API integration: dedicated `integrations/facebook/` module with config validation, Graph API wrapper, error mapping.
- New `POST /items/:id/facebook-posts/publish` endpoint with rate limiting and confirmation dialog in admin UX.
- Documentation updated: API_CONTRACT.md, ERROR_HANDLING.md, ENV.md.
- All tests passed (256 backend tests, 0 lint errors, clean frontend build).

## Execution Update (2026-03-19, Phase 6)

Implemented in codebase for Phase 6:
- Admin responsive hardening: mobile navigation/menu in shared layout, mobile card/list treatment for `ItemsPage`, `CategoriesPage`, and `FacebookPostsPage`.
- Admin item workflow hardened for smaller screens: responsive stepper, stacked toolbars, wrapped segmented controls, mobile-safe sticky action bar, and tighter media/social layout behavior in `ItemDetailPage`.
- Public responsive hardening: `PublicItemDetailPage` now switches to a true one-column mobile layout with mobile-safe media/info panels; `ItemCard` spacing/touch ergonomics improved for narrow widths.
- Responsive smoke checklist added to `docs/TODO.md` for target viewports `375x667`, `390x844`, and `768x1024`.
- Verification completed in codebase: frontend unit suite passed (46 tests) and frontend production build passed.
- Manual responsive smoke checklist completed on target viewports and core admin/public flows.

## Execution Update (2026-03-23, Phase 14)

Implemented in codebase for Phase 14:
- Extended Prisma schema with `Shop` and `UserShopRole` models; added safe 3-step migration.
- Built strict `TenantGuard` to enforce data isolation (zero cross-tenant data leakage) by reading `active_shop_id` from JWT.
- Added `POST /auth/switch-shop` for secure context switching.
- Built Super Admin `ShopsModule` for multi-tenant lifecycle management and access control (`@Roles('super_admin')`).
- Passed 264/264 isolated multi-tenant backend unit tests.

## Execution Update (2026-04-01, Phase 7 Plan 01)

Implemented in codebase for Phase 7 Plan 01:
- Extended Prisma `Item` schema with `quantity` and JSON-backed `attributes` defaults for all new records.
- Added additive migration SQL that backfills legacy `quantity` values from existing item status (`da_ban` -> `0`, otherwise `1`).
- Initialized legacy `attributes` values to empty JSONB objects and added a DB-level non-negative quantity check constraint.
- Added interim service guard so sold items stay at `quantity = 0` before Phase `07-02` exposes quantity payloads.
- Verification passed: Prisma schema validate, Prisma client generate, `ItemsService` regression suite (54 tests), and local PostgreSQL migration replay with legacy data backfill.

## Execution Update (2026-04-01, Phase 7 Plan 02)

Implemented in codebase for Phase 7 Plan 02:
- Extended item create/update DTOs with validated `quantity` and flat `attributes` support, including null-safe handling.
- Added a dedicated custom-attributes validator that rejects nested payloads, reserved keys, and invalid scalar values.
- Updated item create/update persistence so explicit quantity/attributes round-trip through list/detail responses while sold items still force `quantity = 0`.
- Added DTO regression coverage plus expanded `ItemsService` tests for create/update/list/detail behavior with the new fields.
- Synced `docs/API_CONTRACT.md` with the backend request/response contract for `quantity` and `attributes`.

## Execution Update (2026-04-01, Phase 7 Plan 03)

Implemented in codebase for Phase 7 Plan 03:
- Added admin step-1 controls on `ItemDetailPage` for integer quantity (sold state shows 0 and disables editing) and a key/value custom-attributes editor aligned with API limits (50 keys, trimmed keys, reserved-key hints).
- Wired create/update payloads through existing save flows, including step navigation and AI description accept path, with client-side validation before save.
- Surfaced `quantity` on the admin items table for quick stock visibility.
- Extended shared `item.types.ts` contracts for `quantity` / `attributes` on list and form-related types.
- Added `ItemsService` unit regression coverage for clearing `attributes` via PATCH with `{}` (no Playwright in this plan; E2E baseline is Phase 12).

## Execution Update (2026-04-20, Phase 8)

Implemented in codebase for Phase 8:
- Added inventory ledger schema (`InventoryTransactionType`, `InventoryTransaction`) with migration, FK constraints, and indexes.
- Built `InventoryModule` with transaction-driven service layer and tenant-scoped APIs for create/list/reconciliation/reverse flows.
- Hardened stock mutation path with row-level locking (`FOR UPDATE`) to prevent concurrent lost updates.
- Added deterministic adjustment contract (`quantity = abs(adjustment_delta)`) and reverse-transaction safeguards.
- Added admin item-level inventory timeline UI (`InventoryTimeline`) integrated into `ItemDetailPage`.
- Verification passed: `jest inventory.service.spec.ts inventory.integration.spec.ts` (6 tests passed).

## Execution Update (2026-04-20, Phase 9 Plan 09-04 — đóng phase)

- **Public `/preorders`:** Không hiển thị trạng thái “chờ shop” khi đã có `?shop_id=` hoặc `VITE_PUBLIC_PREORDER_SHOP_ID`; thông báo khi thiếu shop kèm hướng dẫn URL/env (`PreOrdersPage.tsx`).
- **Admin campaign:** Chọn campaign qua `campaignOverrideId` + `effectiveCampaignId` `useMemo` (không dùng `useEffect` setState gây cảnh báo React Compiler).
- **Lỗi transition:** `messageFromPreorderTransitionError` (`preorderApiError.ts`) + unit test Vitest; hook `usePreorderTransition` hiển thị message backend; E2E assert chuỗi `Invalid pre-order status transition`.
- **Parity map:** Ghi chú đồng bộ với `backend/.../preorder-transition.ts` trong `status.ts`.

## Execution Update (2026-04-23, Phase 11)

Implemented in codebase for Phase 11:
- Added membership tier, member profile, and points-ledger schema with constraints/indexes (`backend/prisma/schema.prisma`, migration `20260423090000_add_membership_and_points`).
- Built deterministic points and tier rule engines with boundary coverage (`backend/src/members/rules/*`).
- Delivered tenant-scoped members APIs (`/members`, `/members/:id/ledger`, `/members/:id/points-adjustments`) with admin role guards.
- Added admin `MembersPage` for list/search, member creation, points adjustment, and ledger timeline.
- Added frontend smoke coverage for members dashboard route and ledger rendering (`frontend/tests/e2e/members.spec.ts`).

## Execution Update (2026-04-29, Phase 13)

Implemented in codebase for Phase 13:
- Added E2E specs: `spinner.spec.ts` (frame reorder + upload against mocked APIs), `social-selling.spec.ts` (AI FB caption, PATCH save, manual Facebook link), `responsive.spec.ts` (admin items at mobile viewport).
- Shared item-detail mock helper `tests/e2e/utils/item-detail-mocks.ts` and `stubAuthCsrf` in fixtures for deterministic admin setup.
- Playwright CI tuning: `retries: 2`, `workers: 2` on CI; workflow comment clarifies **Frontend** job as required gate (Playwright + lint + unit tests).
- Documented E2E triage/rerun policy in `docs/TODO.md`.

## Remaining Work Snapshot (By Phase)

All phases through Phase 25 are complete as of 2026-05-27. Phase 26 and Phase 27 are currently pending (Planned).

Partially executed phases (still pending full completion):
- **Phase 26: Auth Security Hardening Wave 1** (Planned, 0/3 plans complete)
- **Phase 27: Auth Security Wave 2** (Planned, 0/3 plans complete)


---

## Execution Update (2026-05-20, Phase 19)

Implemented in codebase for Phase 19 — Pre-order PAID → Member Points:
- Added `pre_orders.member_id` FK and `shop_loyalty_config` (vnd_per_point, basis) schema + migration.
- Admin pre-order create/edit enforces mandatory `member_id` picker (autocomplete from shop members).
- On `PAID` transition: `PreordersService` calls `MembersService.awardPoints(memberId, delta)` with idempotency key (`preorder_id + status = PAID`); prevents duplicate awards on re-saves.
- On reversal after `PAID` (e.g. `PAID → CANCELLED`): points are reversed via ledger debit with matching idempotency key.
- E2E asserts member name in campaign participant rows.

## Execution Update (2026-05-20, Phase 21)

Implemented in codebase for Phase 21 — Defense-in-Depth Security Hardening:
- Applied `Helmet` in `main.ts` with API-oriented CSP, `Cross-Origin-Resource-Policy: cross-origin` for SPA, optional HSTS via `SECURITY_HSTS_DISABLED` escape hatch.
- Added `JWT_ALLOW_AUTHORIZATION_BEARER` feature flag to toggle `Authorization: Bearer` extraction (default off for cookie-only flows).
- AI route throttle tightened; `custom_instructions` capped at 2 000 chars; OpenAI calls logged with `shop/op` context.
- Structured warn logs on failed login, CSRF rejection, and Nest 401/403 responses (no request bodies leaked).
- Dependabot weekly npm updates for both workspaces.

## Execution Update (2026-05-22–24, Phase 20)

Implemented in codebase for Phase 20 — Tokenized QR Gateway (Issue #145):
- Added `qr_token` (unique) column to `items` table via migration; lazy token generation (`crypto.randomBytes` hex, 3-try unique guard).
- `GET /api/v1/items/:id/qr` — admin endpoint returns token + `resolve_url` + `image_data_url` (base64 via `qrcode`).
- `GET /api/v1/public/qr/:token` — public 302-redirect gateway; validates `is_public`, not-deleted, active shop before redirecting to frontend item detail with `?source=qr&action=view`.
- Admin `ItemDetailPage` gains step 5 "Mã QR sản phẩm" with lazy QR fetch, preview, copy-link, download-PNG, and private-item warning badge.
- "Print QR" button on step 5 and printer icon in product list (fetch on-demand); thermal print layout uses `mm` units for 58mm roll.
- `PublicItemDetailPage` shows "Bạn đang xem sản phẩm qua mã QR" banner when `source=qr` detected.
- `API_CONTRACT.md` updated with both endpoints and error semantics.

## Execution Update (2026-05-23–26, Phase 22)

Implemented in codebase for Phase 22 — Pre-order UX Enhancements:
- **Item-level pre-order status** (`cb6e876`): Items gain a `preorder` status with FSM transition rules; admin item detail page shows "Tạo chiến dịch đặt trước" shortcut button linking to new campaign with `item_id`.
- **Closing-date selector** (`75a6ded`): Admin campaign form exposes a date-picker for `closes_at`; backend accepts and stores the field.
- **Countdown progress bar** (`66b8e79`, Issue #227): Public pre-order page shows remaining time / progress bar driven by `opens_at` and `closes_at`.
- **Persist `preorder_opens_at`** (`058db50`): When a campaign is created, `preorder_opens_at` on the linked item is backfilled from `created_at` so the countdown is accurate for items created before the field existed.
- **UUID v4 → v7 migration** (`2629ed9`): All Prisma models migrated from random v4 to time-ordered v7 UUIDs; services updated for consistent ordering.
- **Atomic refresh-token revocation** (`1f9c731`): Prevents a race condition where concurrent `/auth/refresh` requests could both succeed; revocation is now a single atomic DB write.

## Execution Update (2026-05-26, Phase 23)

Implemented in codebase for Phase 23 — CI/CD Overhaul (pnpm-first pipelines & gated Pi deploy):
- Dropped all `npm` lockfiles; monorepo standardized on single `pnpm-lock.yaml` with `packageManager: pnpm@10.33.4`.
- CI workflow restructured into four jobs: `backend`, `frontend` (lint/tsc/Vitest/Playwright), `security` (`pnpm audit --audit-level=high`), `health-check` (boots dist + Postgres + `GET /api/v1/health`); gated by a `ci-success` aggregator required check.
- Pi deploy: triggered via `workflow_run` on CI success + push to `main`; path-filter prevents docs/frontend-only pushes from restarting the Pi service; bundle uses `pnpm deploy --prod --legacy` + `rsync --exclude=.env --exclude=/uploads`.
- Hygiene workflows added: Gitleaks (`.gitleaks.toml` allowlist for CI placeholders), Commitlint, PR title lint, Labeler (`.github/labeler.yml`), CODEOWNERS, Dependabot weekly.
- All GitHub Actions bumped to Node 24-compatible major versions.
- Fixed rsync `--delete` bug that was wiping `UPLOAD_DIR` on Pi (`b16be0e`); postmortem and runbooks documented in `docs/POSTMORTEMS/` and `docs/RUNBOOKS/`.

## Execution Update (2026-05-26, Phase 24)

Implemented in codebase for Phase 24 — Pre-order Receipt (Thermal Print & Share Image):
- Added `GET /api/v1/preorders/:id/receipt` endpoint; accessible to shop staff/admin and the order owner.
- Receipt includes: shop logo, shop name/contact, order number, member name + address, item list, amounts (total, paid, discount, remaining), and VND words for the amount due.
- Added `members.address` field via migration; `ShopContactSettings` extended with `address`.
- Frontend renders receipt in a hidden DOM node via `html-to-image`; supports:
  - **Thermal print** (58mm roll via `@media print` mm rules) using native browser `window.print()`.
  - **PNG export / share** via Web Share API (`navigator.share`) with `html-to-image` rasterize (double-rAF for layout stability).
- Print/Share action buttons added to admin pre-order detail page and public My Orders page.
- Sanitizes logo URLs (rejects protocol-relative `//` URLs); renders pre-order note on receipts.
- Playwright E2E: print popup assertion, PNG download, receipt API error cases.
- Backend unit tests: `getReceipt` auth matrix (403/200/404), VND words, receipt HTML, logo whitelist.

## Execution Update (2026-05-27, Phase 25)

Implemented in codebase for Phase 25 — Backend Staging Deploy on Vercel:
- Added `.github/workflows/deploy-staging.yml`: separate staging deploy workflow triggered after backend build succeeds.
- Gated: staging migrate (`prisma migrate deploy` on Neon staging DB) runs only after build artifact is validated.
- Aligned deploy checks with the `CI Success` gate so staging is never deployed from a broken build.
- Staging environment targets Vercel project with separate env vars (Neon staging branch, staging `BACKEND_URL`).

### Phase 14: Multi-Tenant Shop

**Goal:** Support multiple isolated diecast shops on a single deployment with scoped access.
**Requirements**: MULT-01, MULT-02, MULT-03
**Depends on:** Phase 5 (auth and API baseline)
**Plans:** 3 plans

Plans:
- [x] 14-01: Multi-tenant schema and data isolation
- [x] 14-02: API scoping, tenant guard và shop management endpoints
- [x] 14-03: Admin tenant selection UI và super-admin shop management

### Phase 15: Admin RBAC & Tenant Authorization

**Goal:** Clarify platform vs per-shop permissions, add a constrained tenant role (e.g. `shop_staff`), and align Nest guards, JWT payloads, shop member APIs, and admin UI.
**Requirements:** MULT-04
**Depends on:** Phase 14
**Plans:** 3 plans

Plans:
- [x] 15-01: Schema — `PlatformRole`, `User.platform_role`, extend `ShopRole` / audit enums, backfill from legacy `super_admin` memberships
- [x] 15-02: Backend — `RolesGuard`, platform-only routes, `shop_staff` read/write matrix, shops member role DTOs, tests
- [x] 15-03: Frontend — capability-based admin UI, member role picker, automated regression tests

### Phase 16: Per-Shop Public Homepage

**Goal:** Public visitors always see catalog and item detail scoped to exactly one shop; shareable URLs identify the shop without relying on admin JWT `active_shop_id`.
**Requirements:** PBLC-03, MULT-01, MULT-03
**Depends on:** Phase 14 (multi-tenant foundation); coordinates with Phase 15 only if public resolution must respect new platform vs shop role semantics (prefer no hard dependency).
**Plans:** 3/3 plans complete

Plans:
- [x] 16-01: Backend — optional `shop_id` on public item list/detail; resolve by UUID or `Shop.slug`; 404 for unknown/inactive shop; tests + contract docs
- [x] 16-02: Frontend — route or query resolution for shop context; catalog + detail + deep links preserve `shop_id`; optional default shop env for single-tenant deploys
- [x] 16-03: E2E + regression — Playwright scenarios for two shops, cross-tenant negative case, link builder smoke for public nav

## Execution Update (2026-04-20) — Security / media follow-up (ngoài số phase)

Đã triển khai trên nhánh `feat/security-signed-media-csrf-throttle` (chưa gộp vào roadmap phase mới; bổ sung cho **Phase 5** production-hardening và **Phase 2** media an toàn):

- Bỏ phục vụ tĩnh `/uploads`; URL file ký HMAC qua `GET /api/v1/media`; tùy chọn `MEDIA_SIGNING_SECRET`.
- CSRF double-submit (middleware + cookie + frontend retry/bootstrap).
- Bắt buộc secret dài, `runtime-security` production checks, throttle điểm nóng (auth/upload/AI), cô lập tenant thêm cho AI routes.

Gợi ý tài liệu follow-up: cập nhật `docs/API_CONTRACT.md` / `ENV.md` khi merge PR (media raw response, biến env mới).

### Phase 17: Cloudflare R2 upload — migrate backend media from local disk to object storage

**Goal:** Persist uploaded media in **Cloudflare R2** (S3-compatible) behind `IStorageService`, with **presigned GET** URLs by default and optional **`GET /api/v1/media` proxy** for signed-link compatibility; keep **`STORAGE_DRIVER=local`** for dev/Pi fallback; document cutover from existing `UPLOAD_DIR`.
**Requirements:** MEDI-01, MEDI-02, MEDI-03, PLAT-01, PLAT-02
**Depends on:** Phase 16
**Plans:** 3/3 plans complete

Plans:
- [ ] 17-01: Backend — `R2StorageService`, `STORAGE_DRIVER` wiring, presigned `getFileUrl`, unit tests with mocked S3
- [ ] 17-02: Backend — `MediaController` R2 streaming branch + contract docs for URL semantics
- [ ] 17-03: Ops/docs — ENV + deployment + Pi notes + cutover runbook (optional staging smoke checkpoint)

### Phase 19: Pre-order PAID → Member Points

**Goal:** When a pre-order transitions to `PAID`, automatically award loyalty points to the bound `Member` based on `vnd_per_point` and basis (`paid_amount` | `total_amount`); reverse points idempotently when the order is reversed after `PAID`; member selection mandatory on create.
**Requirements:** PORD-02, MEMB-01
**Depends on:** Phase 9 (pre-order), Phase 11 (members/points)
**Plans:** 3 plans

Plans:
- [x] 19-01: Schema — `pre_orders.member_id`, shop loyalty config, ledger `reference_*` + idempotency unique
- [x] 19-02: Backend — validate member on create; transaction earn on `PAID`; export `MembersService`; shop settings API
- [x] 19-03: FSM reversal trừ điểm idempotent; admin UI member picker + labels; E2E assert member name in participant rows

---

### Phase 20: Issue #145 - Tokenized QR Gateway

**Goal:** Generate a stable, token-based QR code per product so codes never expire; public gateway 302-redirects to catalog; admin step 5 with preview, copy-link, download, and direct thermal print from both step 5 and product list.
**Requirements:** PBLC-04 (proposed)
**Depends on:** Phase 16 (public catalog), Phase 3 (public item detail)
**Plans:** 2 plans

Plans:
- [x] 20-01: Backend — `qr_token` migration, `QrService`, `GET /items/:id/qr`, `GET /public/qr/:token` gateway, contract docs
- [x] 20-02: Frontend — Admin step 5 QR panel, copy/download/print actions, public banner for `?source=qr`; Playwright smoke

---

### Phase 21: Defense-in-Depth Security Hardening

**Goal:** Harden the API surface with security headers, optional JWT bearer, tighter AI limits, and structured observability logging without breaking existing cookie-based auth flows.
**Requirements:** PLAT-04 (proposed)
**Depends on:** Phase 5, Phase 15
**Plans:** 1 plan

Plans:
- [x] 21-01: Helmet CSP/CORP headers, `JWT_ALLOW_AUTHORIZATION_BEARER` toggle, AI throttle + instruction cap, 4xx/5xx structured logs, Dependabot config

---

### Phase 22: Pre-order UX Enhancements

**Goal:** Close UX and data-model gaps discovered after Phase 9/19: item-level pre-order status, campaign closing date, countdown progress bar, `preorder_opens_at` persistence, UUID v7 migration, and atomic token revocation.
**Requirements:** PORD-03 (proposed)
**Depends on:** Phase 9, Phase 19
**Plans:** 4 plans

Plans:
- [x] 22-01: Item `preorder` status + FSM transition rules + campaign shortcut button (Issue #209)
- [x] 22-02: Pre-order closing-date selector on admin campaign form (Issue #228)
- [x] 22-03: Countdown progress bar on public pre-order page (Issue #227) + persist `preorder_opens_at`
- [x] 22-04: UUID v4→v7 migration across all models; atomic refresh-token revocation guard

---

### Phase 23: CI/CD Overhaul — pnpm-first Pipelines & Gated Pi Deploy

**Goal:** Standardize the monorepo on `pnpm-lock.yaml`; add a robust multi-job CI gate (backend / frontend / security / health-check); gate Pi deploy on CI success; add hygiene workflows (Gitleaks, Commitlint, Labeler, Dependabot).
**Requirements:** DEVOPS-01 (proposed)
**Depends on:** Phase 5 (CI baseline)
**Plans:** 1 plan

Plans:
- [x] 23-01: pnpm lockfile unification, CI multi-job gate, gated Pi deploy, hygiene workflows, rsync UPLOAD_DIR protection, postmortem + runbooks

---

### Phase 24: Pre-order Receipt — Thermal Print & Share Image

**Goal:** Generate a printable thermal receipt (58mm) and shareable PNG for each pre-order; expose `GET /preorders/:id/receipt` API; support native browser print and Web Share API on admin + public My Orders.
**Requirements:** PORD-04 (proposed)
**Depends on:** Phase 9, Phase 19, Phase 11 (member address)
**Plans:** 1 plan

Plans:
- [x] 24-01: Backend receipt API + `members.address` migration; frontend thermal print layout + PNG export/share via `html-to-image`; E2E coverage

---

### Phase 25: Backend Staging Deploy on Vercel

**Goal:** Add a separate GitHub Actions workflow that deploys the backend to a Vercel staging environment after CI passes, gated on migrate success, so changes can be validated in a production-like environment before hitting the Pi.
**Requirements:** DEVOPS-02 (proposed)
**Depends on:** Phase 23 (CI gate), Phase 5 (deploy baseline)
**Plans:** 1 plan

Plans:
- [x] 25-01: Staging deploy workflow (`deploy-staging.yml`), migrate gate, aligned deploy checks

---

### Phase 26: Issue #232/#237/#243/#244/#246 - Auth Security Hardening Wave 1

**Goal**: Build anti-brute force protection layers including login audit log, X-Trace-Id tracing, per-email rate limit, account lockout, admin UI viewer, and Google reCAPTCHA v3.
**Depends on**: Phase 15, Phase 21
**Requirements**: AUTH-SEC-01 (proposed)
**Plans**: 3 plans

Plans:
- [ ] 26-01: Login audit log + X-Trace-Id tracing (#232)
- [ ] 26-02: Email rate limit + account lockout (PostgreSQL-backed, survive restart) (#237, #246)
- [ ] 26-03: Admin UI: login audit log & account unlock + reCAPTCHA v3 (#243, #244)

---

### Phase 27: Issue #238/#242/#245/#289 - Auth Security Wave 2 — Alerting, E2E & Ops

**Goal**: Complete security incident detection and response with Telegram alerts, Playwright E2E security flows, production ops checklist, and staging pipeline completion.
**Depends on**: Phase 26, Phase 23, Phase 25
**Requirements**: AUTH-SEC-02 (proposed)
**Plans**: 3 plans

Plans:
- [ ] 27-01: Telegram security alerts (dedupe + threshold) (#238)
- [ ] 27-02: Playwright E2E security flows (lockout, CAPTCHA, rate limit) (#242)
- [ ] 27-03: Production ops security checklist & staging pipeline completion (#245, #289)


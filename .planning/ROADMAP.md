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
- [ ] **Phase 16: Per-Shop Public Homepage** - Resolve public catalog and item detail to a single shop tenant via URL or explicit query param, aligned with existing multi-tenant isolation.

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
**Requirements**: MEMB-01, MEMB-02
**Plans**: 2 plans

Plans:
- [x] 11-01: Implement membership/points schema and core rules
- [x] 11-02: Build membership APIs and admin management UI

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
| 16. Per-Shop Public Homepage | 0/3 | Planned | — |

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

Phases not yet complete and pending tasks:
- Phase 16: Per-Shop Public Homepage — plans authored; execution pending (`16-01` through `16-03`).

Partially executed phases (still pending full completion):
- None.

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
**Plans:** 3 plans

Plans:
- [ ] 16-01: Backend — optional `shop_id` on public item list/detail; resolve by UUID or `Shop.slug`; 404 for unknown/inactive shop; tests + contract docs
- [ ] 16-02: Frontend — route or query resolution for shop context; catalog + detail + deep links preserve `shop_id`; optional default shop env for single-tenant deploys
- [ ] 16-03: E2E + regression — Playwright scenarios for two shops, cross-tenant negative case, link builder smoke for public nav

## Execution Update (2026-04-20) — Security / media follow-up (ngoài số phase)

Đã triển khai trên nhánh `feat/security-signed-media-csrf-throttle` (chưa gộp vào roadmap phase mới; bổ sung cho **Phase 5** production-hardening và **Phase 2** media an toàn):

- Bỏ phục vụ tĩnh `/uploads`; URL file ký HMAC qua `GET /api/v1/media`; tùy chọn `MEDIA_SIGNING_SECRET`.
- CSRF double-submit (middleware + cookie + frontend retry/bootstrap).
- Bắt buộc secret dài, `runtime-security` production checks, throttle điểm nóng (auth/upload/AI), cô lập tenant thêm cho AI routes.

Gợi ý tài liệu follow-up: cập nhật `docs/API_CONTRACT.md` / `ENV.md` khi merge PR (media raw response, biến env mới).

# Roadmap: Diecast360

## Overview

This roadmap organizes Diecast360 delivery from core product foundations to operations, automation, and scale features.

## Phases

- [x] **Phase 1: Inventory Foundation** - Data model and item lifecycle management.
- [ ] **Phase 2: Media Pipeline** - Image and spinner asset management.
- [ ] **Phase 3: Public Experience** - Public catalog and product viewing workflow.
- [ ] **Phase 4: AI and Social Selling** - Content generation and seller assist tools.
- [ ] **Phase 5: Production and Integrations** - Docker, CI, and Facebook API baseline.
- [ ] **Phase 6: Issue #58 - Mobile Responsive UI** - Mobile-first UX hardening for admin/public pages.
- [ ] **Phase 7: Issue #57 - Quantity and Custom Attributes** - Extend product model with stock quantity and custom metadata.
- [ ] **Phase 8: Issue #46 - Advanced Inventory Management** - Transaction-based inventory and stock audit trail.
- [ ] **Phase 9: Issue #13 - Pre-Order Management** - Pre-order lifecycle management for model products.
- [ ] **Phase 10: Issue #49 - Reporting and Analytics** - KPI dashboard and analytics APIs.
- [ ] **Phase 11: Issue #48 - Membership and Points** - Member tiers and points ledger system.
- [ ] **Phase 12: Issue #44 - Playwright Phase 1** - E2E smoke automation setup and CI integration.
- [ ] **Phase 13: Issue #33 - Playwright Phase 2** - Extended E2E coverage and quality-gate hardening.

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
- [ ] 03-01: Deliver public catalog and detail UX consistency

### Phase 4: AI and Social Selling
**Goal**: AI-generated listing content and social-ready outputs.
**Depends on**: Phase 3
**Requirements**: AISO-01, AISO-02, AISO-03
**Plans**: 1 plan

Plans:
- [ ] 04-01: Complete AI-assisted listing and social publishing flow

### Phase 5: Production and Integrations
**Goal**: Production-ready operations and Facebook API integration baseline.
**Depends on**: Phase 4
**Requirements**: PLAT-01, PLAT-02, PLAT-03
**Plans**: 1 plan

Plans:
- [ ] 05-01: Ship production hardening and Facebook integration baseline

### Phase 6: Issue #58 - Mobile Responsive UI
**Goal**: Complete mobile-first responsive UX for admin/public core screens.
**Depends on**: Phase 5
**Requirements**: RESP-01
**Plans**: 2 plans

Plans:
- [ ] 06-01: Harden admin mobile UX and responsive navigation
- [ ] 06-02: Harden public mobile UX and responsive smoke checks

### Phase 7: Issue #57 - Quantity and Custom Attributes
**Goal**: Add quantity and flexible custom attributes to product domain model.
**Depends on**: Phase 5
**Requirements**: ATTR-01, ATTR-02
**Plans**: 3 plans

Plans:
- [ ] 07-01: Add schema and migration for quantity/attributes
- [ ] 07-02: Update item API contract and validations
- [ ] 07-03: Implement admin UI and regression tests for new fields

### Phase 8: Issue #46 - Advanced Inventory Management
**Goal**: Build advanced inventory transaction management with audit trail.
**Depends on**: Phase 7
**Requirements**: STOK-01
**Plans**: 3 plans

Plans:
- [ ] 08-01: Implement inventory transaction schema and service core
- [ ] 08-02: Expose inventory transaction APIs and authorization rules
- [ ] 08-03: Add inventory timeline UI and reconciliation tests

### Phase 9: Issue #13 - Pre-Order Management
**Goal**: Deliver pre-order lifecycle management for model products.
**Depends on**: Phase 7
**Requirements**: PORD-01
**Plans**: 3 plans

Plans:
- [ ] 09-01: Add pre-order schema and state model
- [ ] 09-02: Build pre-order APIs and transition rules
- [ ] 09-03: Add admin pre-order management UI and flow tests

### Phase 10: Issue #49 - Reporting and Analytics
**Goal**: Add reporting and analytics dashboard for operations insights.
**Depends on**: Phase 8, Phase 9
**Requirements**: RPTG-01
**Plans**: 2 plans

Plans:
- [ ] 10-01: Build KPI aggregation APIs and fixture-based validation
- [ ] 10-02: Build reports dashboard UI with filter and chart states

### Phase 11: Issue #48 - Membership and Points
**Goal**: Implement membership tiers and points management.
**Depends on**: Phase 7
**Requirements**: MEMB-01, MEMB-02
**Plans**: 2 plans

Plans:
- [ ] 11-01: Implement membership/points schema and core rules
- [ ] 11-02: Build membership APIs and admin management UI

### Phase 12: Issue #44 - Playwright Phase 1
**Goal**: Establish Playwright E2E automation baseline.
**Depends on**: Phase 5
**Requirements**: QATE-01
**Plans**: 3 plans

Plans:
- [ ] 12-01: Setup Playwright infra and fixtures baseline
- [ ] 12-02: Add smoke E2E coverage for critical user flows
- [ ] 12-03: Integrate Playwright job and artifacts in CI

### Phase 13: Issue #33 - Playwright Phase 2
**Goal**: Expand Playwright coverage and enforce quality gates.
**Depends on**: Phase 10, Phase 11, Phase 12
**Requirements**: QATE-02
**Plans**: 3 plans

Plans:
- [ ] 13-01: Add advanced E2E coverage for feature-heavy flows
- [ ] 13-02: Stabilize flaky tests with isolation and reliability tuning
- [ ] 13-03: Promote E2E to required quality gate in CI

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Inventory Foundation | 1/1 | Complete | 2026-03-05 |
| 2. Media Pipeline | 0/1 | In progress (partial) | Admin 4-step flow + media validation on finish |
| 3. Public Experience | 0/1 | Not started | - |
| 4. AI and Social Selling | 0/1 | In progress (partial) | Step 4 "Hoàn tất" flow and guardrails implemented |
| 5. Production and Integrations | 0/1 | Not started | - |
| 6. Issue #58 - Mobile Responsive UI | 0/2 | In progress (partial) | Mobile stepper UX and navigation controls improved |
| 7. Issue #57 - Quantity and Custom Attributes | 0/3 | Not started | - |
| 8. Issue #46 - Advanced Inventory Management | 0/3 | Not started | - |
| 9. Issue #13 - Pre-Order Management | 0/3 | Not started | - |
| 10. Issue #49 - Reporting and Analytics | 0/2 | Not started | - |
| 11. Issue #48 - Membership and Points | 0/2 | Not started | - |
| 12. Issue #44 - Playwright Phase 1 | 0/3 | Not started | - |
| 13. Issue #33 - Playwright Phase 2 | 0/3 | Not started | - |

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

## Remaining Work Snapshot (By Phase)

Phases not yet executed and pending tasks:
- Phase 3: `03-01` Deliver public catalog and detail UX consistency.
- Phase 5: `05-01` Ship production hardening and Facebook integration baseline.
- Phase 7: `07-01`, `07-02`, `07-03` Quantity/custom-attributes schema, API, admin UI.
- Phase 8: `08-01`, `08-02`, `08-03` Advanced inventory transactions and audit trail.
- Phase 9: `09-01`, `09-02`, `09-03` Pre-order domain + API + admin flow.
- Phase 10: `10-01`, `10-02` Analytics API and dashboard UI.
- Phase 11: `11-01`, `11-02` Membership and points rules + admin tooling.
- Phase 12: `12-01`, `12-02`, `12-03` Playwright baseline and CI integration.
- Phase 13: `13-01`, `13-02`, `13-03` Extended E2E coverage and quality gates.

Partially executed phases (still pending full completion):
- Phase 2: `02-01` still pending full media pipeline hardening across all upload surfaces and resiliency checks.
- Phase 4: `04-01` still pending complete AI-social publishing lifecycle validation.
- Phase 6: `06-01`, `06-02` still pending full admin/public responsive hardening and smoke checks.


---
phase: 16-per-shop-public-homepage
plan: 01
subsystem: api
tags: [nest, prisma, multi-tenant, public-api]

requires:
  - phase: 14-multi-tenant-shop
    provides: Shop model, slug, is_active, tenant concepts
provides:
  - Public GET /public/items and /public/items/:id accept optional shop_id (UUID or exact slug) for active shops; explicit param overrides JWT active_shop_id
  - PublicShopResolverService + API contract documentation
affects: [16-02, 16-03]

tech-stack:
  added: []
  patterns: [Explicit public shop context via query string before JWT tenant fallback]

key-files:
  created:
    - backend/src/public/public-shop-resolver.service.ts
    - backend/src/public/public.controller.spec.ts
    - backend/src/public/public-shop-resolver.service.spec.ts
  modified:
    - backend/src/public/public.controller.ts
    - backend/src/public/public.module.ts
    - backend/src/public/dto/query-public-items.dto.ts
    - backend/src/public/dto/query-public-items.dto.spec.ts
    - backend/src/public/public.service.spec.ts
    - docs/API_CONTRACT.md

key-decisions:
  - "Slug match is case-sensitive and exact; invalid or inactive shop returns NOT_FOUND with message 'Shop not found'"

patterns-established:
  - "resolveCanonicalShopId(raw) returns null to mean fall back to JWT; non-null means single effective shop filter"

requirements-completed: [PBLC-03, MULT-01, MULT-03]

duration: 30min
completed: 2026-04-30
---

# Phase 16 Plan 01 Summary

**Optional `shop_id` on public item list/detail resolves to an active shop (UUID or slug) and overrides JWT for catalog scoping; unknown shops return 404.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added `PublicShopResolverService` (Prisma lookup by id or slug, `is_active: true` only).
- Extended `QueryPublicItemsDto` with `shop_id`; `findOne` reads `@Query('shop_id')`.
- Documented behavior in `docs/API_CONTRACT.md` and added unit coverage (resolver, controller, DTO, service cross-tenant detail).

## Task Commits

1. **Task 1: DTO + resolver** — `702002f` (feat)
2. **Task 2–3: Controller + contract + tests** — `d86ed2a` (feat)

## Deviations from Plan

None — plan executed as written.

## Next Phase Readiness

Backend contract is ready for frontend to pass `shop_id` on all public catalog and detail requests (16-02).

---
*Phase: 16-per-shop-public-homepage*
*Completed: 2026-04-30*

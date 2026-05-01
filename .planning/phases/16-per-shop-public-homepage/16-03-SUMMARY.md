---
phase: 16-per-shop-public-homepage
plan: 03
subsystem: testing
tags: [playwright, e2e, multi-tenant, public-catalog]

requires:
  - phase: 16-per-shop-public-homepage
    provides: Backend shop_id + frontend wiring from 16-01 and 16-02
provides:
  - Playwright mock keyed by shop_id with negative assertions across shop A / shop B
  - Regression cases for aggregate catalog without shop_id and nav preorder link with shop_id
affects: []

tech-stack:
  added: []
  patterns: [Route handler parses URLSearchParams for shop_id to fulfill tenant-specific fixtures]

key-files:
  created: []
  modified:
    - frontend/tests/e2e/public-catalog.spec.ts

key-decisions:
  - "Inactive slug / NOT_FOUND covered at resolver unit tests (16-01); no duplicate service-layer tests required"

patterns-established: []

requirements-completed: [PBLC-03, MULT-01]

duration: 25min
completed: 2026-04-30
---

# Phase 16 Plan 03 Summary

**Playwright mocks `/api/v1/public/items` by `shop_id` so shop A never renders shop B titles; smoke paths without `shop_id` and preorder nav link preserve regression.**

## Verification commands run

- `cd frontend && pnpm exec playwright install chromium` (once per environment missing browsers)
- `cd frontend && pnpm exec playwright test public-catalog.spec.ts --reporter=line` → **9 passed**
- `cd backend && npx jest src/public/` → **pass** (resolver + service coverage from phase)

## Task commits

Documented in repo commit completing this summary.

## Backend regression slice

Slug case-sensitivity and inactive shop → NOT_FOUND are asserted in `public-shop-resolver.service.spec.ts` (16-01); no additional `public.service.spec.ts` duplication.

---
*Phase: 16-per-shop-public-homepage · Completed: 2026-04-30*

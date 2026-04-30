---
phase: 16-per-shop-public-homepage
plan: 02
subsystem: ui
tags: [react-router, react-query, vite, multi-tenant]

requires:
  - phase: 16-per-shop-public-homepage
    provides: Backend accepts shop_id on GET /public/items
provides:
  - usePublicShopContext hook (query → VITE_PUBLIC_CATALOG_SHOP_ID → JWT active_shop_id)
  - Catalog URL state preserves shop_id; catalog/detail/API calls append shop_id
  - Layout public nav preserves shop_id across routes
affects: [16-03]

tech-stack:
  added: []
  patterns: [Same precedence as PreOrdersPage for shop resolution]

key-files:
  created:
    - frontend/src/hooks/usePublicShopContext.ts
    - frontend/src/api/config.ts
  modified:
    - frontend/src/config/api.ts
    - frontend/src/pages/publicCatalogUrlState.ts
    - frontend/src/pages/PublicCatalogPage.tsx
    - frontend/src/pages/PublicItemDetailPage.tsx
    - frontend/src/components/catalog/ItemCard.tsx
    - frontend/src/components/Layout.tsx
    - frontend/.env.example

key-decisions:
  - "Back navigates to catalog home with current query string so shop_id is preserved"

patterns-established:
  - "effectiveShopId in React Query keys for public-items and public-item"

requirements-completed: [PBLC-03, MULT-03]

duration: 40min
completed: 2026-04-30
---

# Phase 16 Plan 02 Summary

**Public catalog and detail use a shared `effectiveShopId` (URL, env default, then JWT) and pass `shop_id` on all public item API calls; nav and item links keep the param.**

## Task Commits

1. **Implementation** — (this commit) feat(frontend): per-shop public catalog context (16-02)

## Deviations from Plan

None.

---
*Phase: 16-per-shop-public-homepage*
*Completed: 2026-04-30*

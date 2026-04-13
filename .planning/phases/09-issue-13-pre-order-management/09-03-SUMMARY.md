# Summary — Phase 09 Plan 03

## What shipped
- Added admin pre-order UI pages for list/transition flow, create campaign form, and campaign participant management.
- Added public mobile-first pre-order list and "Don hang cua toi" tracking pages with bottom navigation and CTA actions.
- Wired new routes and navigation links for both admin and public surfaces.
- Added Playwright regression coverage for admin flow transitions and public rendering smoke checks.

## Key files
- `frontend/src/pages/admin/PreOrdersPage.tsx`
- `frontend/src/pages/admin/preorders/CreatePreOrderPage.tsx`
- `frontend/src/pages/admin/preorders/PreOrderManagementPage.tsx`
- `frontend/src/pages/public/PreOrdersPage.tsx`
- `frontend/src/pages/public/MyOrdersPage.tsx`
- `frontend/tests/e2e/preorders.spec.ts`

## Validation run
- `npm run build`
- `npm run test:e2e -- preorders.spec.ts`

## Notes
- Public pre-order list currently derives `shop_id` from authenticated user context (`active_shop_id` fallback to first `allowed_shop_ids`).
- This plan focused on MVP UI and flow coverage; deeper campaign business operations remain governed by backend API rules.

## Review Round 2 (2026-04-13)
- High: `/preorders` currently depends on authenticated user context to resolve `shop_id`, so it is not fully public for anonymous visitors.
- Medium: campaign management page uses first-order `item_id` as implicit campaign selector; quick actions are still non-functional placeholders.
- Medium: e2e spec covers happy paths and render smoke, but does not yet assert invalid transition error handling as planned.
- Low: frontend transition map excludes `ARRIVED -> CANCELLED` while backend domain allows it.

## Follow-up Actions
- Add explicit public shop resolution strategy for `/preorders` (route param, default shop slug, or config-backed shop id).
- Add campaign selector and wire quick actions on admin management page.
- Extend Playwright preorders spec with invalid transition case and assertion for API error surface.
- Align frontend transition map with backend domain transition source of truth.


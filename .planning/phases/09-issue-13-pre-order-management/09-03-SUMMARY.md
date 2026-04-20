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

## Review Round 2 (2026-04-13) — đã đóng (2026-04-20, plan 09-04)
- Public `/preorders`: ưu tiên `?shop_id=` + `VITE_PUBLIC_PREORDER_SHOP_ID`; không hiển thị “chờ shop” khi đã có ngữ cảnh shop cố định mà không cần JWT.
- Campaign admin: selector rõ ràng + quick links; chọn campaign qua state override + `useMemo`.
- Invalid transition: UI hiển thị `message` từ API; E2E assert chuỗi domain; thêm unit `preorderApiError.spec.ts` (Vitest) vì môi trường dev có thể thiếu lib Playwright.
- Transition map: FE đã khớp BE (`ARRIVED` → `PAID` | `CANCELLED`); ghi chú nguồn truth trong `status.ts`.

## Follow-up Actions
- (Hoàn thành) Các mục trên được theo dõi trong `09-04-PLAN.md`.


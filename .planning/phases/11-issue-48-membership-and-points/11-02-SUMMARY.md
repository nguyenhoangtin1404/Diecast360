# Summary — Phase 11 Plan 02

## What shipped
- Added members backend module/service/controller with tenant + role-guarded management endpoints.
- Implemented member list/detail/create/update flows and points adjustment workflow that always writes ledger records.
- Added membership tier management flow (create/update/delete) on backend APIs and admin UI.
- Hardened points adjustment semantics so `adjust` supports signed corrections while preserving ledger integrity (`points` absolute, `delta` signed).
- Added admin `MembersPage` with search/list, create form, points-adjustment form, and ledger timeline view.
- Added Playwright smoke test for `/admin/members` render, tier management actions, and member-ledger interaction path.

## Key files
- `backend/src/members/members.module.ts`
- `backend/src/members/members.controller.ts`
- `backend/src/members/members.service.ts`
- `backend/src/members/members.controller.spec.ts`
- `backend/src/members/members.service.spec.ts`
- `frontend/src/pages/admin/MembersPage.tsx`
- `frontend/src/api/members.ts`
- `frontend/src/App.tsx`
- `frontend/src/config/routes.ts`
- `frontend/src/components/Layout.tsx`
- `frontend/tests/e2e/members.spec.ts`

## Validation run
- `pnpm --filter diecast360-backend test -- members`
- `pnpm --filter frontend build`

## Test coverage notes
- Backend controller tests now cover tier CRUD routing (`createTier`, `updateTier`, `deleteTier`).
- Backend service tests now cover signed negative `adjust` behavior and tier CRUD service behavior.
- Frontend Playwright smoke now asserts tier creation/deletion API calls in addition to members list/ledger rendering.

## Notes
- Local Playwright execution is environment-limited on this machine due missing browser shared libs (`libnspr4.so`), so e2e file was added but not executable locally.
- Frontend build succeeds and route wiring for `/admin/members` is complete.

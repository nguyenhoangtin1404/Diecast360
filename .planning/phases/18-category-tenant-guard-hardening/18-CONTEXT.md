# Phase 18 Context - Category Tenant Guard Hardening

## Background
Code review ngay 2026-05-12 phat hien category mutate routes dang thieu `TenantGuard` trong khi cac API tenant-sensitive khac nhu items/images/spinner/inventory dung `JwtAuthGuard`, `TenantGuard`, `RolesGuard`.

## Current Behavior
- `PATCH /categories/:id`, `PATCH /categories/:id/toggle`, `DELETE /categories/:id` dung `JwtAuthGuard` + `RolesGuard`.
- Controller doc active shop tu `req.user.active_shop_id` va service check category shop scope.
- `RolesGuard` load `userShopRole` theo user, khong check `shop.is_active`.
- `TenantGuard` da co check user membership + `shop.is_active` va gan `request.tenantId`.

## Risk
Sau khi shop bi deactivate, access token cu van co `active_shop_id`. Neu user van co `user_shop_roles` row, `RolesGuard` co the pass route mutate category cho den khi token het han. Day la authorization lifecycle gap, khong phai cross-tenant data leak truc tiep.

## Preferred Direction
Giu active-shop validation nhat quan voi cac tenant API khac, nhung khong them `TenantGuard` may moc vao mixed platform+tenant routes. Neu route chap nhan ca platform-super va tenant roles, implementation phai split platform-only/tenant-only path hoac bo sung `shop.is_active` validation trong tenant-role branch de platform_super khong bi buoc phai co active shop khi thao tac global category.

## Files to Inspect
- `backend/src/categories/categories.controller.ts`
- `backend/src/categories/categories.service.ts`
- `backend/src/common/guards/tenant.guard.ts`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/categories/categories.service.spec.ts`
- `backend/src/common/guards/tenant.guard.spec.ts`
- `backend/src/common/guards/roles.guard.spec.ts`

## Verification Baseline
- `pnpm --filter ./backend exec jest --runInBand`
- `pnpm --filter ./backend exec eslint "{src,apps,libs,test}/**/*.ts"`
- `pnpm --filter ./backend build`

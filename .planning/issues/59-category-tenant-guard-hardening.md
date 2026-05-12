# Issue #59 - Category Tenant Guard Hardening

## Goal
Dong bo bao ve tenant cho cac route mutate category de shop-level users khong the thao tac category khi active shop khong con hop le/khong active.

## Problem
`CategoriesController` hien co cac route mutate (`PATCH /categories/:id`, `PATCH /categories/:id/toggle`, `DELETE /categories/:id`) dung `JwtAuthGuard` + `RolesGuard` nhung khong chay `TenantGuard`.

`RolesGuard` xac thuc role theo `user_shop_roles` va so khop `active_shop_id`, nhung khong include/check `shop.is_active`. `TenantGuard` moi la noi hardening tenant lifecycle: xac thuc active shop thuoc user va shop con active.

## Impact
Neu mot shop bi deactivate sau khi JWT da duoc cap, shop admin/staff co the con goi duoc route mutate category trong thoi gian access token con hieu luc. Service da chan cross-shop/global mutation, nhung lifecycle authorization voi inactive shop chua dong bo voi cac tenant API khac.

## Scope
- Backend category mutate routes:
  - `PATCH /categories/:id`
  - `PATCH /categories/:id/toggle`
  - `DELETE /categories/:id`
- Regression tests cho guard wiring / inactive-shop denial.
- Khong doi public category read endpoints.
- Khong doi platform-super global category behavior.

## Tasks
1. Add `TenantGuard` vao cac route category mutate shop-level de request duoc validate active shop truoc khi vao `RolesGuard`/service.
2. Bao toan platform-super behavior cho global category create/update/toggle/delete neu route can platform-level access.
3. Them/bo sung test cho scenario shop inactive sau khi JWT da cap:
   - shop admin/staff bi deny khi mutate shop category cua inactive active shop.
   - platform_super van mutate global category duoc theo rule hien tai.
   - public/optional read category endpoints khong bi anh huong.
4. Chay backend lint/test target va full backend test neu thoi gian cho phep.

## Deliverables
- Backend patch authorization guard wiring cho category mutate routes.
- Regression tests trong `backend/src/categories/categories.service.spec.ts` hoac controller/guard spec phu hop.
- Cap nhat docs/planning summary neu behavior authorization thay doi dang ke.

## Done Criteria
- Category mutate routes shop-level deu di qua active-shop validation tu `TenantGuard` hoac equivalent check trong `RolesGuard`.
- Inactive shop khong the mutate shop-scoped category bang JWT cu.
- Platform-super flow khong bi regression.
- Backend lint + relevant Jest suite pass.

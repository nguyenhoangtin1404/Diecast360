# Phase 15 Context: Admin RBAC & Per-Shop Authorization Refinement

**Gathered:** 2026-04-29  
**Status:** Ready for execution  
**Depends on:** Phase 14 (Multi-Tenant Shop) — schema, `TenantGuard`, `RolesGuard`, JWT `active_shop_id`

## Business objective

Làm rõ và củng cố **hai tầng quyền**: (1) quản trị **nền tảng** (toàn bộ shop, vòng đời tenant), (2) quản trị **theo từng shop** (dữ liệu vận hành tenant-scoped). Hiện tại `super_admin` gắn trong `UserShopRole` nhưng `RolesGuard` xử lý như **quyền toàn cục** — dễ gây nhầm khi mở rộng (ví dụ “chủ shop A” không nên đồng nghĩa “vận hành platform”). Phase này chuẩn hóa mô hình, mở rộng vai trò shop tối thiểu, và đồng bộ API + admin UI.

## Current architecture (baseline)

| Thành phần | Hành vi hiện tại |
|------------|------------------|
| `UserShopRole` | `(user_id, shop_id)` → một `ShopRole` (`super_admin` \| `shop_admin`). |
| `RolesGuard` | `super_admin`: cho phép **không** cần `active_shop_id` khớp; các role khác bắt buộc `active_shop_id` và membership shop đó. |
| `TenantGuard` | `active_shop_id` từ JWT; verify membership + `shop.is_active`; set `request.tenantId`. |
| `User.role` | String legacy (`admin` mặc định) — trùng semantic tiềm ẩn với shop roles; cần chính sách rõ. |
| Super-admin-only API | `ShopsController`, `CategoriesController` (một phần): `JwtAuthGuard` + `RolesGuard` + `@Roles(super_admin)` — không `TenantGuard`. |
| Tenant + admin API | Ví dụ `items`, `members`, `inventory`: `TenantGuard` + đôi khi `@Roles(shop_admin, super_admin)`. |

## Locked decisions (implementation must follow)

1. **Tách quyền platform khỏi “super gắn shop”**  
   - Thêm trường trên `User` (ví dụ enum `platform_role`) với giá trị nullable + ít nhất một giá trị tương đương “toàn hệ thống” (`platform_super` hoặc tên team chốt trong migration).  
   - **Backfill**: mọi user đang có **bất kỳ** `UserShopRole.role === super_admin` → gán `platform_role` tương ứng (để không làm gián đoạn prod).  
   - **Transition**: `RolesGuard` cho route chỉ yêu cầu quyền platform **ưu tiên** đọc `platform_role`; vẫn chấp nhận legacy `UserShopRole.super_admin` trong một khoảng (feature flag hoặc TODO gỡ) nếu migration chưa chạy xong — quyết định cụ thể ghi trong plan 15-02 (một nhánh rõ ràng, tránh hai nguồn sự thật vĩnh viễn).

2. **Vai trò theo shop (tenant) mở rộng tối thiểu**  
   - Thêm ít nhất một role **hạn chế hơn** `shop_admin` (đề xuất: `shop_staff` — chỉ đọc / thao tác an toàn được liệt kê trong ma trận).  
   - Giữ tương thích: `shop_admin` hiện có map sang hành vi “full tenant admin” trừ các hành động chỉ `platform` (quản lý shop global, categories global nếu có).

3. **Không giảm tenant isolation**  
   - Mọi query/data mutation tenant-scoped vẫn bắt buộc `TenantGuard` + filter `shop_id` / `tenantId` như Phase 14. Thay đổi RBAC không được bỏ kiểm tra membership.

4. **Audit & khả năng quan sát**  
   - Mở rộng `ShopAuditAction` (hoặc log platform riêng nếu tách module) cho: thay đổi `platform_role`, thay đổi role thành viên shop, lần đầu gán `shop_staff`.

5. **Frontend đồng bộ**  
   - Menu/route ẩn theo capability thực tế (không chỉ dựa vào label); super-admin shop management chỉ hiện khi user có quyền platform.  
   - Modal thêm thành viên shop: chọn role (`shop_admin` \| `shop_staff` …) thay vì hard-code chỉ `shop_admin`.

## Permission matrix (target — implementer maps to decorators / checks)

**Platform** (`platform_role` set, hoặc legacy tạm thời):

| Capability | Ghi chú |
|------------|---------|
| CRUD shops, activate/deactivate, xem audit toàn shop | Như `ShopsController` hiện tại |
| Categories / cấu hình global (nếu áp dụng) | Route hiện `@Roles(super_admin)` không tenant |

**Tenant** (membership `UserShopRole` + `active_shop_id`):

| Capability | shop_admin | shop_staff (đề xuất) |
|------------|------------|------------------------|
| Items CRUD / media / spinner | Yes | Read-only + có thể tùy policy (ghi rõ trong 15-02) |
| Inventory điều chỉnh | Yes | No |
| Members / points | Yes | Read-only hoặc No (chốt trong 15-02) |
| Pre-orders / reports | Yes | Read-only nếu có route GET an toàn |

*Ma trận chi tiết từng endpoint có thể bổ sung trong `docs/` khi thực thi — không bắt buộc trong phase nếu team chọn “staff = read-only tất cả GET tenant” làm MVP.*

## Deferred (explicitly out of scope for Phase 15)

- RBAC đầy đủ bảng `permissions` / `role_permissions` động theo DB (có thể Phase sau nếu cần tùy biến theo shop).  
- Impersonation / “support login as shop” (session đặc biệt).  
- Đa role trên cùng một `(user, shop)` (một row — một role vẫn đủ cho MVP).

## Traceability

| Requirement ID | Mô tả ngắn |
|----------------|------------|
| MULT-01 … MULT-03 | Đã đóng Phase 14 — phase này không phá vỡ |
| MULT-04 | Platform vs tenant RBAC rõ ràng; role shop mở rộng tối thiểu |

---

*Phase: 15-admin-rbac-tenant-refinement*

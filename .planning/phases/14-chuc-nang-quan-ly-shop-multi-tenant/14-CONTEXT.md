# Phase 14: Multi-Tenant Shop Management - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Cung cấp khả năng quản lý **nhiều shop độc lập** trên cùng một deployment Diecast360.
Mỗi shop là một tenant riêng biệt — dữ liệu hoàn toàn tách biệt: `Item`, `ItemImage`, `SpinSet`, `SpinFrame`, `ai_item_drafts`, upload media.

Deliverables:
- Schema: thêm `shops` table và liên kết các entity chính (`items`, `users`) theo `shop_id`.
- API Middleware: inject và validate `tenant_id` từ JWT claims hoặc header cho mọi request.
- Super-admin: CRUD shop, assign/revoke user–shop role.
- Admin UI: shop selector ở Layout, indicator luôn hiện shop đang active.

**Out of Scope (Phase 14):**
- Subdomain routing per tenant (`shop1.diecast360.com`)
- Cross-tenant inventory transfer
- Billing/subscription per tenant
- Public catalog tách riêng theo tenant URL

</domain>

<decisions>
## Implementation Decisions

### Strategy: JWT-based tenant resolution

**Quyết định:** `tenant_id` được đọc từ JWT payload (field `shop_id`) sau khi user chọn shop và re-issue token — **không dùng `x-tenant-id` header tùy tiện từ client**.

**Lý do:** Dùng header client có thể bị spoofed. JWT-based resolver là cách an toàn hơn và phù hợp với auth hiện tại (JWT access + refresh).

**Luồng chi tiết:**
1. User login → JWT payload trả về `allowed_shop_ids: []`
2. User chọn shop → gọi `POST /auth/switch-shop` với `shop_id` → server issue JWT mới có `active_shop_id`
3. NestJS Guard / Interceptor đọc `active_shop_id` từ JWT và inject vào `request.tenantId`
4. Mọi service query thêm `where: { shop_id: req.tenantId }`

### Schema và Migration

- Thêm bảng `shops` (id, name, slug, is_active, created_at, updated_at)
- Thêm bảng `user_shop_roles` (user_id, shop_id, role ENUM: `super_admin|shop_admin`)
- Thêm cột `shop_id` vào bảng `items` (NOT NULL, FK → shops, với DEFAULT migration cho data cũ)
- `item_images`, `spin_sets`, `ai_item_drafts` — scoped gián tiếp qua `items.shop_id` (không cần thêm cột trực tiếp)
- **Migration strategy**: tạo `default_shop` seed trước, sau đó UPDATE `items SET shop_id = default_shop_id`
- Không alter migration cũ — tạo migration mới

### NestJS Implementation Pattern

- Dùng **NestJS Guard** (không phải raw middleware) để enforce tenant — tích hợp tốt hơn với DI và exception filter hiện có
- Tạo `TenantGuard` extend từ `AuthGuard` hiện tại
- Inject `tenantId` qua custom decorator `@CurrentTenantId()`

### Super Admin Role

- Super admin là user có ít nhất 1 `user_shop_roles.role = 'super_admin'`
- Super admin bypass tenant filter khi truy cập `/admin/shops`
- Các role khác bị chặn ở `ShopsController` bằng `RoleGuard`

### Data Isolation Guarantee

- Tất cả service trong phase phải có unit test coverage cho cross-tenant query scenario
- Không cho phép `shop_id` null sau migration

</decisions>

<specifics>
## Specific Ideas

### API endpoint mới cần có
- `POST /auth/switch-shop` → issue token với `active_shop_id`
- `GET /admin/shops` → list shops (super_admin only)
- `POST /admin/shops` → tạo shop mới
- `PATCH /admin/shops/:id` → sửa shop
- `GET /admin/shops/:id/members` → list users của shop đó

### DB Schema chính xác

```prisma
model Shop {
  id         String          @id @default(uuid())
  name       String
  slug       String          @unique
  is_active  Boolean         @default(true)
  created_at DateTime        @default(now())
  updated_at DateTime        @updatedAt
  items      Item[]
  user_roles UserShopRole[]
}

model UserShopRole {
  user_id    String
  shop_id    String
  role       ShopRole        @default(shop_admin)
  user       User            @relation(fields: [user_id], references: [id], onDelete: Cascade)
  shop       Shop            @relation(fields: [shop_id], references: [id], onDelete: Cascade)
  @@id([user_id, shop_id])
}

enum ShopRole {
  super_admin
  shop_admin
}

// Thêm vào model Item hiện có:
//   shop_id  String
//   shop     Shop   @relation(fields: [shop_id], references: [id])
```

</specifics>

<deferred>
## Deferred Ideas

- Subdomain routing per shop (Phase sau)
- Cross-tenant inventory transfer
- Tenant-specific Facebook page config (sẽ mở rộng Phase 5 integration)
- Billing module per tenant

</deferred>

---

*Phase: 14-chuc-nang-quan-ly-shop-multi-tenant*
*Last updated: 2026-03-23 — reviewed as Tech Lead + Senior PM*

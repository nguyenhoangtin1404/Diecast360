# Database Schema – Diecast360

Tài liệu này phản ánh `backend/prisma/schema.prisma` hiện tại. Runtime dùng PostgreSQL + Prisma; mọi migration mới phải đi qua `backend/prisma/migrations/`.

## Quy ước chung

- DB: PostgreSQL.
- Prisma client generated vào `backend/src/generated/prisma`.
- UUID cho mọi khóa chính trừ bảng join composite.
- Timestamp dùng `created_at` và `updated_at` theo snake_case.
- `items.deleted_at` là soft delete; query business phải lọc `deleted_at IS NULL`.
- `DATABASE_URL` dùng cho runtime; `DIRECT_URL` dùng cho Prisma migrate/introspect.

## Enum

| Enum | Values |
|------|--------|
| `ItemStatus` | `con_hang`, `giu_cho`, `da_ban`, `preorder` |
| `PlatformRole` | `platform_super` |
| `ShopRole` | `shop_admin` (default), `shop_staff`; `super_admin` là giá trị legacy từ trước khi có RBAC đa cấp — không gán mới, chỉ tồn tại do backward-compat |
| `ShopAuditAction` | `add_shop_admin`, `reset_member_password`, `set_member_active`, `update_shop`, `deactivate_shop`, `activate_shop`, `set_platform_role`, `set_shop_member_role` |
| `PreOrderStatus` | `PENDING_CONFIRMATION` (`cho_xac_nhan`), `WAITING_FOR_GOODS` (`dang_cho_hang`), `ARRIVED` (`da_ve`), `PAID` (`da_thanh_toan`), `REFUNDED` (`da_hoan_tien`), `CANCELLED` (`da_huy`) |
| `InventoryTransactionType` | `stock_in`, `stock_out`, `adjustment` |
| `MemberPointsMutationType` | `earn`, `redeem`, `adjust` |

## Bảng chính

### shops

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | string | NOT NULL |
| `slug` | string | UNIQUE, dùng public `shop_id` khi truyền slug |
| `is_active` | boolean | default `true` |
| `contact_json` | jsonb | Public contact page settings |
| `appearance_json` | jsonb | Logo, favicon, màu, font |
| `loyalty_json` | jsonb | Ví dụ `vnd_per_point`, `preorder_points_basis` |
| `created_at`, `updated_at` | datetime | timestamps |

### users

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `email` | string | UNIQUE |
| `password_hash` | string | Không trả ra API |
| `full_name` | string? | Nullable |
| `role` | string | Legacy role, default `admin` |
| `platform_role` | enum? | `platform_super` cho quản trị nền tảng |
| `is_active` | boolean | default `true` |
| `created_at`, `updated_at` | datetime | timestamps |

### user_shop_roles

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | FK `users(id)` ON DELETE CASCADE |
| `shop_id` | uuid | FK `shops(id)` ON DELETE CASCADE |
| `role` | enum | `shop_admin` default, hoặc `shop_staff` / legacy `super_admin` |

Primary key: `(user_id, shop_id)`.

### refresh_tokens

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK `users(id)` ON DELETE CASCADE |
| `token_hash` | string | UNIQUE, không lưu plain token |
| `expires_at` | datetime | TTL refresh |
| `revoked_at` | datetime? | Null nếu còn hiệu lực |
| `created_at` | datetime | timestamp |

### shop_audit_logs

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `shop_id` | uuid | FK `shops(id)` ON DELETE CASCADE |
| `actor_user_id` | uuid? | FK `users(id)` ON DELETE SET NULL |
| `action` | enum | `ShopAuditAction` |
| `target_type` | string | Loại object bị tác động |
| `target_id` | string? | ID target nếu có |
| `metadata_json` | string? | JSON string metadata |
| `created_at` | datetime | timestamp |

## Inventory & catalog

### items

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `shop_id` | uuid? | FK `shops(id)`, nullable do migration backward-compatible; item mới phải có shop |
| `name` | string | NOT NULL |
| `description` | text? | Nullable |
| `scale` | string | default `1:64` |
| `brand`, `car_brand`, `model_brand`, `condition` | string? | Filter/catalog fields |
| `price`, `original_price` | decimal? | Nullable |
| `status` | enum | `ItemStatus`, default `con_hang` |
| `quantity` | int | default `1`; service giữ không âm, `da_ban` ép về `0` |
| `attributes` | jsonb | Flat key-value object, default `{}` |
| `is_public` | boolean | default `false` |
| `notes` | text? | Internal notes |
| `fb_post_content` | text? | Caption/content lưu cho social selling |
| `preorder_closes_at` | datetime? | Nullable; thời điểm đóng nhận đặt pre-order. `NULL` = mở vô thời hạn. Service tự xóa khi `status` rời `preorder`. |
| `preorder_price` | decimal(18,0)? | Nullable; giá áp dụng trong thời gian cửa sổ preorder còn mở. `NULL` = dùng `price` thông thường. **Không tự xóa khi đổi status** — luôn lưu để admin theo dõi; catalog quyết định hiển thị. |
| `qr_token` | text? | NULL, UNIQUE; token 16-ký tự hex tạo lazily khi admin gọi `GET /items/:id/qr` lần đầu |
| `created_at`, `updated_at`, `deleted_at` | datetime | soft delete bằng `deleted_at` |

Indexes: `status`, `created_at`, `deleted_at`, `car_brand`, `model_brand`, `condition`, `shop_id`, `qr_token` (UNIQUE), `(status, preorder_closes_at)` (dùng cho filter `preorder_open`).

### item_images

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `item_id` | uuid | FK `items(id)` ON DELETE CASCADE |
| `file_path` | text | Storage key/path |
| `thumbnail_path` | text? | Nullable |
| `is_cover` | boolean | default `false` |
| `display_order` | int | Gallery order |
| `created_at`, `updated_at` | datetime | timestamps |

Index: `(item_id, display_order)`.

### spin_sets / spin_frames

`spin_sets` thuộc `items`; `spin_frames` thuộc `spin_sets`.

| Table | Key fields | Constraints |
|-------|------------|-------------|
| `spin_sets` | `id`, `item_id`, `label`, `is_default`, timestamps | indexes `(item_id)`, `(item_id, is_default)` |
| `spin_frames` | `id`, `spin_set_id`, `frame_index`, `file_path`, `thumbnail_path`, timestamps | UNIQUE `(spin_set_id, frame_index)`, index `(spin_set_id, frame_index)` |

Service giữ rule chỉ một default spin set có ý nghĩa trong UI và `frame_index` liên tục sau reorder/delete.

### categories

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `shop_id` | uuid? | Null = global seed; non-null = category theo shop |
| `name` | string | Category name |
| `type` | string | `car_brand` hoặc `model_brand` |
| `is_active` | boolean | default `true` |
| `display_order` | int | default `0` |
| `created_at`, `updated_at` | datetime | timestamps |

Indexes: `(type, is_active)`, `(type, display_order)`, `(shop_id, type)`, `(shop_id, type, name)`.

### inventory_transactions

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `shop_id` | uuid | FK `shops(id)` ON DELETE CASCADE |
| `item_id` | uuid | FK `items(id)` ON DELETE CASCADE |
| `actor_user_id` | uuid? | FK `users(id)` ON DELETE SET NULL |
| `reversal_of_id` | uuid? | UNIQUE, self relation |
| `type` | enum | `stock_in`, `stock_out`, `adjustment` |
| `quantity` | int | Input quantity |
| `delta` | int | Signed stock delta |
| `resulting_quantity` | int | Stock sau transaction |
| `reason`, `note` | string/text? | Audit fields |
| `created_at` | datetime | timestamp |

Indexes: `(shop_id, created_at)`, `(item_id, created_at)`, `(item_id, type, created_at)`.

## Pre-order, members & points

### pre_orders

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `shop_id` | uuid | FK `shops(id)` ON DELETE CASCADE |
| `item_id` | uuid | FK `items(id)` ON DELETE RESTRICT |
| `user_id` | uuid? | FK `users(id)` ON DELETE SET NULL |
| `member_id` | uuid? | FK `members(id)` ON DELETE RESTRICT |
| `status` | enum | default `PENDING_CONFIRMATION` |
| `quantity` | int | default `1` |
| `unit_price`, `total_amount` | decimal? | Amounts |
| `deposit_amount`, `paid_amount` | decimal | default `0` |
| `expected_arrival_at`, `expected_delivery_at` | datetime? | Nullable |
| `cover_image_url` | string? | Optional override |
| `note` | text? | Nullable |
| `created_at`, `updated_at`, `cancelled_at`, `completed_at` | datetime | lifecycle timestamps |

Indexes: `(shop_id, status)`, `item_id`, `user_id`, `member_id`, `(shop_id, expected_arrival_at)`.

Status transition hiện tại: `PENDING_CONFIRMATION → WAITING_FOR_GOODS|CANCELLED → ARRIVED|CANCELLED → PAID|CANCELLED → REFUNDED`; `REFUNDED` và `CANCELLED` là terminal.

**FK RESTRICT trên `member_id`:** Không thể xóa member khi còn pre-order chưa terminal (`PENDING_CONFIRMATION`, `WAITING_FOR_GOODS`, `ARRIVED`, `PAID`). Service phải kiểm tra trước khi gọi `DELETE`; DB sẽ reject nếu bỏ qua bước này.

### membership_tiers

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `shop_id` | uuid | FK `shops(id)` ON DELETE CASCADE |
| `name` | string | Tier name |
| `rank` | int | Thứ hạng |
| `min_points` | int | Điểm tối thiểu |
| `created_at`, `updated_at` | datetime | timestamps |

Unique: `(shop_id, name)`, `(shop_id, rank)`. Index: `(shop_id, rank)`.

### members

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `shop_id` | uuid | FK `shops(id)` ON DELETE CASCADE |
| `full_name` | string | NOT NULL |
| `email`, `phone`, `address` | string? | `email`/`phone` unique theo shop khi có giá trị |
| `points_balance` | int | default `0` |
| `tier_id` | uuid? | FK `membership_tiers(id)` ON DELETE SET NULL |
| `created_at`, `updated_at` | datetime | timestamps |

Indexes: `(shop_id, created_at)`, `(shop_id, points_balance)`, `(shop_id, full_name)`.

### member_points_ledger

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `member_id` | uuid | FK `members(id)` ON DELETE CASCADE |
| `shop_id` | uuid | FK `shops(id)` ON DELETE CASCADE |
| `actor_user_id` | uuid? | FK `users(id)` ON DELETE SET NULL |
| `type` | enum | `earn`, `redeem`, `adjust` |
| `points`, `delta`, `balance_after` | int | Ledger math |
| `reason`, `note` | string/text? | Audit fields |
| `reference_type`, `reference_id` | string? | Idempotency/reference, ví dụ pre-order paid/refund |
| `created_at` | datetime | timestamp |

Indexes: `(member_id, created_at)`, `(shop_id, created_at)`, `(shop_id, type, created_at)`.

## AI, social & vector

### ai_item_drafts

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `images_json` | text | JSON string image paths |
| `extracted_text` | text? | Nullable |
| `ai_json` | text | JSON string structured draft |
| `confidence_json` | text? | Nullable |
| `status` | string | `PENDING`, `CONFIRMED`, `REJECTED` |
| `created_at`, `updated_at` | datetime | timestamps |

### facebook_posts

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `item_id` | uuid | FK `items(id)` ON DELETE CASCADE |
| `post_url` | string | URL bài Facebook |
| `content` | text? | Caption snapshot |
| `posted_at`, `created_at` | datetime | timestamps |

Index: `item_id`.

### vector_sync_tasks

| Column | Type | Notes |
|--------|------|-------|
| `item_id` | uuid | PK, FK `items(id)` ON DELETE CASCADE |
| `attempt_count` | int | default `0` |
| `last_error` | string? | Nullable |
| `scheduled_at`, `created_at`, `updated_at` | datetime | queue timestamps |

Index: `scheduled_at`.

## Ràng buộc bắt buộc

- `(spin_set_id, frame_index)` UNIQUE
- Spin set default: UNIQUE (item_id) WHERE is_default = true
- Item soft delete: mọi query business phải filter `deleted_at IS NULL`
- `items.quantity >= 0` enforced at DB level
- `items.qr_token` UNIQUE (migration `20260520000000_add_qr_token_to_items`); lookup tại `GET /public/qr/:token`
- Khi xóa ảnh/frames, đảm bảo cập nhật order/index liên tục và cover/default hợp lệ

## Nguyên tắc migration

- Không chỉnh sửa migration đã apply ở bất kỳ môi trường nào.
- Khi cần đổi schema: tạo migration mới thay vì sửa file migration cũ.
- Nếu checksum cũ đã được apply ở môi trường bất kỳ, revert migration file về đúng blob đã apply trước khi rollout migration mới.

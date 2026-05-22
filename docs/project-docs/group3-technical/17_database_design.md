---
title: "Tài liệu Thiết kế Cơ sở Dữ liệu"
document_id: "DOC-17"
version: "1.0.0"
created_date: "2026-05-22"
author: "Tech Lead / Solution Architect"
status: "Approved"
---

# 17. Database Design Document — Diecast360

## Mục lục
1. [Entity Relationship Diagram](#1-entity-relationship-diagram)
2. [Table Definitions](#2-table-definitions)
3. [Enum Definitions](#3-enum-definitions)
4. [Relationships & Cardinality](#4-relationships--cardinality)
5. [Data Dictionary](#5-data-dictionary)
6. [Migration Strategy & Principles](#6-migration-strategy--principles)
7. [Indexing Strategy](#7-indexing-strategy)
8. [Data Retention Policies](#8-data-retention-policies)
9. [PostgreSQL-Specific Considerations](#9-postgresql-specific-considerations)

---

## 1. Entity Relationship Diagram

```
shops ──────────────────────────────────────────────────────────────────┐
  │ 1                                                                    │
  │ ∞                                                                    │
  ├──── users (via user_shop_roles) ──── refresh_tokens                 │
  │                                                                      │
  ├──── items ─────── item_images                                        │
  │       │                                                              │
  │       ├──────── spin_sets ──── spin_frames                          │
  │       └──────── inventory_transactions                              │
  │                                                                      │
  ├──── categories                                                       │
  │                                                                      │
  ├──── pre_orders ──── members (member_id FK)                          │
  │                         │                                            │
  ├──── members ────────────┘                                            │
  │       │                                                              │
  │       ├──── member_points_ledger                                    │
  │       └──── membership_tiers (tier_id FK)                          │
  │                                                                      │
  ├──── membership_tiers                                                 │
  │                                                                      │
  ├──── shop_audit_logs                                                  │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘

ai_item_drafts (standalone — không FK tới items)
facebook_posts ──── items (item_id FK)
vector_sync_tasks ──── items (item_id PK = FK)
```

---

## 2. Table Definitions

### 2.1 `shops`

```sql
CREATE TABLE shops (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(100) NOT NULL UNIQUE,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  contact_json     JSONB,
  appearance_json  JSONB,
  loyalty_json     JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_shops_is_active ON shops(is_active);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| name | VARCHAR(255) | No | — | Tên shop hiển thị |
| slug | VARCHAR(100) | No | — | URL slug duy nhất (chữ thường, gạch ngang) |
| is_active | BOOLEAN | No | true | Shop có hoạt động không |
| contact_json | JSONB | Yes | null | Phone, email, address, social links |
| appearance_json | JSONB | Yes | null | Logo, banner, theme colors, fonts |
| loyalty_json | JSONB | Yes | null | earn_rate, tier_thresholds config |
| created_at | TIMESTAMPTZ | No | NOW() | Thời điểm tạo |
| updated_at | TIMESTAMPTZ | No | NOW() | Thời điểm cập nhật cuối |

---

### 2.2 `users`

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255),
  role            user_role_enum NOT NULL DEFAULT 'shop_staff',
  platform_role   platform_role_enum,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
```

---

### 2.3 `user_shop_roles`

```sql
CREATE TABLE user_shop_roles (
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id  UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role     user_role_enum NOT NULL,
  PRIMARY KEY (user_id, shop_id)
);

CREATE INDEX idx_user_shop_roles_shop ON user_shop_roles(shop_id);
```

---

### 2.4 `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

### 2.5 `shop_audit_logs`

```sql
CREATE TABLE shop_audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  actor_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  action         audit_action_enum NOT NULL,
  target_type    VARCHAR(100) NOT NULL,
  target_id      VARCHAR(100),
  metadata_json  JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_shop ON shop_audit_logs(shop_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON shop_audit_logs(actor_user_id);
```

---

### 2.6 `items`

```sql
CREATE TABLE items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          UUID REFERENCES shops(id) ON DELETE CASCADE, -- nullable backward compat
  name             VARCHAR(500) NOT NULL,
  description      TEXT,
  scale            VARCHAR(20) NOT NULL DEFAULT '1:64',
  brand            VARCHAR(255),
  car_brand        VARCHAR(255),
  model_brand      VARCHAR(255),
  condition        item_condition_enum,
  price            INTEGER NOT NULL DEFAULT 0,       -- VND, không decimal
  original_price   INTEGER,
  status           item_status_enum NOT NULL DEFAULT 'con_hang',
  quantity         INTEGER NOT NULL DEFAULT 0,
  attributes       JSONB,
  is_public        BOOLEAN NOT NULL DEFAULT false,
  notes            TEXT,
  fb_post_content  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ                        -- soft delete
);

CREATE INDEX idx_items_shop ON items(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_status ON items(shop_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_public ON items(shop_id, is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_name_trgm ON items USING gin(name gin_trgm_ops); -- trigram search
CREATE INDEX idx_items_deleted ON items(deleted_at);
```

---

### 2.7 `item_images`

```sql
CREATE TABLE item_images (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  file_path        VARCHAR(500) NOT NULL,
  thumbnail_path   VARCHAR(500) NOT NULL,
  is_cover         BOOLEAN NOT NULL DEFAULT false,
  display_order    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_item_images_item ON item_images(item_id, display_order);
CREATE INDEX idx_item_images_cover ON item_images(item_id) WHERE is_cover = true;
```

---

### 2.8 `spin_sets`

```sql
CREATE TABLE spin_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  label       VARCHAR(255) NOT NULL DEFAULT '360°',
  is_default  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spin_sets_item ON spin_sets(item_id);
-- Chỉ 1 is_default=true per item (enforced in application layer)
```

---

### 2.9 `spin_frames`

```sql
CREATE TABLE spin_frames (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spin_set_id     UUID NOT NULL REFERENCES spin_sets(id) ON DELETE CASCADE,
  frame_index     INTEGER NOT NULL,
  file_path       VARCHAR(500) NOT NULL,
  thumbnail_path  VARCHAR(500) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_spin_frame UNIQUE (spin_set_id, frame_index)
);

CREATE INDEX idx_spin_frames_set ON spin_frames(spin_set_id, frame_index);
```

---

### 2.10 `categories`

```sql
CREATE TABLE categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID REFERENCES shops(id) ON DELETE CASCADE, -- null = global
  name           VARCHAR(255) NOT NULL,
  type           category_type_enum NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_shop ON categories(shop_id, type, is_active);
```

---

### 2.11 `inventory_transactions`

```sql
CREATE TABLE inventory_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  item_id             UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  actor_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  reversal_of_id      UUID REFERENCES inventory_transactions(id),
  type                inventory_tx_type_enum NOT NULL,
  quantity            INTEGER NOT NULL,    -- absolute quantity
  delta               INTEGER NOT NULL,    -- change (positive/negative)
  resulting_quantity  INTEGER NOT NULL,    -- item quantity after transaction
  reason              VARCHAR(500),
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_tx_shop ON inventory_transactions(shop_id, created_at DESC);
CREATE INDEX idx_inv_tx_item ON inventory_transactions(item_id);
CREATE INDEX idx_inv_tx_actor ON inventory_transactions(actor_user_id);
```

---

### 2.12 `pre_orders`

```sql
CREATE TABLE pre_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  item_id               UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL, -- actor (staff)
  member_id             UUID REFERENCES members(id) ON DELETE RESTRICT, -- customer
  status                pre_order_status_enum NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  quantity              INTEGER NOT NULL DEFAULT 1,
  unit_price            INTEGER NOT NULL,      -- VND at time of order
  total_amount          INTEGER NOT NULL,      -- unit_price × quantity
  deposit_amount        INTEGER NOT NULL DEFAULT 0,
  paid_amount           INTEGER NOT NULL DEFAULT 0,
  expected_arrival_at   DATE,
  expected_delivery_at  DATE,
  cover_image_url       VARCHAR(500),
  note                  TEXT,
  cancelled_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,           -- khi status = PAID
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_preorders_shop ON pre_orders(shop_id, status, created_at DESC);
CREATE INDEX idx_preorders_member ON pre_orders(member_id);
CREATE INDEX idx_preorders_item ON pre_orders(item_id);
```

---

### 2.13 `membership_tiers`

```sql
CREATE TABLE membership_tiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  rank        INTEGER NOT NULL,        -- 1=lowest, higher=better
  min_points  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tier_name UNIQUE (shop_id, name),
  CONSTRAINT uq_tier_rank UNIQUE (shop_id, rank)
);
```

---

### 2.14 `members`

```sql
CREATE TABLE members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(20),
  points_balance  INTEGER NOT NULL DEFAULT 0,
  tier_id         UUID REFERENCES membership_tiers(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_shop ON members(shop_id);
CREATE INDEX idx_members_phone ON members(shop_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_members_email ON members(shop_id, email) WHERE email IS NOT NULL;
```

---

### 2.15 `member_points_ledger`

```sql
CREATE TABLE member_points_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  type            points_type_enum NOT NULL,   -- earn/redeem/adjust
  points          INTEGER NOT NULL,            -- absolute value
  delta           INTEGER NOT NULL,            -- positive or negative
  balance_after   INTEGER NOT NULL,            -- balance sau entry này
  reason          VARCHAR(500),
  note            TEXT,
  reference_type  VARCHAR(100),               -- 'pre_order', 'manual', etc.
  reference_id    VARCHAR(100),               -- ID của object reference
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_member ON member_points_ledger(member_id, created_at DESC);
CREATE INDEX idx_ledger_shop ON member_points_ledger(shop_id);
```

---

### 2.16 `ai_item_drafts`

```sql
CREATE TABLE ai_item_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  images_json     JSONB NOT NULL,      -- array of image URLs/paths
  extracted_text  TEXT,
  ai_json         JSONB,               -- parsed AI response
  confidence_json JSONB,               -- per-field confidence scores
  status          ai_draft_status_enum NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.17 `facebook_posts`

```sql
CREATE TABLE facebook_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  post_url   VARCHAR(500),
  content    TEXT,
  posted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fb_posts_item ON facebook_posts(item_id);
```

---

### 2.18 `vector_sync_tasks`

```sql
CREATE TABLE vector_sync_tasks (
  item_id        UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  attempt_count  INTEGER NOT NULL DEFAULT 0,
  last_error     TEXT,
  scheduled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Enum Definitions

```sql
-- User roles trong shop
CREATE TYPE user_role_enum AS ENUM ('shop_admin', 'shop_staff');

-- Platform-wide roles
CREATE TYPE platform_role_enum AS ENUM ('platform_super');

-- Item status
CREATE TYPE item_status_enum AS ENUM ('con_hang', 'giu_cho', 'da_ban');

-- Item condition
CREATE TYPE item_condition_enum AS ENUM ('new', 'like_new', 'used');

-- Pre-order status
CREATE TYPE pre_order_status_enum AS ENUM (
  'PENDING_CONFIRMATION',
  'WAITING_FOR_GOODS',
  'ARRIVED',
  'PAID',
  'CANCELLED',
  'REFUNDED'
);

-- Inventory transaction type
CREATE TYPE inventory_tx_type_enum AS ENUM (
  'stock_in',
  'stock_out',
  'adjustment',
  'reversal',
  'pre_order_reserve'
);

-- Member points ledger type
CREATE TYPE points_type_enum AS ENUM ('earn', 'redeem', 'adjust');

-- Category type
CREATE TYPE category_type_enum AS ENUM ('car_brand', 'model_brand');

-- Audit action
CREATE TYPE audit_action_enum AS ENUM (
  'SHOP_CREATED',
  'SHOP_UPDATED',
  'SHOP_DEACTIVATED',
  'USER_ADDED',
  'USER_REMOVED',
  'USER_ROLE_CHANGED',
  'SETTINGS_UPDATED'
);

-- AI draft status
CREATE TYPE ai_draft_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
```

---

## 4. Relationships & Cardinality

| Relationship | Type | Notes |
|-------------|------|-------|
| shops → users | M:N via user_shop_roles | Một user có thể thuộc nhiều shop |
| shops → items | 1:N | shop_id nullable (backward compat) |
| items → item_images | 1:N | CASCADE DELETE |
| items → spin_sets | 1:N | Thường chỉ 1 per item |
| spin_sets → spin_frames | 1:N | Unique (set, frame_index) |
| shops → categories | 1:N | shop_id nullable = global |
| shops → pre_orders | 1:N | |
| items → pre_orders | 1:N | ON DELETE RESTRICT |
| members → pre_orders | 1:N | ON DELETE RESTRICT |
| shops → members | 1:N | |
| shops → membership_tiers | 1:N | |
| members → membership_tiers | N:1 | tier_id FK |
| members → member_points_ledger | 1:N | Immutable ledger |
| items → inventory_transactions | 1:N | ON DELETE RESTRICT |
| items → facebook_posts | 1:N | CASCADE DELETE |
| items → vector_sync_tasks | 1:1 | item_id là PK |
| inventory_transactions (self) | 1:N | reversal_of_id |

---

## 5. Data Dictionary

### Key Fields

| Table | Column | Mô tả chi tiết |
|-------|--------|---------------|
| shops | loyalty_json | `{"earn_rate": 1, "tiers": [...]}` — cấu hình loyalty program |
| shops | appearance_json | `{"logo_url":"...", "banner_url":"...", "primary_color":"#hex"}` |
| shops | contact_json | `{"phone":"...", "email":"...", "address":"...", "facebook_url":"..."}` |
| items | scale | Tỷ lệ mô hình (default "1:64"). Free text để linh hoạt |
| items | attributes | JSONB tự do cho extra fields (serial_number, year, color, ...) |
| items | price | Giá tính bằng VND (integer). Không dùng decimal để tránh floating point |
| items | status | `con_hang`=còn hàng, `giu_cho`=giữ chỗ, `da_ban`=đã bán |
| items | fb_post_content | Nội dung post Facebook đã tạo (lưu lại, không post tự động) |
| items | deleted_at | Soft delete timestamp. NULL = active. Query luôn filter IS NULL |
| pre_orders | unit_price | Giá tại thời điểm đặt hàng — không thay đổi khi item price thay đổi |
| pre_orders | deposit_amount | Số tiền cọc đã nhận |
| pre_orders | paid_amount | Tổng số tiền đã thanh toán (có thể > deposit khi trả thêm) |
| member_points_ledger | delta | Thay đổi điểm — dương (earn/adjust+) hoặc âm (redeem/adjust-) |
| member_points_ledger | balance_after | Số dư điểm SAU entry này. Dùng để audit trail không cần tính lại |
| member_points_ledger | reference_type | Nguồn gốc: 'pre_order', 'manual', 'tier_upgrade' |
| refresh_tokens | token_hash | SHA-256 hash của raw token. Raw token chỉ gửi qua cookie, không lưu |
| inventory_transactions | resulting_quantity | Số lượng item sau giao dịch — snapshot lịch sử |
| inventory_transactions | reversal_of_id | ID giao dịch bị đảo ngược. Chỉ có giá trị khi type='reversal' |
| spin_frames | frame_index | 0-based index, liên tục không gap. Reorder = cập nhật toàn bộ indexes |

---

## 6. Migration Strategy & Principles

### 6.1 Nguyên tắc Bất biến

**TUYỆT ĐỐI KHÔNG SỬA ĐỔI** migration đã được apply vào bất kỳ môi trường nào.

```bash
# Đúng: Tạo migration mới
npx prisma migrate dev --name add_item_weight_field

# Sai: Sửa file migration đã tồn tại
# → Gây ra: drift giữa DB state và migration history
# → Hậu quả: migrate bị fail trên production
```

### 6.2 Migration Workflow

```bash
# 1. Thay đổi schema.prisma
# 2. Tạo migration (dev environment)
npx prisma migrate dev --name <descriptive_name>

# 3. Review file SQL trong prisma/migrations/
# 4. Commit schema.prisma + migration file
# 5. Apply trên production
npx prisma migrate deploy  # (dùng DIRECT_URL, không pooler)
```

### 6.3 Migration Naming Convention

```
YYYYMMDDHHMMSS_<action>_<subject>

Ví dụ:
20260101120000_add_items_weight
20260115093000_add_index_members_phone
20260201000000_create_vector_sync_tasks
```

### 6.4 Safe Migration Patterns

```sql
-- Thêm column: SAFE (nullable hoặc có default)
ALTER TABLE items ADD COLUMN weight INTEGER;

-- Thêm column NOT NULL: CẦN THẬN
-- Bước 1: Thêm với default
ALTER TABLE items ADD COLUMN weight INTEGER NOT NULL DEFAULT 0;
-- Bước 2: (sau khi backfill) Xóa default nếu cần
ALTER TABLE items ALTER COLUMN weight DROP DEFAULT;

-- Thêm index: CẦN CONCURRENT để tránh lock
CREATE INDEX CONCURRENTLY idx_items_weight ON items(weight);

-- Đổi tên column: KHÔNG SAFE khi có code đang chạy
-- → Phải deprecate old + add new trong cùng migration,
--   update code, rồi migration tiếp theo xóa old
```

---

## 7. Indexing Strategy

### 7.1 Primary Indexes

Tất cả tables dùng UUID PRIMARY KEY — PostgreSQL tự tạo B-tree index.

### 7.2 Foreign Key Indexes

```sql
-- Mọi FK column đều cần index để tránh sequential scan
CREATE INDEX idx_items_shop_id ON items(shop_id);
CREATE INDEX idx_item_images_item_id ON item_images(item_id);
CREATE INDEX idx_spin_frames_set_id ON spin_frames(spin_set_id);
CREATE INDEX idx_preorders_member_id ON pre_orders(member_id);
-- ... (xem Table Definitions ở trên)
```

### 7.3 Query-Optimized Indexes

```sql
-- Partial indexes để loại trừ soft-deleted records
CREATE INDEX idx_items_active ON items(shop_id, status)
  WHERE deleted_at IS NULL;

-- Composite index cho common filter pattern
CREATE INDEX idx_items_public_catalog ON items(shop_id, is_public, status)
  WHERE deleted_at IS NULL;

-- Trigram index cho ILIKE search trên name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_items_name_trgm ON items USING gin(name gin_trgm_ops);

-- Descending index cho pagination (latest first)
CREATE INDEX idx_preorders_shop_created ON pre_orders(shop_id, created_at DESC);
CREATE INDEX idx_ledger_member_created ON member_points_ledger(member_id, created_at DESC);
```

### 7.4 Unique Constraints (double as indexes)

```sql
UNIQUE (shops.slug)
UNIQUE (users.email)
UNIQUE (refresh_tokens.token_hash)
UNIQUE (spin_frames.spin_set_id, spin_frames.frame_index)
UNIQUE (membership_tiers.shop_id, membership_tiers.name)
UNIQUE (membership_tiers.shop_id, membership_tiers.rank)
```

---

## 8. Data Retention Policies

### 8.1 Soft Delete

Items sử dụng soft delete:
- `deleted_at IS NULL` — active record
- `deleted_at IS NOT NULL` — đã xóa
- Mọi query phải có `WHERE deleted_at IS NULL`
- Prisma middleware tự động inject filter này

```typescript
// Prisma middleware để tự động filter soft delete
prisma.$use(async (params, next) => {
  if (params.model === 'Item') {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        deleted_at: null,
      };
    }
  }
  return next(params);
});
```

### 8.2 Audit Logs Retention

- `shop_audit_logs`: Giữ vĩnh viễn (compliance)
- `refresh_tokens`: Cleanup revoked tokens sau 30 ngày (cron job)
- `member_points_ledger`: Immutable — không xóa bao giờ

### 8.3 Cleanup Jobs

```sql
-- Cleanup revoked refresh tokens (chạy hàng tuần)
DELETE FROM refresh_tokens
WHERE revoked_at IS NOT NULL
  AND revoked_at < NOW() - INTERVAL '30 days';

-- Cleanup expired (chưa revoke nhưng đã hết hạn)
DELETE FROM refresh_tokens
WHERE revoked_at IS NULL
  AND expires_at < NOW() - INTERVAL '7 days';
```

---

## 9. PostgreSQL-Specific Considerations

### 9.1 UUID Generation

```sql
-- Dùng gen_random_uuid() (built-in từ PostgreSQL 13+)
-- Không cần extension uuid-ossp
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### 9.2 JSONB vs JSON

Dùng **JSONB** (không phải JSON) cho tất cả JSON columns:
- JSONB được index-able (GIN index)
- JSONB stored efficiently (binary format)
- JSONB operators: `@>`, `?`, `?&`, `?|`

```sql
-- Query JSONB
SELECT * FROM shops WHERE contact_json @> '{"phone": "0123456789"}';
SELECT * FROM items WHERE attributes ? 'serial_number';
```

### 9.3 ENUM Types

PostgreSQL native ENUM:
- Lưu efficient (4 bytes)
- Constraint ở DB level
- Thêm value mới: `ALTER TYPE enum_name ADD VALUE 'new_value';` (safe, không cần migration phức tạp)
- **KHÔNG THỂ** xóa value khỏi enum — phải tạo type mới và migrate

### 9.4 Timezone Handling

Tất cả timestamp columns dùng `TIMESTAMPTZ` (with timezone):
- Lưu UTC trong DB
- Application nhận và trả về ISO 8601 với timezone offset
- Frontend format theo timezone local của user

### 9.5 Connection Pooling với Neon

```
Neon PgBouncer (DATABASE_URL):
  - Mode: Transaction pooling (thích hợp nhất cho serverless/web)
  - Không dùng cho Prepared Statements dài hạn
  - Không dùng cho SET LOCAL / session-level settings

Direct connection (DIRECT_URL):
  - Chỉ cho Prisma migrate deploy
  - Chỉ cho reports/analytics queries nặng (nếu cần)
```

### 9.6 Partitioning Roadmap

Khi dữ liệu lớn (>10M rows), cân nhắc range partitioning:

```sql
-- Ví dụ partition member_points_ledger theo năm
CREATE TABLE member_points_ledger (...)
  PARTITION BY RANGE (created_at);

CREATE TABLE member_points_ledger_2025
  PARTITION OF member_points_ledger
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

Hiện tại chưa cần — để khi thật sự cần thiết.

-- Migration: add_multi_tenant_shop
-- Created: 2026-03-23
-- Strategy: 3-step safe migration
--   Step 1: Create shops + user_shop_roles tables
--   Step 2: Add shop_id (nullable) to items
--   Step 3: Seed a default shop, assign all existing items to it,
--            then add shop_admin role for existing user to default shop.
-- 
-- DO NOT run Step 4 (NOT NULL constraint) until confirmed all items have shop_id set.
-- That will be a follow-up migration after data verification.

-- Step 1a: Create enum types
CREATE TYPE "ShopRole" AS ENUM ('super_admin', 'shop_admin');

-- Step 1b: Create shops table
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");
CREATE INDEX "shops_is_active_idx" ON "shops"("is_active");

-- Step 1c: Create user_shop_roles table
CREATE TABLE "user_shop_roles" (
    "user_id"  TEXT NOT NULL,
    "shop_id"  TEXT NOT NULL,
    "role" "ShopRole" NOT NULL DEFAULT 'shop_admin',

    CONSTRAINT "user_shop_roles_pkey" PRIMARY KEY ("user_id","shop_id")
);

CREATE INDEX "user_shop_roles_user_id_idx" ON "user_shop_roles"("user_id");

ALTER TABLE "user_shop_roles" ADD CONSTRAINT "user_shop_roles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_shop_roles" ADD CONSTRAINT "user_shop_roles_shop_id_fkey"
    FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: Add shop_id (nullable) to items
ALTER TABLE "items" ADD COLUMN "shop_id" TEXT;
CREATE INDEX "items_shop_id_idx" ON "items"("shop_id");

ALTER TABLE "items" ADD CONSTRAINT "items_shop_id_fkey"
    FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON UPDATE CASCADE;

-- Step 3: Seed default shop and assign all existing items
-- Insert a default shop for migrating existing data
INSERT INTO "shops" ("id", "name", "slug", "is_active", "created_at", "updated_at")
VALUES (
    gen_random_uuid()::text,
    'Default Shop',
    'default-shop',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign all existing items (with null shop_id) to the default shop
UPDATE "items"
SET "shop_id" = (SELECT "id" FROM "shops" WHERE "slug" = 'default-shop')
WHERE "shop_id" IS NULL;

-- Assign existing users to the default shop as super_admin
INSERT INTO "user_shop_roles" ("user_id", "shop_id", "role")
SELECT u.id, s.id, 'super_admin'::"ShopRole"
FROM "users" u
CROSS JOIN "shops" s
WHERE s.slug = 'default-shop'
  AND u.is_active = true
ON CONFLICT ("user_id", "shop_id") DO NOTHING;

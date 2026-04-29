-- Migration: rbac_platform_and_shop_roles
-- Adds PlatformRole enum + User.platform_role, extends ShopRole with shop_staff,
-- extends ShopAuditAction with role-change events, and backfills platform_role.

-- 1. Create PlatformRole enum
CREATE TYPE "PlatformRole" AS ENUM ('platform_super');

-- 2. Add User.platform_role column (nullable, no default = NULL)
ALTER TABLE "users" ADD COLUMN "platform_role" "PlatformRole";

-- 3. Backfill: any user with at least one super_admin shop row → platform_super
UPDATE "users"
SET "platform_role" = 'platform_super'
WHERE "id" IN (
  SELECT DISTINCT "user_id"
  FROM "user_shop_roles"
  WHERE "role" = 'super_admin'
);

-- 4. Extend ShopRole enum with shop_staff (additive — existing rows unaffected)
ALTER TYPE "ShopRole" ADD VALUE IF NOT EXISTS 'shop_staff';

-- 5. Extend ShopAuditAction enum with role-change events
ALTER TYPE "ShopAuditAction" ADD VALUE IF NOT EXISTS 'set_platform_role';
ALTER TYPE "ShopAuditAction" ADD VALUE IF NOT EXISTS 'set_shop_member_role';

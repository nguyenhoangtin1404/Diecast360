-- Migration: add_item_quantity_and_attributes
-- Created: 2026-04-01
-- Strategy: additive columns + deterministic backfill + database guard
--   Step 1: Add nullable quantity + attributes columns
--   Step 2: Backfill existing rows from current item status
--   Step 3: Enforce defaults, NOT NULL, and non-negative quantity constraint
--
-- Rollback notes:
--   ALTER TABLE "items" DROP CONSTRAINT IF EXISTS "items_quantity_non_negative_check";
--   ALTER TABLE "items" DROP COLUMN IF EXISTS "attributes";
--   ALTER TABLE "items" DROP COLUMN IF EXISTS "quantity";

ALTER TABLE "items"
  ADD COLUMN "quantity" INTEGER,
  ADD COLUMN "attributes" JSONB;

UPDATE "items"
SET "quantity" = CASE
  WHEN "status" = 'da_ban'::"ItemStatus" THEN 0
  ELSE 1
END
WHERE "quantity" IS NULL;

UPDATE "items"
SET "attributes" = '{}'::jsonb
WHERE "attributes" IS NULL;

ALTER TABLE "items"
  ALTER COLUMN "quantity" SET DEFAULT 1,
  ALTER COLUMN "quantity" SET NOT NULL,
  ALTER COLUMN "attributes" SET DEFAULT '{}'::jsonb,
  ALTER COLUMN "attributes" SET NOT NULL;

ALTER TABLE "items"
  ADD CONSTRAINT "items_quantity_non_negative_check" CHECK ("quantity" >= 0);

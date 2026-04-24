-- Migration: add_membership_and_points
-- Created: 2026-04-23
-- Strategy: tier/member schema + immutable points ledger

CREATE TYPE "MemberPointsMutationType" AS ENUM ('earn', 'redeem', 'adjust');

CREATE TABLE "membership_tiers" (
  "id" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "min_points" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "membership_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "members" (
  "id" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "points_balance" INTEGER NOT NULL DEFAULT 0,
  "tier_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "member_points_ledger" (
  "id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "type" "MemberPointsMutationType" NOT NULL,
  "points" INTEGER NOT NULL,
  "delta" INTEGER NOT NULL,
  "balance_after" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_points_ledger_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "membership_tiers"
  ADD CONSTRAINT "membership_tiers_shop_id_fkey"
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "members"
  ADD CONSTRAINT "members_shop_id_fkey"
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "members"
  ADD CONSTRAINT "members_tier_id_fkey"
  FOREIGN KEY ("tier_id") REFERENCES "membership_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "member_points_ledger"
  ADD CONSTRAINT "member_points_ledger_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_points_ledger"
  ADD CONSTRAINT "member_points_ledger_shop_id_fkey"
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_points_ledger"
  ADD CONSTRAINT "member_points_ledger_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "membership_tiers_shop_id_rank_idx"
  ON "membership_tiers"("shop_id", "rank");
CREATE UNIQUE INDEX "membership_tiers_shop_id_name_key"
  ON "membership_tiers"("shop_id", "name");
CREATE UNIQUE INDEX "membership_tiers_shop_id_rank_key"
  ON "membership_tiers"("shop_id", "rank");

CREATE INDEX "members_shop_id_created_at_idx"
  ON "members"("shop_id", "created_at");
CREATE INDEX "members_shop_id_points_balance_idx"
  ON "members"("shop_id", "points_balance");
CREATE INDEX "members_shop_id_full_name_idx"
  ON "members"("shop_id", "full_name");
CREATE UNIQUE INDEX "members_shop_id_email_key"
  ON "members"("shop_id", "email");
CREATE UNIQUE INDEX "members_shop_id_phone_key"
  ON "members"("shop_id", "phone");

CREATE INDEX "member_points_ledger_member_id_created_at_idx"
  ON "member_points_ledger"("member_id", "created_at");
CREATE INDEX "member_points_ledger_shop_id_created_at_idx"
  ON "member_points_ledger"("shop_id", "created_at");
CREATE INDEX "member_points_ledger_shop_id_type_created_at_idx"
  ON "member_points_ledger"("shop_id", "type", "created_at");

ALTER TABLE "membership_tiers"
  ADD CONSTRAINT "membership_tiers_min_points_non_negative"
  CHECK ("min_points" >= 0);

ALTER TABLE "members"
  ADD CONSTRAINT "members_points_balance_non_negative"
  CHECK ("points_balance" >= 0);

ALTER TABLE "member_points_ledger"
  ADD CONSTRAINT "member_points_ledger_points_positive"
  CHECK ("points" > 0);

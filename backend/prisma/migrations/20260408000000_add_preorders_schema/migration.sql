-- Migration: add_preorders_schema
-- Created: 2026-04-08
-- Purpose: add pre-order persistence model and lifecycle fields

CREATE TYPE "PreOrderStatus" AS ENUM (
    'cho_xac_nhan',
    'dang_cho_hang',
    'da_ve',
    'da_thanh_toan',
    'da_huy'
);

CREATE TABLE "pre_orders" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" "PreOrderStatus" NOT NULL DEFAULT 'cho_xac_nhan',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2),
    "total_amount" DECIMAL(12,2),
    "deposit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expected_arrival_at" TIMESTAMP(3),
    "expected_delivery_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "pre_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pre_orders_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "pre_orders_unit_price_check" CHECK ("unit_price" IS NULL OR "unit_price" >= 0),
    CONSTRAINT "pre_orders_total_amount_check" CHECK ("total_amount" IS NULL OR "total_amount" >= 0),
    CONSTRAINT "pre_orders_deposit_amount_check" CHECK ("deposit_amount" >= 0),
    CONSTRAINT "pre_orders_paid_amount_check" CHECK ("paid_amount" >= 0)
);

CREATE INDEX "pre_orders_shop_id_status_idx" ON "pre_orders"("shop_id", "status");
CREATE INDEX "pre_orders_item_id_idx" ON "pre_orders"("item_id");
CREATE INDEX "pre_orders_user_id_idx" ON "pre_orders"("user_id");
CREATE INDEX "pre_orders_expected_arrival_at_idx" ON "pre_orders"("expected_arrival_at");

ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_shop_id_fkey"
    FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_item_id_fkey"
    FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

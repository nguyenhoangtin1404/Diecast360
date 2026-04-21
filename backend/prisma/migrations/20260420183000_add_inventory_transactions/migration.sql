-- Migration: add_inventory_transactions
-- Created: 2026-04-20
-- Strategy: enum + transaction ledger table with audit metadata

CREATE TYPE "InventoryTransactionType" AS ENUM ('stock_in', 'stock_out', 'adjustment');

CREATE TABLE "inventory_transactions" (
  "id" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "reversal_of_id" TEXT,
  "type" "InventoryTransactionType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "delta" INTEGER NOT NULL,
  "resulting_quantity" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_transactions_shop_id_created_at_idx"
  ON "inventory_transactions"("shop_id", "created_at");
CREATE INDEX "inventory_transactions_item_id_created_at_idx"
  ON "inventory_transactions"("item_id", "created_at");
CREATE INDEX "inventory_transactions_item_id_type_created_at_idx"
  ON "inventory_transactions"("item_id", "type", "created_at");
CREATE UNIQUE INDEX "inventory_transactions_reversal_of_id_key"
  ON "inventory_transactions"("reversal_of_id");

ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT "inventory_transactions_shop_id_fkey"
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT "inventory_transactions_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT "inventory_transactions_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT "inventory_transactions_reversal_of_id_fkey"
  FOREIGN KEY ("reversal_of_id") REFERENCES "inventory_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Pre-order member binding, shop loyalty JSON, ledger idempotency refs, REFUNDED status

ALTER TYPE "PreOrderStatus" ADD VALUE 'da_hoan_tien';

ALTER TABLE "shops" ADD COLUMN "loyalty_json" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "pre_orders" ADD COLUMN "member_id" TEXT;

ALTER TABLE "member_points_ledger" ADD COLUMN "reference_type" TEXT,
ADD COLUMN "reference_id" TEXT;

ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "pre_orders_member_id_idx" ON "pre_orders"("member_id");

CREATE UNIQUE INDEX "member_points_ledger_shop_reference_unique" ON "member_points_ledger" ("shop_id", "reference_type", "reference_id")
WHERE ("reference_type" IS NOT NULL AND "reference_id" IS NOT NULL);

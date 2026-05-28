-- AlterTable
ALTER TABLE "items" ADD COLUMN "preorder_opens_at" TIMESTAMP(3);

-- Backfill: existing preorder items use product creation time as window start
UPDATE "items"
SET "preorder_opens_at" = "created_at"
WHERE "status" = 'preorder' AND "preorder_opens_at" IS NULL;

-- CreateIndex
CREATE INDEX "items_status_preorder_opens_at_idx" ON "items"("status", "preorder_opens_at");

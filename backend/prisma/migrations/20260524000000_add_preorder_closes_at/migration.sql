-- AddColumn: preorder closing date on items
ALTER TABLE "items" ADD COLUMN "preorder_closes_at" TIMESTAMP(3);

-- Index for the preorder_open filter (status + closes_at)
CREATE INDEX "items_status_preorder_closes_at_idx" ON "items"("status", "preorder_closes_at");

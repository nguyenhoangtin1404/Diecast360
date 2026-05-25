-- AddColumn: preorder-specific price on items
ALTER TABLE "items" ADD COLUMN "preorder_price" DECIMAL(18,0);

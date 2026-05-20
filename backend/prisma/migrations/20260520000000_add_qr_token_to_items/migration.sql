-- AlterTable
ALTER TABLE "items" ADD COLUMN "qr_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "items_qr_token_key" ON "items"("qr_token");

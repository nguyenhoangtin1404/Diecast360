-- AlterTable
ALTER TABLE "items" ADD COLUMN     "car_brand" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "model_brand" TEXT,
ADD COLUMN     "price" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "items_car_brand_idx" ON "items"("car_brand");

-- CreateIndex
CREATE INDEX "items_model_brand_idx" ON "items"("model_brand");

-- CreateIndex
CREATE INDEX "items_condition_idx" ON "items"("condition");

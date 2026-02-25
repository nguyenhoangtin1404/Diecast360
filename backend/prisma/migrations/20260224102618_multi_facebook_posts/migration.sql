/*
  Warnings:

  - You are about to drop the column `fb_post_url` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `fb_posted_at` on the `items` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "facebook_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "post_url" TEXT NOT NULL,
    "content" TEXT,
    "posted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "facebook_posts_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing data BEFORE dropping columns
INSERT INTO "facebook_posts" ("id", "item_id", "post_url", "posted_at", "created_at")
SELECT hex(randomblob(16)), "id", "fb_post_url", COALESCE("fb_posted_at", CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
FROM "items"
WHERE "fb_post_url" IS NOT NULL AND "fb_post_url" != '';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scale" TEXT NOT NULL DEFAULT '1:64',
    "brand" TEXT,
    "car_brand" TEXT,
    "model_brand" TEXT,
    "condition" TEXT,
    "price" DECIMAL,
    "original_price" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'con_hang',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "notes" TEXT,
    "fb_post_content" TEXT
);
INSERT INTO "new_items" ("brand", "car_brand", "condition", "created_at", "deleted_at", "description", "fb_post_content", "id", "is_public", "model_brand", "name", "notes", "original_price", "price", "scale", "status", "updated_at") SELECT "brand", "car_brand", "condition", "created_at", "deleted_at", "description", "fb_post_content", "id", "is_public", "model_brand", "name", "notes", "original_price", "price", "scale", "status", "updated_at" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE INDEX "items_status_idx" ON "items"("status");
CREATE INDEX "items_created_at_idx" ON "items"("created_at");
CREATE INDEX "items_deleted_at_idx" ON "items"("deleted_at");
CREATE INDEX "items_car_brand_idx" ON "items"("car_brand");
CREATE INDEX "items_model_brand_idx" ON "items"("model_brand");
CREATE INDEX "items_condition_idx" ON "items"("condition");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "facebook_posts_item_id_idx" ON "facebook_posts"("item_id");

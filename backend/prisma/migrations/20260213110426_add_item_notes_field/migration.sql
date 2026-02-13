-- AlterTable
ALTER TABLE "items" ADD COLUMN "fb_post_content" TEXT;
ALTER TABLE "items" ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "ai_item_drafts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "images_json" TEXT NOT NULL,
    "extracted_text" TEXT,
    "ai_json" TEXT NOT NULL,
    "confidence_json" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

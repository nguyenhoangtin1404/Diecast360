-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('con_hang', 'giu_cho', 'da_ban');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scale" TEXT NOT NULL DEFAULT '1:64',
    "brand" TEXT,
    "car_brand" TEXT,
    "model_brand" TEXT,
    "condition" TEXT,
    "price" DECIMAL(65,30),
    "original_price" DECIMAL(65,30),
    "status" "ItemStatus" NOT NULL DEFAULT 'con_hang',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "notes" TEXT,
    "fb_post_content" TEXT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facebook_posts" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "post_url" TEXT NOT NULL,
    "content" TEXT,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facebook_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_images" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_sets" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "label" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spin_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_frames" (
    "id" TEXT NOT NULL,
    "spin_set_id" TEXT NOT NULL,
    "frame_index" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spin_frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_item_drafts" (
    "id" TEXT NOT NULL,
    "images_json" TEXT NOT NULL,
    "extracted_text" TEXT,
    "ai_json" TEXT NOT NULL,
    "confidence_json" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_item_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");

-- CreateIndex
CREATE INDEX "items_created_at_idx" ON "items"("created_at");

-- CreateIndex
CREATE INDEX "items_deleted_at_idx" ON "items"("deleted_at");

-- CreateIndex
CREATE INDEX "items_car_brand_idx" ON "items"("car_brand");

-- CreateIndex
CREATE INDEX "items_model_brand_idx" ON "items"("model_brand");

-- CreateIndex
CREATE INDEX "items_condition_idx" ON "items"("condition");

-- CreateIndex
CREATE INDEX "facebook_posts_item_id_idx" ON "facebook_posts"("item_id");

-- CreateIndex
CREATE INDEX "item_images_item_id_display_order_idx" ON "item_images"("item_id", "display_order");

-- CreateIndex
CREATE INDEX "spin_sets_item_id_idx" ON "spin_sets"("item_id");

-- CreateIndex
CREATE INDEX "spin_sets_item_id_is_default_idx" ON "spin_sets"("item_id", "is_default");

-- CreateIndex
CREATE INDEX "spin_frames_spin_set_id_frame_index_idx" ON "spin_frames"("spin_set_id", "frame_index");

-- CreateIndex
CREATE UNIQUE INDEX "spin_frames_spin_set_id_frame_index_key" ON "spin_frames"("spin_set_id", "frame_index");

-- CreateIndex
CREATE INDEX "categories_type_is_active_idx" ON "categories"("type", "is_active");

-- CreateIndex
CREATE INDEX "categories_type_display_order_idx" ON "categories"("type", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "categories_type_name_key" ON "categories"("type", "name");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_posts" ADD CONSTRAINT "facebook_posts_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_sets" ADD CONSTRAINT "spin_sets_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_frames" ADD CONSTRAINT "spin_frames_spin_set_id_fkey" FOREIGN KEY ("spin_set_id") REFERENCES "spin_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;


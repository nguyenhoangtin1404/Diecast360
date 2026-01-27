-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items" (
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
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "item_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "item_images_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spin_sets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "label" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "spin_sets_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spin_frames" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spin_set_id" TEXT NOT NULL,
    "frame_index" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "spin_frames_spin_set_id_fkey" FOREIGN KEY ("spin_set_id") REFERENCES "spin_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE INDEX "item_images_item_id_display_order_idx" ON "item_images"("item_id", "display_order");

-- CreateIndex
CREATE INDEX "spin_sets_item_id_idx" ON "spin_sets"("item_id");

-- CreateIndex
CREATE INDEX "spin_sets_item_id_is_default_idx" ON "spin_sets"("item_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "spin_frames_spin_set_id_frame_index_key" ON "spin_frames"("spin_set_id", "frame_index");

-- CreateIndex
CREATE INDEX "spin_frames_spin_set_id_frame_index_idx" ON "spin_frames"("spin_set_id", "frame_index");

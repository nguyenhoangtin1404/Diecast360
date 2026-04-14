-- Optional cover URL for pre-order records (separate from free-text admin note).

ALTER TABLE "pre_orders" ADD COLUMN "cover_image_url" TEXT;

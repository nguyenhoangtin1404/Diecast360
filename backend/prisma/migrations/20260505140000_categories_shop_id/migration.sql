-- Shop-scoped categories: AI import and admin create per shop without polluting other tenants.

ALTER TABLE "categories" ADD COLUMN "shop_id" TEXT;

ALTER TABLE "categories" ADD CONSTRAINT "categories_shop_id_fkey"
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "categories_shop_id_type_idx" ON "categories"("shop_id", "type");

DROP INDEX IF EXISTS "categories_type_name_key";

CREATE UNIQUE INDEX "categories_global_type_name_key"
  ON "categories"("type", "name")
  WHERE "shop_id" IS NULL;

CREATE UNIQUE INDEX "categories_shop_type_name_key"
  ON "categories"("shop_id", "type", "name")
  WHERE "shop_id" IS NOT NULL;

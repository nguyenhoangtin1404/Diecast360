-- Shop-configurable public contact page content
ALTER TABLE "shops" ADD COLUMN "contact_json" JSONB NOT NULL DEFAULT '{}';

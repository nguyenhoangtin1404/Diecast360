-- Reserved for future storefront branding (logo, favicon, colors, fonts)
ALTER TABLE "shops" ADD COLUMN "appearance_json" JSONB NOT NULL DEFAULT '{}';

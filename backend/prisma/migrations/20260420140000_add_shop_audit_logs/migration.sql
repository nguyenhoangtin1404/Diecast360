-- Migration: add_shop_audit_logs
-- Purpose: persist shop audit trail (schema model existed without DB table)

CREATE TYPE "ShopAuditAction" AS ENUM (
    'add_shop_admin',
    'reset_member_password',
    'set_member_active',
    'update_shop',
    'deactivate_shop',
    'activate_shop'
);

CREATE TABLE "shop_audit_logs" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" "ShopAuditAction" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "metadata_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shop_audit_logs_shop_id_created_at_idx" ON "shop_audit_logs"("shop_id", "created_at");
CREATE INDEX "shop_audit_logs_action_created_at_idx" ON "shop_audit_logs"("action", "created_at");

ALTER TABLE "shop_audit_logs" ADD CONSTRAINT "shop_audit_logs_shop_id_fkey"
    FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shop_audit_logs" ADD CONSTRAINT "shop_audit_logs_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

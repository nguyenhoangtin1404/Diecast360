-- Security: account lockout fields + upgrade login_audit_logs status column to enum

DO $$ BEGIN
  CREATE TYPE "LoginAuditStatus" AS ENUM ('success', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "failed_login_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP(3);

-- Upgrade status column from TEXT to LoginAuditStatus enum (no-op if already correct type)
DO $$ BEGIN
  ALTER TABLE "login_audit_logs"
    ALTER COLUMN "status" TYPE "LoginAuditStatus" USING "status"::"LoginAuditStatus";
EXCEPTION WHEN others THEN null;
END $$;

-- Drop old indexes (different columns), add new ones
DROP INDEX IF EXISTS "login_audit_logs_user_id_trace_id_idx";
DROP INDEX IF EXISTS "login_audit_logs_status_trace_id_idx";
DROP INDEX IF EXISTS "login_audit_logs_created_at_idx";

-- email_created_at_idx already handled by migration 20260528093000
CREATE INDEX IF NOT EXISTS "login_audit_logs_user_id_created_at_idx" ON "login_audit_logs"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "login_audit_logs_status_created_at_idx" ON "login_audit_logs"("status", "created_at" DESC);

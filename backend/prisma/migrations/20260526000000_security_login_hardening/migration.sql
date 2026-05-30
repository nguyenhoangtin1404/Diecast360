-- Security: account lockout fields + upgrade login_audit_logs status column to enum

CREATE TYPE "LoginAuditStatus" AS ENUM ('success', 'failed');

ALTER TABLE "users"
  ADD COLUMN "failed_login_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until" TIMESTAMP(3);

-- Upgrade status column from TEXT to LoginAuditStatus enum
ALTER TABLE "login_audit_logs"
  ALTER COLUMN "status" TYPE "LoginAuditStatus" USING "status"::"LoginAuditStatus";

-- Drop old indexes (different columns), add new ones
DROP INDEX IF EXISTS "login_audit_logs_user_id_trace_id_idx";
DROP INDEX IF EXISTS "login_audit_logs_status_trace_id_idx";
DROP INDEX IF EXISTS "login_audit_logs_created_at_idx";

CREATE INDEX "login_audit_logs_email_created_at_idx" ON "login_audit_logs"("email", "created_at" DESC);
CREATE INDEX "login_audit_logs_user_id_created_at_idx" ON "login_audit_logs"("user_id", "created_at" DESC);
CREATE INDEX "login_audit_logs_status_created_at_idx" ON "login_audit_logs"("status", "created_at" DESC);

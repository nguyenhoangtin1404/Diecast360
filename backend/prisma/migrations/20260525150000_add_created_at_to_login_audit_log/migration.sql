-- Migration: add_created_at_to_login_audit_log
-- Purpose: add created_at column for time-range queries and log purging

ALTER TABLE "login_audit_logs" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "login_audit_logs_created_at_idx" ON "login_audit_logs"("created_at" DESC);

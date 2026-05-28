-- Migration: add_login_audit_email_created_at_index
-- Purpose: optimize admin audit viewer queries filtered by email and time.

CREATE INDEX "login_audit_logs_email_created_at_idx"
ON "login_audit_logs"("email", "created_at" DESC);

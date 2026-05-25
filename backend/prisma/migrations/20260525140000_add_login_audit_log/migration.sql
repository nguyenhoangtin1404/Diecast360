-- Migration: add_login_audit_log
-- Purpose: record every login attempt (success/failed) with UUIDv7 trace_id for tracing

CREATE TABLE "login_audit_logs" (
    "id"             TEXT NOT NULL,
    "trace_id"       TEXT NOT NULL,
    "user_id"        TEXT,
    "email"          TEXT NOT NULL,
    "shop_id"        TEXT,
    "ip_address"     TEXT,
    "user_agent"     TEXT,
    "status"         TEXT NOT NULL,
    "failure_reason" TEXT,

    CONSTRAINT "login_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "login_audit_logs_trace_id_key" ON "login_audit_logs"("trace_id");
CREATE INDEX "login_audit_logs_user_id_trace_id_idx" ON "login_audit_logs"("user_id", "trace_id" DESC);
CREATE INDEX "login_audit_logs_status_trace_id_idx" ON "login_audit_logs"("status", "trace_id" DESC);

ALTER TABLE "login_audit_logs" ADD CONSTRAINT "login_audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

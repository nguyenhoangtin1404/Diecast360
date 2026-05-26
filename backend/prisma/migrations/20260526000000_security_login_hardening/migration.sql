-- Security: account lockout fields + structured login audit log

CREATE TYPE "LoginAuditStatus" AS ENUM ('success', 'failed');

ALTER TABLE "users"
  ADD COLUMN "failed_login_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until" TIMESTAMP(3);

CREATE TABLE "login_audit_logs" (
    "id" TEXT NOT NULL,
    "trace_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "shop_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" "LoginAuditStatus" NOT NULL,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "login_audit_logs_trace_id_key" ON "login_audit_logs"("trace_id");
CREATE INDEX "login_audit_logs_email_created_at_idx" ON "login_audit_logs"("email", "created_at" DESC);
CREATE INDEX "login_audit_logs_user_id_created_at_idx" ON "login_audit_logs"("user_id", "created_at" DESC);
CREATE INDEX "login_audit_logs_status_created_at_idx" ON "login_audit_logs"("status", "created_at" DESC);

ALTER TABLE "login_audit_logs" ADD CONSTRAINT "login_audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

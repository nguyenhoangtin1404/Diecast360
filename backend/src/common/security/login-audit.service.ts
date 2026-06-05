import { Injectable, Logger } from '@nestjs/common';
import { LoginAuditStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginFailureReason } from './login-failure-reason';

export type { LoginFailureReason };

export interface LoginAuditEntry {
  traceId: string;
  email: string;
  userId?: string | null;
  shopId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: 'success' | 'failed';
  failureReason?: LoginFailureReason;
}

@Injectable()
export class LoginAuditService {
  private readonly logger = new Logger(LoginAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  record(entry: LoginAuditEntry): void {
    const payload = {
      event: 'auth.login_audit',
      trace_id: entry.traceId,
      email: entry.email,
      user_id: entry.userId ?? null,
      shop_id: entry.shopId ?? null,
      ip_address: entry.ipAddress ?? null,
      status: entry.status,
      failure_reason: entry.failureReason ?? null,
    };
    this.logger.log(JSON.stringify(payload));

    void this.persist(entry).catch((err) => {
      this.logger.warn(
        `login_audit.persist_failed trace_id=${entry.traceId} err=${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  private async persist(entry: LoginAuditEntry): Promise<void> {
    await this.prisma.loginAuditLog.create({
      data: {
        trace_id: entry.traceId,
        email: entry.email.toLowerCase().trim(),
        user_id: entry.userId ?? null,
        shop_id: entry.shopId ?? null,
        ip_address: entry.ipAddress ?? null,
        user_agent: entry.userAgent ?? null,
        status:
          entry.status === 'success'
            ? LoginAuditStatus.success
            : LoginAuditStatus.failed,
        failure_reason: entry.failureReason ?? null,
      },
    });

    // Probabilistic cleanup (1% chance) to keep table bounded.
    // Retains 90 days of audit history; safe to miss — next request will clean.
    if (Math.random() < 0.01) {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      void this.prisma.loginAuditLog
        .deleteMany({ where: { created_at: { lt: cutoff } } })
        .catch((err) => {
          this.logger.warn(
            `login_audit.cleanup_failed err=${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }
  }
}

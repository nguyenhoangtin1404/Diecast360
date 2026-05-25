import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface LoginAuditRecord {
  trace_id: string;
  user_id?: string;
  email: string;
  shop_id?: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed';
  failure_reason?: string;
}

@Injectable()
export class LoginAuditService {
  private readonly logger = new Logger(LoginAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  record(data: LoginAuditRecord): void {
    this.prisma.loginAuditLog
      .create({ data })
      .catch((err) => this.logger.error('login_audit.write_failed', err?.stack));
  }
}

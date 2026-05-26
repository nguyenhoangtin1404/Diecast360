import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Optional,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ErrorCode } from '../constants/error-codes';
import { createLoginTraceId } from '../../auth/login-trace-id';
import { LoginAuditService } from '../../auth/login-audit.service';
import {
  extractClientIp,
  extractLoginEmail,
  extractUserAgent,
  isLoginEndpoint,
} from '../../auth/login-audit.helpers';
import { SecurityAlertService } from '../security/security-alert.service';
import { pathWithoutQuery } from '../middleware/csrf.middleware';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ThrottlerExceptionFilter.name);

  constructor(
    @Optional() private readonly loginAuditService?: LoginAuditService,
    @Optional() private readonly securityAlerts?: SecurityAlertService,
  ) {
    if (!loginAuditService) {
      this.logger.warn('LoginAuditService not injected — throttled login attempts will not be audited');
    }
  }

  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    this.securityAlerts?.recordRateLimit(pathWithoutQuery(request.originalUrl || request.url || ''));

    if (isLoginEndpoint(request.path) && this.loginAuditService) {
      const traceId = createLoginTraceId();
      response.setHeader('X-Trace-Id', traceId);

      this.loginAuditService.record({
        trace_id: traceId,
        email: extractLoginEmail(request.body),
        ip_address: extractClientIp(request),
        user_agent: extractUserAgent(request),
        status: 'failed',
        failure_reason: 'rate_limited',
      });
    }

    response
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .header('Retry-After', '60')
      .json({
        ok: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          details: [],
        },
        message: 'Too many requests. Please try again later.',
      });
  }
}

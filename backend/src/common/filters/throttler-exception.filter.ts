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
import { v7 as uuidv7 } from 'uuid';
import { ErrorCode } from '../constants/error-codes';
import { LoginAuditService } from '../../auth/login-audit.service';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ThrottlerExceptionFilter.name);

  constructor(
    @Optional() private readonly loginAuditService?: LoginAuditService,
  ) {
    if (!loginAuditService) {
      this.logger.warn('LoginAuditService not injected — throttled login attempts will not be audited');
    }
  }

  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // endsWith handles both standard prefix and reverse-proxy path stripping
    const isLoginEndpoint = request.path.endsWith('/auth/login');
    if (isLoginEndpoint && this.loginAuditService) {
      const traceId = uuidv7();
      response.setHeader('X-Trace-Id', traceId);

      const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip;
      const userAgent = (request.headers['user-agent'] as string | undefined)?.slice(0, 512);
      const rawEmail = (request.body as Record<string, unknown>)?.email;

      this.loginAuditService.record({
        trace_id: traceId,
        email: typeof rawEmail === 'string' ? rawEmail.slice(0, 254) : '',
        ip_address: ip,
        user_agent: userAgent,
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

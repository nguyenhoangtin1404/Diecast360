import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Response } from 'express';
import { createLoginTraceId } from './login-trace-id';
import { LoginAuditService } from './login-audit.service';
import {
  LOGIN_TRACE_ID_KEY,
  extractClientIp,
  extractLoginEmail,
  extractUserAgent,
  mapLoginFailureReason,
} from './login-audit.helpers';

@Injectable()
export class LoginAuditInterceptor implements NestInterceptor {
  constructor(private readonly loginAuditService: LoginAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Record<string, unknown>>();
    const res = http.getResponse<Response>();

    const traceId = createLoginTraceId();
    req[LOGIN_TRACE_ID_KEY] = traceId;
    res.setHeader('X-Trace-Id', traceId);

    const ip = extractClientIp(req as never);
    const userAgent = extractUserAgent(req as never);
    const email = extractLoginEmail(req.body);

    return next.handle().pipe(
      catchError((error: unknown) => {
        this.loginAuditService.record({
          trace_id: traceId,
          email,
          ip_address: ip,
          user_agent: userAgent,
          status: 'failed',
          failure_reason: mapLoginFailureReason(error),
        });
        return throwError(() => error);
      }),
    );
  }
}

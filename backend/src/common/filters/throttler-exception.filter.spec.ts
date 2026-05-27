import { HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ThrottlerExceptionFilter } from './throttler-exception.filter';
import { LoginAuditService } from '../../auth/login-audit.service';
import { ErrorCode } from '../constants/error-codes';

jest.mock('../../auth/login-trace-id', () => ({
  createLoginTraceId: jest.fn(() => 'trace-mock-00000000-0000-7000-8000-000000000002'),
}));

describe('ThrottlerExceptionFilter', () => {
  let filter: ThrottlerExceptionFilter;
  let loginAuditService: { record: jest.Mock };
  let response: {
    status: jest.Mock;
    header: jest.Mock;
    setHeader: jest.Mock;
    json: jest.Mock;
  };

  beforeEach(() => {
    loginAuditService = { record: jest.fn() };
    filter = new ThrottlerExceptionFilter(
      loginAuditService as unknown as LoginAuditService,
    );

    response = {
      status: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  function runFilter(path: string, body: Record<string, unknown> = {}) {
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({
          path,
          body,
          headers: {
            'user-agent': 'jest-agent',
            'x-forwarded-for': '203.0.113.2',
          },
          ip: '127.0.0.1',
        }),
        getResponse: () => response,
      }),
    };

    filter.catch(new ThrottlerException(), host as never);
  }

  it('audits throttled login attempts with rate_limited', () => {
    runFilter('/api/v1/auth/login', { email: 'admin@test.com' });

    expect(response.setHeader).toHaveBeenCalledWith('X-Trace-Id', expect.any(String));
    expect(loginAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@test.com',
        status: 'failed',
        failure_reason: 'rate_limited',
        ip_address: '203.0.113.2',
      }),
    );
    expect(response.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: ErrorCode.RATE_LIMIT_EXCEEDED }),
      }),
    );
  });

  it('does not audit throttled non-login endpoints', () => {
    runFilter('/api/v1/items');

    expect(loginAuditService.record).not.toHaveBeenCalled();
    expect(response.setHeader).not.toHaveBeenCalled();
  });

  it('still returns 429 when LoginAuditService is unavailable', () => {
    const filterWithoutAudit = new ThrottlerExceptionFilter(undefined);

    filterWithoutAudit.catch(new ThrottlerException(), {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/auth/login', body: {}, headers: {}, ip: '127.0.0.1' }),
        getResponse: () => response,
      }),
    } as never);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(response.setHeader).not.toHaveBeenCalled();
  });
});

import { BadRequestException, CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { LoginAuditInterceptor } from './login-audit.interceptor';
import { LoginAuditService } from './login-audit.service';
import { LOGIN_TRACE_ID_KEY } from './login-audit.helpers';

jest.mock('./login-trace-id', () => ({
  createLoginTraceId: jest.fn(() => 'trace-mock-00000000-0000-7000-8000-000000000001'),
}));

describe('LoginAuditInterceptor', () => {
  let interceptor: LoginAuditInterceptor;
  let loginAuditService: { record: jest.Mock };
  let res: { setHeader: jest.Mock };
  let req: Record<string, unknown>;

  beforeEach(() => {
    loginAuditService = { record: jest.fn() };
    interceptor = new LoginAuditInterceptor(
      loginAuditService as unknown as LoginAuditService,
    );

    req = {
      body: { email: 'admin@test.com', password: 'secret' },
      headers: { 'user-agent': 'jest-agent', 'x-forwarded-for': '203.0.113.9' },
      ip: '127.0.0.1',
    };
    res = { setHeader: jest.fn() };
  });

  function createContext(): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as ExecutionContext;
  }

  it('sets X-Trace-Id and stores trace id on request', async () => {
    const handler: CallHandler = { handle: () => of({ user: { id: 'u1' } }) };

    await lastValueFrom(interceptor.intercept(createContext(), handler));

    expect(res.setHeader).toHaveBeenCalledWith('X-Trace-Id', expect.any(String));
    expect(typeof req[LOGIN_TRACE_ID_KEY]).toBe('string');
  });

  it('skips audit for AUTH_INVALID_CREDENTIALS (already recorded by AuthService)', async () => {
    const authError = new AppException(
      ErrorCode.AUTH_INVALID_CREDENTIALS,
      'Invalid credentials',
    );
    const handler: CallHandler = { handle: () => throwError(() => authError) };

    await expect(
      lastValueFrom(interceptor.intercept(createContext(), handler)),
    ).rejects.toBe(authError);

    expect(loginAuditService.record).not.toHaveBeenCalled();
  });

  it('skips audit for AUTH_ACCOUNT_LOCKED (AuthService now records all locked paths)', async () => {
    const lockedError = new AppException(ErrorCode.AUTH_ACCOUNT_LOCKED, 'Locked');
    const handler: CallHandler = { handle: () => throwError(() => lockedError) };

    await expect(
      lastValueFrom(interceptor.intercept(createContext(), handler)),
    ).rejects.toBe(lockedError);

    expect(loginAuditService.record).not.toHaveBeenCalled();
  });

  it('audits CAPTCHA failures (not recorded by AuthService before throwing)', async () => {
    const captchaError = new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA failed');
    const handler: CallHandler = { handle: () => throwError(() => captchaError) };

    await expect(
      lastValueFrom(interceptor.intercept(createContext(), handler)),
    ).rejects.toBe(captchaError);

    expect(loginAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        failure_reason: 'validation_error',
      }),
    );
  });

  it('audits validation failures as validation_error', async () => {
    const handler: CallHandler = {
      handle: () => throwError(() => new BadRequestException('Validation failed')),
    };

    await expect(
      lastValueFrom(interceptor.intercept(createContext(), handler)),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(loginAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        failure_reason: 'validation_error',
      }),
    );
  });

  it('does not audit successful login (controller records success)', async () => {
    const handler: CallHandler = {
      handle: () => of({ user: { id: 'user-1', email: 'admin@test.com' }, message: 'ok' }),
    };

    await lastValueFrom(interceptor.intercept(createContext(), handler));

    expect(loginAuditService.record).not.toHaveBeenCalled();
  });
});

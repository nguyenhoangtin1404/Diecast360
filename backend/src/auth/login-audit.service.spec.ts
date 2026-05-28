import { Logger } from '@nestjs/common';
import { LoginAuditService } from './login-audit.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('LoginAuditService', () => {
  let service: LoginAuditService;
  let prisma: { loginAuditLog: { create: jest.Mock } };
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    prisma = {
      loginAuditLog: {
        create: jest.fn(),
      },
    };
    service = new LoginAuditService(prisma as unknown as PrismaService);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('writes audit record fire-and-forget', () => {
    prisma.loginAuditLog.create.mockResolvedValue({ id: 'log-1' });

    service.record({
      trace_id: 'trace-1',
      email: 'admin@test.com',
      status: 'success',
      user_id: 'user-1',
    });

    expect(prisma.loginAuditLog.create).toHaveBeenCalledWith({
      data: {
        trace_id: 'trace-1',
        email: 'admin@test.com',
        status: 'success',
        user_id: 'user-1',
      },
    });
  });

  it('logs write failures without throwing', async () => {
    prisma.loginAuditLog.create.mockRejectedValue(new Error('db down'));

    expect(() =>
      service.record({
        trace_id: 'trace-2',
        email: 'admin@test.com',
        status: 'failed',
        failure_reason: 'invalid_credentials',
      }),
    ).not.toThrow();

    await Promise.resolve();
    expect(errorSpy).toHaveBeenCalledWith(
      'login_audit.write_failed',
      expect.any(String),
    );
  });
});

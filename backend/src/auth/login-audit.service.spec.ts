import { Logger } from '@nestjs/common';
import { LoginAuditService } from '../common/security/login-audit.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('LoginAuditService', () => {
  let service: LoginAuditService;
  let prisma: { loginAuditLog: { create: jest.Mock; deleteMany: jest.Mock } };
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    prisma = {
      loginAuditLog: {
        create: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    service = new LoginAuditService(prisma as unknown as PrismaService);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('writes audit record fire-and-forget', async () => {
    prisma.loginAuditLog.create.mockResolvedValue({ id: 'log-1' });

    service.record({
      traceId: 'trace-1',
      email: 'admin@test.com',
      status: 'success',
      userId: 'user-1',
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(prisma.loginAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          trace_id: 'trace-1',
          email: 'admin@test.com',
          status: 'success',
          user_id: 'user-1',
        }),
      }),
    );
  });

  it('warns on write failure without throwing', async () => {
    prisma.loginAuditLog.create.mockRejectedValue(new Error('db down'));

    expect(() =>
      service.record({
        traceId: 'trace-2',
        email: 'admin@test.com',
        status: 'failed',
        failureReason: 'invalid_credentials',
      }),
    ).not.toThrow();

    await new Promise((r) => setTimeout(r, 0));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('login_audit.persist_failed'),
    );
  });
});

import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { AuthController } from './auth.controller';
import { LOGIN_TRACE_ID_KEY } from './login-audit.helpers';
import { createLoginTraceId } from './login-trace-id';

jest.mock('./login-trace-id', () => ({
  createLoginTraceId: jest.fn(() => 'trace-fallback-00000000-0000-7000-8000-000000000003'),
}));

describe('AuthController login audit', () => {
  const authService = {
    login: jest.fn(),
  };
  const loginAuditService = {
    record: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'COOKIE_SECURE') return 'false';
      if (key === 'COOKIE_SAME_SITE') return 'lax';
      return undefined;
    }),
  };

  const controller = new AuthController(
    authService as never,
    loginAuditService as never,
    configService as never,
  );

  const res = {
    cookie: jest.fn(),
    setHeader: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records success audit with trace id from interceptor', async () => {
    authService.login.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      active_shop_id: 'shop-1',
      user: {
        id: 'user-1',
        email: 'admin@test.com',
        full_name: 'Admin',
        role: 'admin',
        platform_role: null,
      },
    });

    const req = {
      [LOGIN_TRACE_ID_KEY]: 'trace-success-1',
      headers: { 'user-agent': 'jest-agent' },
      ip: '127.0.0.1',
    };

    const result = await controller.login(
      { email: 'admin@test.com', password: 'password123' },
      req,
      res as never,
    );

    expect(result).toEqual({
      user: expect.objectContaining({ id: 'user-1', email: 'admin@test.com' }),
      message: 'Login successful',
    });
    expect(loginAuditService.record).toHaveBeenCalledWith({
      trace_id: 'trace-success-1',
      user_id: 'user-1',
      email: 'admin@test.com',
      shop_id: 'shop-1',
      ip_address: '127.0.0.1',
      user_agent: 'jest-agent',
      status: 'success',
    });
  });

  it('propagates login errors without recording success audit', async () => {
    authService.login.mockRejectedValue(
      new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials'),
    );

    const req = {
      [LOGIN_TRACE_ID_KEY]: 'trace-fail-1',
      headers: {},
      ip: '127.0.0.1',
    };

    await expect(
      controller.login(
        { email: 'wrong@test.com', password: 'bad' },
        req,
        res as never,
      ),
    ).rejects.toThrow(AppException);

    expect(loginAuditService.record).not.toHaveBeenCalled();
  });

  it('uses generated fallback trace id when interceptor key is missing', async () => {
    authService.login.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      active_shop_id: 'shop-1',
      user: {
        id: 'user-1',
        email: 'admin@test.com',
        full_name: 'Admin',
        role: 'admin',
        platform_role: null,
      },
    });

    const req = {
      headers: { 'user-agent': 'jest-agent' },
      ip: '127.0.0.1',
    };

    await controller.login(
      { email: 'admin@test.com', password: 'password123' },
      req,
      res as never,
    );

    expect(createLoginTraceId).toHaveBeenCalledTimes(1);
    expect(loginAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        trace_id: 'trace-fallback-00000000-0000-7000-8000-000000000003',
      }),
    );
  });
});

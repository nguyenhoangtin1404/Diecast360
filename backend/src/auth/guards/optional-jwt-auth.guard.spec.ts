import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  const guard = new OptionalJwtAuthGuard();

  const createContext = (authorization?: string | string[]): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers:
            authorization === undefined
              ? {}
              : { authorization },
        }),
      }),
    }) as ExecutionContext;

  it('should return user when token is valid', () => {
    const user = { id: 'u1', email: 'admin@test.com' };
    const result = guard.handleRequest(null, user, null, createContext('Bearer valid-token'));
    expect(result).toBe(user);
  });

  it('should allow anonymous when token is missing', () => {
    const result = guard.handleRequest(null, null, null, createContext());
    expect(result).toBeNull();
  });

  it('should throw UnauthorizedException when token is expired', () => {
    expect(() =>
      guard.handleRequest(null, null, { name: 'TokenExpiredError' }, createContext('Bearer expired-token')),
    ).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is malformed', () => {
    expect(() =>
      guard.handleRequest(null, null, { message: 'jwt malformed' }, createContext('Bearer malformed')),
    ).toThrow(UnauthorizedException);
  });
});


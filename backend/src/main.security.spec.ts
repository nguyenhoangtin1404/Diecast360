import { validateRuntimeSecurityConfig } from './common/security/runtime-security';

describe('validateRuntimeSecurityConfig', () => {
  it('allows non-production defaults', () => {
    expect(() =>
      validateRuntimeSecurityConfig({
        NODE_ENV: 'development',
      }),
    ).not.toThrow();
  });

  it('rejects production when COOKIE_SECURE is not true', () => {
    expect(() =>
      validateRuntimeSecurityConfig({
        NODE_ENV: 'production',
        COOKIE_SECURE: 'false',
        COOKIE_SAME_SITE: 'strict',
        CORS_ALLOW_LAN: 'false',
      }),
    ).toThrow('COOKIE_SECURE must be true in production');
  });

  it('rejects production when COOKIE_SAME_SITE is none', () => {
    expect(() =>
      validateRuntimeSecurityConfig({
        NODE_ENV: 'production',
        COOKIE_SECURE: 'true',
        COOKIE_SAME_SITE: 'none',
        CORS_ALLOW_LAN: 'false',
      }),
    ).toThrow('COOKIE_SAME_SITE must be "lax" or "strict" in production');
  });

  it('rejects production when LAN CORS is enabled', () => {
    expect(() =>
      validateRuntimeSecurityConfig({
        NODE_ENV: 'production',
        COOKIE_SECURE: 'true',
        COOKIE_SAME_SITE: 'strict',
        CORS_ALLOW_LAN: 'true',
      }),
    ).toThrow('CORS_ALLOW_LAN must be false in production');
  });
});

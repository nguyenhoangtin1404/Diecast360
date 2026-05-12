import { buildHelmetOptions } from './security-headers';

describe('buildHelmetOptions', () => {
  it('disables HSTS outside production', () => {
    const opts = buildHelmetOptions({
      NODE_ENV: 'development',
      COOKIE_SECURE: 'true',
    });
    expect(opts.hsts).toBe(false);
  });

  it('enables HSTS in production with secure cookies by default', () => {
    const opts = buildHelmetOptions({
      NODE_ENV: 'production',
      COOKIE_SECURE: 'true',
    });
    expect(opts.hsts).toEqual(
      expect.objectContaining({ maxAge: 31536000, includeSubDomains: true, preload: false }),
    );
  });

  it('disables HSTS when SECURITY_HSTS_DISABLED=true', () => {
    const opts = buildHelmetOptions({
      NODE_ENV: 'production',
      COOKIE_SECURE: 'true',
      SECURITY_HSTS_DISABLED: 'true',
    });
    expect(opts.hsts).toBe(false);
  });

  it('sets API-oriented CSP', () => {
    const opts = buildHelmetOptions({});
    expect(opts.contentSecurityPolicy).toMatchObject({
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    });
  });
});

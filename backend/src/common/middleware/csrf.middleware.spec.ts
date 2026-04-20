import { createCsrfMiddleware, isCsrfExemptRoute, normalizeApiV1RoutePath } from './csrf.middleware';

describe('normalizeApiV1RoutePath', () => {
  it('extracts route after /api/v1', () => {
    expect(normalizeApiV1RoutePath('/api/v1/auth/me')).toBe('/auth/me');
    expect(normalizeApiV1RoutePath('/api/v1/auth/login')).toBe('/auth/login');
  });

  it('strips trailing slashes', () => {
    expect(normalizeApiV1RoutePath('/api/v1/items/')).toBe('/items');
  });

  it('returns full path when marker missing', () => {
    expect(normalizeApiV1RoutePath('/health')).toBe('/health');
  });
});

describe('isCsrfExemptRoute', () => {
  it('exempts login with standard prefix', () => {
    expect(isCsrfExemptRoute('/api/v1/auth/login')).toBe(true);
  });

  it('does not exempt other auth routes', () => {
    expect(isCsrfExemptRoute('/api/v1/auth/refresh')).toBe(false);
    expect(isCsrfExemptRoute('/api/v1/auth/csrf')).toBe(false);
  });
});

describe('createCsrfMiddleware', () => {
  const mw = createCsrfMiddleware();

  it('allows GET without CSRF header', (done) => {
    const req = {
      method: 'GET',
      originalUrl: '/api/v1/items',
      cookies: {},
      headers: {},
    };
    const res = { status: jest.fn(), json: jest.fn() };
    mw(req as never, res as never, (err?: unknown) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('allows POST /api/v1/auth/login without CSRF', (done) => {
    const req = {
      method: 'POST',
      originalUrl: '/api/v1/auth/login',
      cookies: {},
      headers: {},
    };
    const res = { status: jest.fn(), json: jest.fn() };
    mw(req as never, res as never, (err?: unknown) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('blocks POST without matching CSRF', (done) => {
    const req = {
      method: 'POST',
      originalUrl: '/api/v1/items',
      cookies: {},
      headers: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((body: { error: { code: string } }) => {
        expect(res.status).toHaveBeenCalledWith(403);
        expect(body.error.code).toBe('CSRF_INVALID');
        done();
      }),
    };
    mw(req as never, res as never, () => {
      done(new Error('expected block'));
    });
  });

  it('allows POST when header matches cookie', (done) => {
    const token = 'abc123';
    const req = {
      method: 'POST',
      originalUrl: '/api/v1/items',
      cookies: { csrf_token: token },
      headers: { 'x-csrf-token': token },
    };
    const res = { status: jest.fn(), json: jest.fn() };
    mw(req as never, res as never, (err?: unknown) => {
      expect(err).toBeUndefined();
      done();
    });
  });
});

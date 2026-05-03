import { buildCorsAllowedOrigins, normalizeFrontendOrigin } from './cors-origins.util';

describe('normalizeFrontendOrigin', () => {
  it('strips trailing slash from full URL', () => {
    expect(normalizeFrontendOrigin('https://diecast360-frontend.vercel.app/')).toBe(
      'https://diecast360-frontend.vercel.app',
    );
  });

  it('drops path and query from URL', () => {
    expect(
      normalizeFrontendOrigin('https://app.example.com/foo?x=1#hash'),
    ).toBe('https://app.example.com');
  });

  it('trims whitespace', () => {
    expect(normalizeFrontendOrigin('  http://localhost:5173/  ')).toBe(
      'http://localhost:5173',
    );
  });
});

describe('buildCorsAllowedOrigins', () => {
  it('includes primary and extras with trailing slashes normalized', () => {
    const origins = buildCorsAllowedOrigins({
      FRONTEND_URL: 'https://diecast360-frontend.vercel.app/',
      FRONTEND_URLS: 'https://preview.vercel.app/,',
    });
    expect(origins).toEqual(
      expect.arrayContaining([
        'https://diecast360-frontend.vercel.app',
        'https://preview.vercel.app',
      ]),
    );
  });

  it('adds localhost and 127.0.0.1 variants for primary', () => {
    const origins = buildCorsAllowedOrigins({
      FRONTEND_URL: 'http://localhost:5173/',
    });
    expect(origins.sort()).toEqual(
      ['http://127.0.0.1:5173', 'http://localhost:5173'].sort(),
    );
  });

  it('defaults when FRONTEND_URL is unset', () => {
    const origins = buildCorsAllowedOrigins({});
    expect(origins.sort()).toEqual(
      ['http://127.0.0.1:5173', 'http://localhost:5173'].sort(),
    );
  });
});

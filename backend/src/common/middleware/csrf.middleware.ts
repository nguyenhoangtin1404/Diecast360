import type { NextFunction, Request, Response } from 'express';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

const API_V1_MARKER = '/api/v1';

function isSafeMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

/** Strip query string for path-only checks. */
export function pathWithoutQuery(url: string): string {
  const q = url.indexOf('?');
  return q === -1 ? url : url.slice(0, q);
}

/**
 * Route path relative to global prefix {@code /api/v1}, e.g. {@code /auth/login}.
 * If the marker is missing (some proxies), returns the full path without query.
 */
export function normalizeApiV1RoutePath(fullUrl: string): string {
  const p = pathWithoutQuery(fullUrl);
  const idx = p.indexOf(API_V1_MARKER);
  if (idx === -1) {
    return p;
  }
  let rest = p.slice(idx + API_V1_MARKER.length);
  if (!rest || rest === '/') {
    return '/';
  }
  if (!rest.startsWith('/')) {
    rest = `/${rest}`;
  }
  return rest.replace(/\/+$/, '') || '/';
}

/** Mutating requests exempt from CSRF (login chưa có cookie csrf_token). */
export function isCsrfExemptRoute(fullUrl: string): boolean {
  const route = normalizeApiV1RoutePath(fullUrl);
  if (route === '/auth/login') {
    return true;
  }
  const p = pathWithoutQuery(fullUrl);
  return p.endsWith('/auth/login');
}

/**
 * Double-submit CSRF for cookie-authenticated mutating requests.
 * GET/HEAD/OPTIONS always pass. Bootstrap CSRF uses GET /auth/csrf (safe method).
 * Raw binary endpoint GET /api/v1/media is also safe method — not listed here intentionally.
 */
export function createCsrfMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const method = (req.method || 'GET').toUpperCase();
    if (isSafeMethod(method)) {
      next();
      return;
    }

    const fullPath = req.originalUrl || req.url || '';

    if (isCsrfExemptRoute(fullPath)) {
      next();
      return;
    }

    const headerVal = req.headers[CSRF_HEADER];
    const header = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    const cookie = req.cookies?.[CSRF_COOKIE] as string | undefined;

    if (!header || !cookie || header !== cookie) {
      res.status(403).json({
        ok: false,
        error: { code: 'CSRF_INVALID', details: [] },
        message: 'CSRF token missing or invalid',
      });
      return;
    }

    next();
  };
}

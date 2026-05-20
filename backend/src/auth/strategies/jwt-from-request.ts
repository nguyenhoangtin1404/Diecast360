import { Request } from 'express';

/**
 * Reads access JWT from HttpOnly cookie first, then optionally Authorization: Bearer.
 * Bearer can be disabled via env for web-only deployments (smaller XSS token theft surface).
 */
export function createAccessTokenExtractor(allowAuthorizationBearer: boolean) {
  return (req: Request): string | null => {
    if (req?.cookies && typeof req.cookies.access_token === 'string' && req.cookies.access_token.length > 0) {
      return req.cookies.access_token;
    }
    if (!allowAuthorizationBearer) {
      return null;
    }
    const authHeader = req?.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  };
}

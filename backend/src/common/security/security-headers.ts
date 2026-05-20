import { type HelmetOptions } from 'helmet';

/**
 * Helmet defaults tuned for JSON API + cookie auth (SPA calls API cross-origin).
 * CSP/frame-ancestors reduce impact if a response is ever misinterpreted as HTML.
 */
export function buildHelmetOptions(env: NodeJS.ProcessEnv = process.env): HelmetOptions {
  const isProd = (env.NODE_ENV || '').trim().toLowerCase() === 'production';
  const cookieSecure = (env.COOKIE_SECURE || '').trim().toLowerCase() === 'true';
  const hstsDisabled = (env.SECURITY_HSTS_DISABLED || '').trim().toLowerCase() === 'true';

  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts:
      isProd && cookieSecure && !hstsDisabled
        ? { maxAge: 31536000, includeSubDomains: true, preload: false }
        : false,
  };
}

/**
 * Normalize a frontend origin from env (trim, strip trailing slash, drop path/query/hash).
 * Accepts values like `https://app.vercel.app/` so they match browser `Origin` headers.
 */
export function normalizeFrontendOrigin(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  try {
    const u = new URL(s);
    u.hash = '';
    u.pathname = '';
    u.search = '';
    return u.origin;
  } catch {
    return s.replace(/\/+$/, '');
  }
}

/** Merge FRONTEND_URL + FRONTEND_URLS and add localhost ↔ 127.0.0.1 variants (same port). */
export function buildCorsAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const primary = normalizeFrontendOrigin(
    env.FRONTEND_URL || 'http://localhost:5173',
  );
  const extras = (env.FRONTEND_URLS || '')
    .split(',')
    .map((s) => normalizeFrontendOrigin(s))
    .filter(Boolean);
  const out = new Set<string>();
  for (const raw of [primary, ...extras]) {
    if (!raw) continue;
    out.add(raw);
    try {
      const u = new URL(raw);
      if (u.hostname === 'localhost') {
        u.hostname = '127.0.0.1';
        out.add(u.origin);
      } else if (u.hostname === '127.0.0.1') {
        u.hostname = 'localhost';
        out.add(u.origin);
      }
    } catch {
      /* ignore malformed */
    }
  }
  return [...out];
}

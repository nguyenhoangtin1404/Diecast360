export function normalizeEnvBoolean(value: string | undefined): boolean {
  return (value || '').trim().toLowerCase() === 'true';
}

/** Production boot checks (cookie/CORS hardening). */
export function validateRuntimeSecurityConfig(env: NodeJS.ProcessEnv = process.env): void {
  const isProduction = (env.NODE_ENV || '').trim().toLowerCase() === 'production';
  if (!isProduction) return;

  const cookieSecure = normalizeEnvBoolean(env.COOKIE_SECURE);
  if (!cookieSecure) {
    throw new Error('COOKIE_SECURE must be true in production');
  }

  const sameSite = (env.COOKIE_SAME_SITE || 'lax').trim().toLowerCase();
  if (!['lax', 'strict'].includes(sameSite)) {
    throw new Error('COOKIE_SAME_SITE must be "lax" or "strict" in production');
  }

  const allowLanCors = normalizeEnvBoolean(env.CORS_ALLOW_LAN);
  if (allowLanCors) {
    throw new Error('CORS_ALLOW_LAN must be false in production');
  }
}

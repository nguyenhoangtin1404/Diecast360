import * as crypto from 'crypto';

export interface SignedMediaPayload {
  /** Relative path under upload root, e.g. images/foo.jpg */
  p: string;
  /** Expiry epoch ms */
  exp: number;
}

export function signMediaPayload(payload: SignedMediaPayload, secret: string): { d: string; s: string } {
  const d = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const s = crypto.createHmac('sha256', secret).update(d).digest('hex');
  return { d, s };
}

export function verifySignedMediaParams(
  d: string | undefined,
  s: string | undefined,
  secret: string,
): SignedMediaPayload | null {
  if (!d || !s || typeof d !== 'string' || typeof s !== 'string') return null;
  const expected = crypto.createHmac('sha256', secret).update(d).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(s, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(d, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const { p, exp } = parsed as Partial<SignedMediaPayload>;
  if (typeof p !== 'string' || typeof exp !== 'number' || !Number.isFinite(exp)) return null;
  if (exp <= Date.now()) return null;
  const clean = p.replace(/^\.\//, '').replace(/^\//, '');
  if (clean.includes('..') || clean.startsWith('/')) return null;
  return { p: clean, exp };
}

/** Build GET URL for {@link MediaController} (global prefix /api/v1 already applied by Nest). */
export function buildSignedMediaFileUrl(
  apiBaseUrl: string,
  relativeFilePath: string,
  secret: string,
  ttlMs: number,
): string {
  const clean = relativeFilePath.replace(/^\.\//, '').replace(/^\//, '');
  const exp = Date.now() + ttlMs;
  const { d, s } = signMediaPayload({ p: clean, exp }, secret);
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}/media?d=${encodeURIComponent(d)}&s=${encodeURIComponent(s)}`;
}

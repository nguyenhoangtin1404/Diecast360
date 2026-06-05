import { ConfigService } from '@nestjs/config';
import { buildSignedMediaFileUrl, verifySignedMediaParams } from './signed-media.util';
import { resolveMediaSigningSecret } from './media-signing-secret';
import { parseMediaUrlTtlMs } from './media-url-ttl.util';

const SHOP_BRANDING_PREFIX = 'shop-branding/';

/**
 * Extract DB-relative path (e.g. shop-branding/foo.jpg) from a stored appearance URL.
 * Supports signed /api/v1/media links and direct R2 presigned URLs.
 */
export function extractShopBrandingRelativePath(
  storedUrl: string,
  mediaSigningSecret?: string,
): string | null {
  const trimmed = storedUrl.trim();
  if (!trimmed) return null;

  if (mediaSigningSecret) {
    try {
      const u = new URL(trimmed);
      const payload = verifySignedMediaParams(
        u.searchParams.get('d') ?? undefined,
        u.searchParams.get('s') ?? undefined,
        mediaSigningSecret,
      );
      if (payload?.p.startsWith(SHOP_BRANDING_PREFIX)) {
        return payload.p;
      }
    } catch {
      /* fall through */
    }
  }

  // Recovery for expired local signed URLs: bare-decode the 'd' param without HMAC/expiry checks.
  // Safe here — we only extract the path prefix; the caller re-signs via storage.getFileUrl().
  try {
    const u = new URL(trimmed);
    const d = u.searchParams.get('d');
    if (d) {
      const raw = JSON.parse(Buffer.from(d, 'base64url').toString('utf8')) as unknown;
      const p = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>).p : undefined;
      if (typeof p === 'string' && p.startsWith(SHOP_BRANDING_PREFIX)) {
        return p;
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const u = new URL(trimmed);
    const pathname = decodeURIComponent(u.pathname);
    const idx = pathname.indexOf(SHOP_BRANDING_PREFIX);
    if (idx >= 0) {
      return pathname.slice(idx).replace(/^\/+/, '');
    }
  } catch {
    const idx = trimmed.indexOf(SHOP_BRANDING_PREFIX);
    if (idx >= 0) {
      const tail = trimmed.slice(idx);
      const q = tail.indexOf('?');
      return (q >= 0 ? tail.slice(0, q) : tail).replace(/^\/+/, '');
    }
  }

  return null;
}

/**
 * Receipt/share flows need a same-origin API media URL (CORS-safe for canvas export),
 * not a direct R2 presigned URL.
 */
export function resolveReceiptLogoUrl(
  stored: string | undefined,
  config: ConfigService,
): string | undefined {
  if (!stored?.trim()) return undefined;

  let secret: string | undefined;
  try {
    secret = resolveMediaSigningSecret(config);
  } catch {
    secret = undefined;
  }

  const relative = extractShopBrandingRelativePath(stored, secret);
  if (!relative) {
    return stored.trim();
  }

  if (!secret) {
    return stored.trim();
  }

  const backend = (config.get<string>('BACKEND_URL') || 'http://localhost:3000').replace(/\/$/, '');
  const apiBase = `${backend}/api/v1`;
  const ttlMs = parseMediaUrlTtlMs(config);
  return buildSignedMediaFileUrl(apiBase, relative, secret, ttlMs);
}

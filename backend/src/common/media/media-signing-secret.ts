import { ConfigService } from '@nestjs/config';

const MIN_SECRET_LEN = 32;

/**
 * Secret for HMAC signed media URLs. Prefer {@code MEDIA_SIGNING_SECRET} so JWT rotation
 * does not invalidate all media links; falls back to {@code JWT_SECRET} if unset.
 */
export function resolveMediaSigningSecret(config: ConfigService): string {
  const media = (config.get<string>('MEDIA_SIGNING_SECRET') || '').trim();
  if (media.length >= MIN_SECRET_LEN) {
    return media;
  }
  const jwt = (config.get<string>('JWT_SECRET') || '').trim();
  if (jwt.length >= MIN_SECRET_LEN) {
    return jwt;
  }
  throw new Error(
    'Set MEDIA_SIGNING_SECRET (>=32 chars) or JWT_SECRET (>=32 chars) for signed media URLs',
  );
}

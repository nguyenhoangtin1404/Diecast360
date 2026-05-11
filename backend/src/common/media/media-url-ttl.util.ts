import { ConfigService } from '@nestjs/config';

export const DEFAULT_MEDIA_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function parseMediaUrlTtlMs(config: ConfigService): number {
  const raw = config.get<string | number>('MEDIA_URL_TTL_MS');
  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_MEDIA_URL_TTL_MS;
  }
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_MEDIA_URL_TTL_MS;
  }
  return n;
}

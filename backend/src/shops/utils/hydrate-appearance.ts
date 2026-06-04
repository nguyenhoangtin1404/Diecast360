import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma/client';
import type { IStorageService } from '../../storage/storage.interface';
import { resolveMediaSigningSecret } from '../../common/media/media-signing-secret';
import { extractShopBrandingRelativePath } from '../../common/media/resolve-receipt-logo-url';

export async function hydrateAppearanceJson(
  json: Prisma.JsonValue,
  storage: IStorageService,
  config: ConfigService,
): Promise<Prisma.JsonValue> {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return json;
  const obj = json as Record<string, unknown>;
  const result = { ...obj };
  let secret: string | undefined;
  try {
    secret = resolveMediaSigningSecret(config);
  } catch { /* ignore */ }
  for (const key of ['logo_url', 'favicon_url']) {
    const stored = result[key];
    if (typeof stored !== 'string' || !stored.trim()) continue;
    const relativePath = extractShopBrandingRelativePath(stored.trim(), secret);
    if (relativePath) {
      result[key] = await storage.getFileUrl(relativePath);
    }
  }
  return result as Prisma.JsonValue;
}

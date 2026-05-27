import { ConfigService } from '@nestjs/config';
import {
  extractShopBrandingRelativePath,
  resolveReceiptLogoUrl,
} from './resolve-receipt-logo-url';
import { buildSignedMediaFileUrl } from './signed-media.util';

const secret = 'test-media-signing-secret-32chars!!';

describe('extractShopBrandingRelativePath', () => {
  it('extracts path from R2 presigned URL', () => {
    const url =
      'https://account.r2.cloudflarestorage.com/diecast360-media/shop-branding/shop_logo.jpg?X-Amz-Signature=abc';
    expect(extractShopBrandingRelativePath(url)).toBe('shop-branding/shop_logo.jpg');
  });

  it('extracts path from signed API media URL', () => {
    const signed = buildSignedMediaFileUrl(
      'https://api.example.com/api/v1',
      'shop-branding/logo.png',
      secret,
      60_000,
    );
    expect(extractShopBrandingRelativePath(signed, secret)).toBe('shop-branding/logo.png');
  });

  it('returns null for unrelated URLs', () => {
    expect(extractShopBrandingRelativePath('https://cdn.example.com/logo.png')).toBeNull();
  });
});

describe('resolveReceiptLogoUrl', () => {
  const config = {
    get: (key: string) => {
      if (key === 'BACKEND_URL') return 'https://api.example.com';
      if (key === 'JWT_SECRET') return secret;
      return undefined;
    },
  } as ConfigService;

  it('rewrites R2 URL to API signed media URL', () => {
    const r2 =
      'https://8410b9d76b04.r2.cloudflarestorage.com/diecast360-media/shop-branding/logo.jpg?sig=1';
    const out = resolveReceiptLogoUrl(r2, config);
    expect(out).toMatch(/^https:\/\/api\.example\.com\/api\/v1\/media\?/);
    expect(extractShopBrandingRelativePath(out!, secret)).toBe('shop-branding/logo.jpg');
  });

  it('passes through external CDN URLs', () => {
    const cdn = 'https://cdn.example.com/logo.png';
    expect(resolveReceiptLogoUrl(cdn, config)).toBe(cdn);
  });
});

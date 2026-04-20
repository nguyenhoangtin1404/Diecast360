import { ConfigService } from '@nestjs/config';
import { resolveMediaSigningSecret } from './media-signing-secret';

function mockConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
}

describe('resolveMediaSigningSecret', () => {
  it('prefers MEDIA_SIGNING_SECRET when long enough', () => {
    const s = resolveMediaSigningSecret(
      mockConfig({
        MEDIA_SIGNING_SECRET: 'a'.repeat(32),
        JWT_SECRET: 'b'.repeat(32),
      }),
    );
    expect(s).toBe('a'.repeat(32));
  });

  it('falls back to JWT_SECRET when MEDIA unset or short', () => {
    const jwt = 'j'.repeat(32);
    expect(
      resolveMediaSigningSecret(
        mockConfig({
          MEDIA_SIGNING_SECRET: 'short',
          JWT_SECRET: jwt,
        }),
      ),
    ).toBe(jwt);
    expect(
      resolveMediaSigningSecret(
        mockConfig({
          JWT_SECRET: jwt,
        }),
      ),
    ).toBe(jwt);
  });

  it('throws when neither secret is sufficient', () => {
    expect(() =>
      resolveMediaSigningSecret(
        mockConfig({
          MEDIA_SIGNING_SECRET: 'x',
          JWT_SECRET: 'y',
        }),
      ),
    ).toThrow(/MEDIA_SIGNING_SECRET|JWT_SECRET/);
  });
});

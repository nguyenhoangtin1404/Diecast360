import { afterEach, describe, expect, it } from 'vitest';
import {
  clearMemoryCsrfToken,
  csrfHeaderPair,
  extractCsrfTokenFromBody,
  rememberCsrfFromResponseBody,
} from '../../src/api/csrf';

afterEach(() => {
  clearMemoryCsrfToken();
  document.cookie = 'csrf_token=; path=/; max-age=0';
});

describe('extractCsrfTokenFromBody', () => {
  it('reads raw csrf_token', () => {
    expect(extractCsrfTokenFromBody({ csrf_token: 'abc' })).toBe('abc');
  });

  it('reads wrapped ok/data envelope', () => {
    expect(
      extractCsrfTokenFromBody({ ok: true, data: { csrf_token: 'wrapped' }, message: '' }),
    ).toBe('wrapped');
  });
});

describe('csrfHeaderPair cross-site memory', () => {
  it('uses first-party cookie when present', () => {
    document.cookie = 'csrf_token=cookieval; path=/';
    rememberCsrfFromResponseBody({ csrf_token: 'mem' });
    expect(csrfHeaderPair()['X-CSRF-Token']).toBe('cookieval');
  });

  it('falls back to memory when cookie unreadable (cross-site)', () => {
    rememberCsrfFromResponseBody({ csrf_token: 'from-body' });
    expect(csrfHeaderPair()['X-CSRF-Token']).toBe('from-body');
  });
});

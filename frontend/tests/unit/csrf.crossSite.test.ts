import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearMemoryCsrfToken,
  csrfHeaderPair,
  ensureCsrfBootstrap,
  extractCsrfTokenFromBody,
  rememberCsrfFromResponseBody,
} from '../../src/api/csrf';

afterEach(() => {
  clearMemoryCsrfToken();
  document.cookie = 'csrf_token=; path=/; max-age=0';
  vi.restoreAllMocks();
  vi.useRealTimers();
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

  it('returns undefined for null, primitives, empty token, or unrelated shapes', () => {
    expect(extractCsrfTokenFromBody(null)).toBeUndefined();
    expect(extractCsrfTokenFromBody(undefined)).toBeUndefined();
    expect(extractCsrfTokenFromBody('x')).toBeUndefined();
    expect(extractCsrfTokenFromBody({})).toBeUndefined();
    expect(extractCsrfTokenFromBody({ csrf_token: '' })).toBeUndefined();
    expect(extractCsrfTokenFromBody({ ok: true, data: { user: 'x' }, message: '' })).toBeUndefined();
    expect(extractCsrfTokenFromBody({ ok: true, data: {}, message: '' })).toBeUndefined();
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

describe('ensureCsrfBootstrap', () => {
  it('dedupes concurrent in-flight bootstraps into one GET', async () => {
    const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: { csrf_token: 'one-shot' } });
    await Promise.all([ensureCsrfBootstrap(), ensureCsrfBootstrap()]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(csrfHeaderPair()['X-CSRF-Token']).toBe('one-shot');
  });
});

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_SESSION_STORAGE_KEY,
  bumpAuthSessionRevision,
  readAuthSessionRevision,
} from '../../src/utils/authSessionSync';

describe('authSessionSync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('readAuthSessionRevision returns empty string when key missing', () => {
    expect(readAuthSessionRevision()).toBe('');
  });

  it('readAuthSessionRevision returns stored value', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, '42');
    expect(readAuthSessionRevision()).toBe('42');
  });

  it('readAuthSessionRevision returns empty on localStorage throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readAuthSessionRevision()).toBe('');
  });

  it('bumpAuthSessionRevision writes numeric timestamp string', () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    bumpAuthSessionRevision();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBe(String(now));
    expect(readAuthSessionRevision()).toBe(String(now));
  });

  it('bumpAuthSessionRevision swallows localStorage set errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => bumpAuthSessionRevision()).not.toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { normalizeConfiguredApiBaseUrl } from '../../src/config/api';

describe('normalizeConfiguredApiBaseUrl', () => {
  it('appends /api/v1 when only origin is set (production footgun)', () => {
    expect(normalizeConfiguredApiBaseUrl('https://api.nhtin.name.vn')).toBe(
      'https://api.nhtin.name.vn/api/v1',
    );
    expect(normalizeConfiguredApiBaseUrl('https://api.nhtin.name.vn/')).toBe(
      'https://api.nhtin.name.vn/api/v1',
    );
  });

  it('leaves full API base unchanged', () => {
    expect(normalizeConfiguredApiBaseUrl('https://api.example.com/api/v1')).toBe(
      'https://api.example.com/api/v1',
    );
    expect(normalizeConfiguredApiBaseUrl('http://localhost:3000/api/v1')).toBe(
      'http://localhost:3000/api/v1',
    );
  });

  it('normalizes relative base paths', () => {
    expect(normalizeConfiguredApiBaseUrl('/api/v1')).toBe('/api/v1');
    expect(normalizeConfiguredApiBaseUrl('/api/v1/')).toBe('/api/v1');
  });

  it('does not rewrite uncommon path prefixes', () => {
    expect(normalizeConfiguredApiBaseUrl('https://api.example.com/staging')).toBe(
      'https://api.example.com/staging',
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildCatalogSearchParams,
  parseCatalogUrlState,
  parseSortBy,
  parseSortOrder,
} from '../../src/pages/publicCatalogUrlState';

describe('publicCatalogUrlState', () => {
  it('should parse invalid sort params to defaults', () => {
    expect(parseSortBy('invalid')).toBe('created_at');
    expect(parseSortOrder('invalid')).toBe('desc');
  });

  it('should parse URL values with trimming and whitelist rules', () => {
    const params = new URLSearchParams(
      'q=%20civic%20&car_brand=Toyota&model_brand=&condition=old&sort_by=price&sort_order=asc',
    );

    const parsed = parseCatalogUrlState(params);

    expect(parsed).toEqual({
      search: 'civic',
      carBrand: 'Toyota',
      modelBrand: null,
      condition: 'old',
      sortBy: 'price',
      sortOrder: 'asc',
    });
  });

  it('should build compact URL params and omit defaults', () => {
    const params = buildCatalogSearchParams({
      search: '  skyline  ',
      carBrand: 'Nissan',
      modelBrand: null,
      condition: null,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    expect(params.toString()).toBe('q=skyline&car_brand=Nissan');
  });

  it('should support parse/build sync for non-default sort values', () => {
    const params = new URLSearchParams(
      'q=rx7&car_brand=Mazda&model_brand=Mini+GT&condition=new&sort_by=name&sort_order=asc',
    );

    const parsed = parseCatalogUrlState(params);
    const rebuilt = buildCatalogSearchParams(parsed);

    expect(rebuilt.toString()).toBe(
      'q=rx7&car_brand=Mazda&model_brand=Mini+GT&condition=new&sort_by=name&sort_order=asc',
    );
  });

  it('should truncate very long search query from URL', () => {
    const longQuery = 'a'.repeat(300);
    const parsed = parseCatalogUrlState(new URLSearchParams(`q=${longQuery}`));

    expect(parsed.search.length).toBe(200);
    expect(parsed.search).toBe('a'.repeat(200));
  });

  it('should return defaults when URL params are missing', () => {
    const parsed = parseCatalogUrlState(new URLSearchParams(''));

    expect(parsed).toEqual({
      search: '',
      carBrand: null,
      modelBrand: null,
      condition: null,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  });

  it('should parse invalid condition and invalid sort values to safe defaults', () => {
    const parsed = parseCatalogUrlState(
      new URLSearchParams('condition=invalid&sort_by=__proto__&sort_order=drop-table'),
    );

    expect(parsed.condition).toBeNull();
    expect(parsed.sortBy).toBe('created_at');
    expect(parsed.sortOrder).toBe('desc');
  });

  it('should keep injection-like strings as inert text and URL-encode on build', () => {
    const payload = '<script>alert(1)</script>';
    const parsed = parseCatalogUrlState(new URLSearchParams(`q=${encodeURIComponent(payload)}`));

    expect(parsed.search).toBe(payload);

    const built = buildCatalogSearchParams({
      ...parsed,
      carBrand: "' OR 1=1 --",
      modelBrand: null,
      condition: null,
    });

    expect(built.toString()).toContain('q=%3Cscript%3Ealert%281%29%3C%2Fscript%3E');
    expect(built.toString()).toContain('car_brand=%27+OR+1%3D1+--');
  });
});

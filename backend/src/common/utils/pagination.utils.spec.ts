import { totalPagesFromCount } from './pagination.utils';

describe('totalPagesFromCount', () => {
  it('returns 1 when total is 0', () => {
    expect(totalPagesFromCount(0, 20)).toBe(1);
  });

  it('returns 1 for a single full page', () => {
    expect(totalPagesFromCount(5, 20)).toBe(1);
    expect(totalPagesFromCount(20, 20)).toBe(1);
  });

  it('rounds up for partial last pages', () => {
    expect(totalPagesFromCount(21, 20)).toBe(2);
    expect(totalPagesFromCount(50, 10)).toBe(5);
  });

  it('clamps invalid page size to 1', () => {
    expect(totalPagesFromCount(0, 0)).toBe(1);
    expect(totalPagesFromCount(5, -3)).toBe(5);
  });
});

import { totalPagesFromCount } from './pagination.utils';

describe('totalPagesFromCount', () => {
  it('returns 1 when total is 0 (empty result)', () => {
    expect(totalPagesFromCount(0, 20)).toBe(1);
  });

  it('returns ceil(total/pageSize) when total > 0', () => {
    expect(totalPagesFromCount(1, 20)).toBe(1);
    expect(totalPagesFromCount(20, 20)).toBe(1);
    expect(totalPagesFromCount(21, 20)).toBe(2);
    expect(totalPagesFromCount(50, 10)).toBe(5);
  });
});

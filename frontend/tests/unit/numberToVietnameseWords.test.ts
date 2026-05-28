import { describe, expect, it } from 'vitest';
import { formatVndAmountInWords } from '../../src/utils/numberToVietnameseWords';

describe('formatVndAmountInWords', () => {
  it('formats zero', () => {
    expect(formatVndAmountInWords(0)).toBe('Không đồng chẵn');
  });

  it('formats sample receipt total', () => {
    expect(formatVndAmountInWords(385_000)).toBe('Ba trăm tám mươi lăm nghìn đồng chẵn');
  });

  it('formats millions', () => {
    expect(formatVndAmountInWords(1_250_000)).toMatch(/đồng chẵn$/);
  });

  it('uses "lăm" for teen amounts ending in 5 (e.g. 15)', () => {
    expect(formatVndAmountInWords(15)).toBe('Mười lăm đồng chẵn');
    expect(formatVndAmountInWords(1_015)).toMatch(/mười lăm/);
  });

  it('formats amounts at one trillion VND and above', () => {
    expect(formatVndAmountInWords(1_000_000_000_000)).toMatch(/nghìn tỷ/);
    expect(formatVndAmountInWords(1_000_000_000_000)).toMatch(/đồng chẵn$/);
  });
});

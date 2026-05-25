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
});

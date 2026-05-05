import { jsonStableStringify } from './json-stable-stringify';

describe('jsonStableStringify', () => {
  it('treats same object with different key order as equal', () => {
    const a = { z: 1, a: { y: 2, b: 3 } };
    const b = { a: { b: 3, y: 2 }, z: 1 };
    expect(jsonStableStringify(a)).toBe(jsonStableStringify(b));
  });

  it('normalizes nested key order recursively', () => {
    const x = { outer: { z: 1, a: { m: 2, n: 3 } } };
    const y = { outer: { a: { n: 3, m: 2 }, z: 1 } };
    expect(jsonStableStringify(x)).toBe(jsonStableStringify(y));
  });
});

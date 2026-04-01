import { isValidItemAttributes } from './item-attributes.validator';

describe('isValidItemAttributes', () => {
  it('accepts empty object', () => {
    expect(isValidItemAttributes({})).toBe(true);
  });

  it('accepts flat scalar values', () => {
    expect(
      isValidItemAttributes({
        color: 'red',
        year: 2024,
        limited: true,
        note: null,
      }),
    ).toBe(true);
  });

  it('rejects arrays and nested objects', () => {
    expect(isValidItemAttributes([])).toBe(false);
    expect(isValidItemAttributes({ nested: { a: 1 } })).toBe(false);
    expect(isValidItemAttributes(null)).toBe(false);
  });

  it('rejects reserved prototype keys', () => {
    // `{ __proto__: ... }` is special-cased by the object literal and does not add an own
    // enumerable key, so use computed property names to exercise the reserved-key guard.
    expect(isValidItemAttributes({ ['__proto__']: 'x' })).toBe(false);
    expect(isValidItemAttributes({ constructor: 'x' })).toBe(false);
    expect(isValidItemAttributes({ prototype: 'x' })).toBe(false);
  });

  it('rejects untrimmed or empty keys', () => {
    expect(isValidItemAttributes({ ' a': 'x' })).toBe(false);
    expect(isValidItemAttributes({ '': 'x' })).toBe(false);
  });

  it('rejects more than 50 keys', () => {
    const attrs: Record<string, number> = {};
    for (let i = 0; i < 51; i += 1) {
      attrs[`k${i}`] = i;
    }
    expect(isValidItemAttributes(attrs)).toBe(false);
  });

  it('rejects keys longer than 50 characters', () => {
    expect(isValidItemAttributes({ [`${'x'.repeat(51)}`]: 1 })).toBe(false);
  });

  it('rejects string values longer than 500 characters', () => {
    expect(isValidItemAttributes({ note: 'x'.repeat(501) })).toBe(false);
  });

  it('rejects non-finite numbers', () => {
    expect(isValidItemAttributes({ n: NaN })).toBe(false);
    expect(isValidItemAttributes({ n: Infinity })).toBe(false);
  });
});

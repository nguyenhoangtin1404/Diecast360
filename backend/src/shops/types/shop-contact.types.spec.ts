import { parseShopContactJson } from './shop-contact.types';

describe('parseShopContactJson', () => {
  it('ignores non-string nested values', () => {
    const raw = {
      page_title: 123,
      phone: { tel: 999, label: 'ok' },
    };
    const out = parseShopContactJson(raw);
    expect(out.page_title).toBeUndefined();
    expect(out.phone?.tel).toBeUndefined();
    expect(out.phone?.label).toBe('ok');
  });
});

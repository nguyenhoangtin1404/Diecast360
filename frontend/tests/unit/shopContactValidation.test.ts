import { describe, expect, it } from 'vitest';
import {
  isOptionalHttpUrl,
  isOptionalTelDisplay,
  isShopContactClientValid,
} from '../../src/pages/admin/shops/shopContactForm';
import type { ShopContactFormState } from '../../src/pages/admin/shops/types/shopContact';

const emptyForm = (): ShopContactFormState => ({
  page_title: '',
  page_subtitle: '',
  phone: { title: '', label: '', tel: '', hint: '' },
  facebook: { title: '', url: '', label: '', hint: '' },
  zalo: { title: '', url: '', label: '', hint: '' },
  hours: { title: '', schedule_line: '', footer_note: '' },
});

describe('shop contact client validation', () => {
  it('isOptionalHttpUrl accepts empty and http(s)', () => {
    expect(isOptionalHttpUrl('')).toBe(true);
    expect(isOptionalHttpUrl('  ')).toBe(true);
    expect(isOptionalHttpUrl('https://facebook.com/x')).toBe(true);
    expect(isOptionalHttpUrl('http://a.b')).toBe(true);
    expect(isOptionalHttpUrl('ftp://a.b')).toBe(false);
    expect(isOptionalHttpUrl('not-a-url')).toBe(false);
  });

  it('isOptionalTelDisplay accepts empty and common tel strings', () => {
    expect(isOptionalTelDisplay('')).toBe(true);
    expect(isOptionalTelDisplay('+84 85 669 4766')).toBe(true);
    expect(isOptionalTelDisplay('(028) 3822-1234')).toBe(true);
    expect(isOptionalTelDisplay('abc')).toBe(false);
    expect(isOptionalTelDisplay('+++')).toBe(false);
  });

  it('isShopContactClientValid aggregates fields', () => {
    const ok = emptyForm();
    ok.phone.tel = '+84 9';
    ok.facebook.url = 'https://fb.com/x';
    ok.zalo.url = '';
    expect(isShopContactClientValid(ok)).toBe(true);

    const badTel = emptyForm();
    badTel.phone.tel = 'call-me';
    expect(isShopContactClientValid(badTel)).toBe(false);

    const badFb = emptyForm();
    badFb.facebook.url = 'zalo.me/x';
    expect(isShopContactClientValid(badFb)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { buildPreorderReceiptHtml, sanitizeLogoUrl } from '../../src/utils/preorderReceiptHtml';
import type { PreorderReceiptPayload } from '../../src/types/preorderReceipt';

const basePayload: PreorderReceiptPayload = {
  shop: { name: 'Shop Test' },
  preorder: {
    id: '01950000-0000-7000-8000-000000000001',
    status: 'WAITING_FOR_GOODS',
    quantity: 1,
    unit_price: null,
    total_amount: null,
    deposit_amount: 0,
    paid_amount: 0,
    remaining_amount: null,
    discount_amount: null,
    note: null,
    created_at: '2026-05-01T00:00:00.000Z',
    item: { name: 'Test item' },
    member: null,
    user: null,
  },
};

describe('sanitizeLogoUrl', () => {
  it('allows https URLs', () => {
    expect(sanitizeLogoUrl('https://cdn.example.com/logo.png')).toBe(
      'https://cdn.example.com/logo.png',
    );
  });

  it('allows same-origin relative paths', () => {
    expect(sanitizeLogoUrl('/api/v1/media?d=x&s=y')).toBe('/api/v1/media?d=x&s=y');
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeLogoUrl('//evil.example/logo.png')).toBeNull();
  });

  it('rejects javascript: and empty', () => {
    expect(sanitizeLogoUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeLogoUrl('')).toBeNull();
  });
});

describe('buildPreorderReceiptHtml', () => {
  it('shows em dash for unknown totals instead of zero', () => {
    const html = buildPreorderReceiptHtml(basePayload, 'thermal');
    expect(html).toContain(
      '<span class="label">Tổng cộng</span><span class="value">—</span>',
    );
  });

  it('renders note when present', () => {
    const html = buildPreorderReceiptHtml(
      {
        ...basePayload,
        preorder: {
          ...basePayload.preorder,
          note: 'Giao cuối tuần',
          unit_price: 100_000,
          total_amount: 100_000,
          remaining_amount: 100_000,
        },
      },
      'thermal',
    );
    expect(html).toContain('Ghi chú');
    expect(html).toContain('Giao cuối tuần');
  });

  it('hides discount line when discount_amount is null', () => {
    const html = buildPreorderReceiptHtml(
      {
        ...basePayload,
        preorder: {
          ...basePayload.preorder,
          unit_price: 50_000,
          total_amount: 50_000,
          remaining_amount: 50_000,
        },
      },
      'thermal',
    );
    expect(html).not.toContain('Chiết khấu');
  });
});

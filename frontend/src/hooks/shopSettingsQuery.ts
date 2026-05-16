import { apiClient } from '../api/client';

/** Row from GET /api/v1/shop-settings (tenant from JWT). */
export type ShopSettingsApiRow = {
  id: string;
  name: string;
  slug: string;
  contact_json?: unknown;
  appearance_json?: unknown;
  loyalty_json?: unknown;
};

export const shopSettingsQueryKey = (shopId: string | null) =>
  ['shop-settings', shopId] as const;

export async function fetchShopSettings(): Promise<ShopSettingsApiRow> {
  const res = (await apiClient.get('/shop-settings')) as unknown;
  const wrapped = res as { data?: ShopSettingsApiRow };
  const row = wrapped?.data;
  if (row && typeof row === 'object' && typeof row.id === 'string') {
    return row;
  }
  throw new Error('Invalid shop settings response');
}

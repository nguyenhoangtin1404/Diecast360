import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useShop } from './useShop';
import { parseAppearanceFormDefaults } from '../pages/admin/shops/shopSettingsForm';

/** React Query key — invalidate from ShopSettingsPage when appearance changes */
export const adminShopBrandingQueryKey = (shopId: string | null) =>
  ['admin-shop-branding', shopId] as const;

/**
 * Active shop logo URL for admin chrome (sidebar / mobile header).
 * Uses GET /shop-settings (same auth as admin); separate cache key from ShopSettingsPage form query.
 */
export function useAdminShopBranding(enabled: boolean) {
  const { activeShop } = useShop();
  const shopId = activeShop?.id ?? null;

  return useQuery({
    queryKey: adminShopBrandingQueryKey(shopId),
    queryFn: async () => {
      const res = (await apiClient.get('/shop-settings')) as unknown;
      const wrapped = res as { data?: { appearance_json?: unknown } };
      const row = wrapped?.data;
      if (!row || typeof row !== 'object' || typeof (row as { id?: unknown }).id !== 'string') {
        throw new Error('Invalid shop settings response');
      }
      return parseAppearanceFormDefaults(row.appearance_json);
    },
    enabled: enabled && Boolean(shopId),
    staleTime: 60_000,
  });
}

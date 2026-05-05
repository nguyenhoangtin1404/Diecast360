import { useQuery } from '@tanstack/react-query';
import { useShop } from './useShop';
import { parseAppearanceFormDefaults } from '../pages/admin/shops/shopSettingsForm';
import { fetchShopSettings, shopSettingsQueryKey } from './shopSettingsQuery';
import type { ShopAppearanceFormState } from '../pages/admin/shops/types/shopSettings';

/**
 * Active shop logo/favicon for admin chrome — shares React Query cache with ShopSettingsPage
 * (`shop-settings` key + same queryFn). Tenant shop comes from JWT + TenantGuard.
 */
export function useAdminShopBranding(enabled: boolean) {
  const { activeShop } = useShop();
  const shopId = activeShop?.id ?? null;

  return useQuery({
    queryKey: shopSettingsQueryKey(shopId),
    queryFn: fetchShopSettings,
    select: (row): ShopAppearanceFormState =>
      parseAppearanceFormDefaults(row.appearance_json),
    enabled: enabled && Boolean(shopId),
    staleTime: 60_000,
  });
}

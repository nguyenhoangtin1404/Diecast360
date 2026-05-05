import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { PublicShopContactResponse } from '../types/shopContactPublic';
import { usePublicShopContext } from './usePublicShopContext';

export const publicShopContactQueryKey = (shopId: string) => ['public-shop-contact', shopId] as const;

/**
 * Public shop contact + appearance (logo, favicon, colors) for the effective catalog shop.
 * Shared query key with ContactPage so layout and /contact reuse cache.
 * @param queryEnabled — set false on admin routes to skip the public API call.
 */
export function usePublicShopContact(queryEnabled = true) {
  const { effectiveShopId, shopContextReady, publicApiShopReady } = usePublicShopContext();

  return useQuery({
    queryKey: publicShopContactQueryKey(effectiveShopId),
    queryFn: async () => {
      const res = await apiClient.get(
        `/public/shops/${encodeURIComponent(effectiveShopId)}/contact`,
      );
      return res.data as PublicShopContactResponse;
    },
    enabled: queryEnabled && shopContextReady && publicApiShopReady && Boolean(effectiveShopId),
    staleTime: 60_000,
  });
}

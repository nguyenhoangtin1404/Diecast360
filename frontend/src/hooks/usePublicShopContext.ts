import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from './useAuth';
import { sanitizeShopIdQueryParam } from '../utils/sanitizeShopId';
import { getPublicCatalogShopIdFromEnv } from '../api/config';

/**
 * Effective public catalog shop id: URL `shop_id` → env default → JWT `active_shop_id`.
 * Query wins over JWT so admin shop switch does not skew a shared public URL.
 *
 * `shopContextReady`: false while auth is loading and shop is not yet known from URL/env —
 * avoids one aggregate catalog fetch before JWT resolves (multi-tenant + logged-in).
 */
export function usePublicShopContext(): {
  effectiveShopId: string;
  queryShopId: string;
  envShopId: string;
  authLoading: boolean;
  /** When false, defer public catalog/detail API calls until auth settles or URL/env fixes shop. */
  shopContextReady: boolean;
} {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const queryShopId = useMemo(
    () => sanitizeShopIdQueryParam(searchParams.get('shop_id')),
    [searchParams],
  );

  const envShopId = useMemo(() => getPublicCatalogShopIdFromEnv(), []);

  const jwtShopId = useMemo(
    () => sanitizeShopIdQueryParam(user?.active_shop_id ?? null),
    [user?.active_shop_id],
  );

  const effectiveShopId = useMemo(
    () => queryShopId || envShopId || jwtShopId || '',
    [queryShopId, envShopId, jwtShopId],
  );

  const hasDeterministicShop = Boolean(queryShopId || envShopId);
  const shopContextReady = hasDeterministicShop || !authLoading;

  return { effectiveShopId, queryShopId, envShopId, authLoading, shopContextReady };
}

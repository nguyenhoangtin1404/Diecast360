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
 * avoids picking a JWT shop before the URL is read.
 * `publicApiShopReady`: true only when there is a concrete shop (query, env default, or JWT);
 * public catalog/detail requests should use this so anonymous users never call `/public/items` without `shop_id`.
 */
export function usePublicShopContext(): {
  effectiveShopId: string;
  queryShopId: string;
  envShopId: string;
  authLoading: boolean;
  /** When false, defer public catalog/detail API calls until auth settles or URL/env fixes shop. */
  shopContextReady: boolean;
  /** When true, `effectiveShopId` is non-empty — safe to call scoped public APIs. */
  publicApiShopReady: boolean;
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
  /** URL or build-time default fixes shop; JWT fallback only after auth settles. */
  const shopContextReady = hasDeterministicShop || !authLoading;

  /** True when we can call public APIs with a concrete shop (never aggregate without scope). */
  const publicApiShopReady = Boolean(effectiveShopId);

  return {
    effectiveShopId,
    queryShopId,
    envShopId,
    authLoading,
    shopContextReady,
    publicApiShopReady,
  };
}

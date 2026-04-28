import React, { useState, useEffect, useCallback, useContext } from 'react';
import { apiClient } from '../api/client';
import { ShopContext } from './ShopContext';
import type { Shop } from './ShopContext';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext';

type MeUser = User & {
  allowed_shops?: Array<{
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    role?: string;
  }>;
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authCtx = useContext(AuthContext);
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  const [allowedShops, setAllowedShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  const switchToShop = useCallback(async (shopId: string) => {
    const response = await apiClient.post('/auth/switch-shop', { shop_id: shopId });
    const data = response?.data || response;
    const shop: Shop = data?.active_shop;
    if (shop) {
      setActiveShop(shop);
    }
  }, []);

  const loadUserShops = useCallback(async () => {
    if (authCtx?.loading) {
      return;
    }
    if (!authCtx?.isAuthenticated) {
      setAllowedShops([]);
      setActiveShop(null);
      return;
    }

    try {
      setLoading(true);
      const meResponse = await apiClient.get('/auth/me');
      const user: MeUser | undefined =
        (meResponse as { data?: { user?: MeUser } })?.data?.user ??
        (meResponse as { user?: MeUser })?.user;

      const raw = user?.allowed_shops ?? [];
      if (raw.length === 0) {
        setAllowedShops([]);
        setActiveShop(null);
        return;
      }

      const userShops: Shop[] = raw.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        is_active: s.is_active,
        role: s.role,
      }));
      // Make selection deterministic to avoid relying on DB ordering.
      const stableUserShops = [...userShops].sort((a, b) => a.id.localeCompare(b.id));
      setAllowedShops(stableUserShops);

      const activeId = user?.active_shop_id ?? null;
      const activeMatch = activeId
        ? stableUserShops.find((s) => s.id === activeId)
        : undefined;

      // For users that have at least one active shop_admin membership:
      // - keep current active shop if it is also an active shop_admin
      // - otherwise switch to a deterministic active shop_admin fallback
      const hasAnyActiveShopAdmin = stableUserShops.some(
        (s) => s.is_active && s.role === 'shop_admin',
      );
      if (hasAnyActiveShopAdmin) {
        const activeShopAdminMatch =
          activeMatch && activeMatch.is_active && activeMatch.role === 'shop_admin'
            ? activeMatch
            : undefined;
        if (activeShopAdminMatch) {
          setActiveShop(activeShopAdminMatch);
          return;
        }

        const fallbackShopAdmin = stableUserShops.find(
          (s) => s.is_active && s.role === 'shop_admin',
        );
        if (fallbackShopAdmin) {
          await switchToShop(fallbackShopAdmin.id);
          return;
        }
      }

      // For super_admin (or users without shop_admin in any active shop):
      // - keep current JWT active shop if it exists
      // - otherwise switch to the first active shop
      if (activeMatch) {
        setActiveShop(activeMatch);
        return;
      }

      const preferredActive = stableUserShops.find((s) => s.is_active) ?? stableUserShops[0];
      if (preferredActive) {
        await switchToShop(preferredActive.id);
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('[ShopContext] loadUserShops failed', e);
      }
    } finally {
      setLoading(false);
    }
  }, [authCtx?.isAuthenticated, authCtx?.loading, switchToShop]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fn; setState happens after awaits, not synchronously
    void loadUserShops();
  }, [loadUserShops]);

  const switchShop = async (shopId: string) => {
    setLoading(true);
    try {
      await switchToShop(shopId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopContext.Provider value={{ activeShop, allowedShops, switchShop, loading }}>
      {children}
    </ShopContext.Provider>
  );
};

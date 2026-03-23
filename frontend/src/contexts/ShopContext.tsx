import React, { useState, useEffect, useCallback, useContext } from 'react';
import { apiClient } from '../api/client';
import { ShopContext } from './ShopContext';
import type { Shop } from './ShopContext';
import { AuthContext } from './AuthContext';

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authCtx = useContext(AuthContext);
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  const [allowedShops, setAllowedShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Load the list of shops the current user has access to.
   * Uses GET /auth/me which returns allowed_shop_ids after our auth changes.
   * Then fetches /admin/shops (only accessible to super_admin) or derives from
   * the allowed_shop_ids in the JWT payload.
   *
   * Simplified approach: after login we call /admin/shops and filter
   * by user's shop roles returned from /auth/me.
   */
  const loadUserShops = useCallback(async () => {
    if (!authCtx?.isAuthenticated) {
      setAllowedShops([]);
      setActiveShop(null);
      return;
    }

    try {
      setLoading(true);
      // Fetch user info including allowed shop IDs from /auth/me
      const meResponse = await apiClient.get<{ user: { id: string; allowed_shop_ids?: string[] } }>('/auth/me') as any;
      const user = meResponse?.data?.user || meResponse?.user;
      const shopIds: string[] = user?.allowed_shop_ids || [];

      if (shopIds.length === 0) {
        setAllowedShops([]);
        setActiveShop(null);
        return;
      }

      // Fetch details of each shop
      const shopsResponse = await apiClient.get('/admin/shops') as any;
      const allShops: Shop[] = shopsResponse?.data || shopsResponse || [];

      // Filter to only shops this user has access to
      const userShops = allShops.filter((s: Shop) => shopIds.includes(s.id));
      setAllowedShops(userShops);

      // Use first shop as default if no active shop is set
      if (userShops.length > 0 && !activeShop) {
        // Auto-switch to the first shop to obtain active_shop_id in cookie
        await switchToShop(userShops[0].id);
      }
    } catch {
      // Failed silently — shop context unavailable
    } finally {
      setLoading(false);
    }
  }, [authCtx?.isAuthenticated]);

  useEffect(() => {
    loadUserShops();
  }, [loadUserShops]);

  const switchToShop = async (shopId: string) => {
    const response = await apiClient.post('/auth/switch-shop', { shop_id: shopId }) as any;
    const data = response?.data || response;
    const shop: Shop = data?.active_shop;
    if (shop) {
      setActiveShop(shop);
    }
  };

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

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
};

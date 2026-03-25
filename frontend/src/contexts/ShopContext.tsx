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
      const meResponse = await apiClient.get<{ ok?: boolean; data: { user: MeUser } }>('/auth/me');
      const user: MeUser | undefined = meResponse?.data?.user;

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
      setAllowedShops(userShops);

      const activeId = user?.active_shop_id ?? null;
      const match = activeId ? userShops.find((s) => s.id === activeId) : undefined;
      if (match) {
        setActiveShop(match);
      } else {
        await switchToShop(userShops[0].id);
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

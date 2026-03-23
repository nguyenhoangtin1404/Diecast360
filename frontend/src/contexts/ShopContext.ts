import { createContext } from 'react';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  role?: string;
}

export interface ShopContextType {
  activeShop: Shop | null;
  allowedShops: Shop[];
  switchShop: (shopId: string) => Promise<void>;
  loading: boolean;
}

export const ShopContext = createContext<ShopContextType | undefined>(undefined);

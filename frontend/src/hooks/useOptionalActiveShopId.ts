import { useContext } from 'react';
import { ShopContext } from '../contexts/ShopContext';

/** Same as useShop when inside ShopProvider; returns null when outside (e.g. unit tests). */
export function useOptionalActiveShopId(): string | null {
  const ctx = useContext(ShopContext);
  return ctx?.activeShop?.id ?? null;
}

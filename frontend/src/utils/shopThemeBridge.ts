export const SHOP_APPEARANCE_UPDATED_EVENT = 'shop-appearance-updated';

/** Optional: dispatch when theme consumers cannot use React Query invalidation alone. */
export function notifyShopAppearanceUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SHOP_APPEARANCE_UPDATED_EVENT));
}

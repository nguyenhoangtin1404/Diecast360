import { API_CONFIG } from '../config/api';
import { sanitizeShopIdQueryParam } from '../utils/sanitizeShopId';

/** Build-time default for public catalog scope (see `VITE_PUBLIC_CATALOG_SHOP_ID`). */
export function getPublicCatalogShopIdFromEnv(): string {
  return sanitizeShopIdQueryParam(API_CONFIG.PUBLIC_CATALOG_SHOP_ID);
}

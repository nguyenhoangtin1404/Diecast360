/**
 * Centralized API configuration
 */
function resolveDefaultApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return '/api/v1';
}

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const baseUrl = !configuredBaseUrl || configuredBaseUrl.toLowerCase() === 'auto'
  ? resolveDefaultApiBaseUrl()
  : configuredBaseUrl;

export const API_CONFIG = {
  BASE_URL: baseUrl,
  ADMIN_SEMANTIC_SEARCH_ENABLED: String(import.meta.env.VITE_ADMIN_SEMANTIC_SEARCH_ENABLED || 'false').toLowerCase() === 'true',
  PUBLIC_PREORDER_SHOP_ID: import.meta.env.VITE_PUBLIC_PREORDER_SHOP_ID || '',
  /** Default shop for public catalog when visitor has no ?shop_id= (single-tenant deploys). */
  PUBLIC_CATALOG_SHOP_ID: import.meta.env.VITE_PUBLIC_CATALOG_SHOP_ID || '',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

export type ApiConfig = typeof API_CONFIG;

// Re-export BASE_URL for convenience
export const API_BASE_URL = API_CONFIG.BASE_URL;

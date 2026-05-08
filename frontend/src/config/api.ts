/**
 * Centralized API configuration
 */
function resolveDefaultApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return '/api/v1';
}

/**
 * Ensures absolute production URLs include `/api/v1` (Nest global prefix).
 * Without this, setting `VITE_API_BASE_URL=https://api.example.com` makes Axios
 * call `https://api.example.com/auth/me` → 404 instead of `/api/v1/auth/me`.
 */
export function normalizeConfiguredApiBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === 'auto') {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    const noTrail = trimmed.replace(/\/+$/, '');
    return noTrail || '/api/v1';
  }
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/+$/, '') || '';
    if (path === '' || path === '/') {
      return `${u.origin}/api/v1`;
    }
    if (path === '/api/v1' || path.endsWith('/api/v1')) {
      return `${u.origin}${path}`;
    }
    return trimmed.replace(/\/+$/, '');
  } catch {
    return trimmed;
  }
}

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const baseUrl =
  !configuredBaseUrl || configuredBaseUrl.toLowerCase() === 'auto'
    ? resolveDefaultApiBaseUrl()
    : normalizeConfiguredApiBaseUrl(configuredBaseUrl);

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

/**
 * Centralized API configuration
 */
function resolveDefaultApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:3000/api/v1`;
  }
  return 'http://localhost:3000/api/v1';
}

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const baseUrl = !configuredBaseUrl || configuredBaseUrl.toLowerCase() === 'auto'
  ? resolveDefaultApiBaseUrl()
  : configuredBaseUrl;

export const API_CONFIG = {
  BASE_URL: baseUrl,
  ADMIN_SEMANTIC_SEARCH_ENABLED: String(import.meta.env.VITE_ADMIN_SEMANTIC_SEARCH_ENABLED || 'false').toLowerCase() === 'true',
  PUBLIC_PREORDER_SHOP_ID: import.meta.env.VITE_PUBLIC_PREORDER_SHOP_ID || '',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

export type ApiConfig = typeof API_CONFIG;

// Re-export BASE_URL for convenience
export const API_BASE_URL = API_CONFIG.BASE_URL;

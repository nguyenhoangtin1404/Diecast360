/**
 * Centralized API configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  ADMIN_SEMANTIC_SEARCH_ENABLED: String(import.meta.env.VITE_ADMIN_SEMANTIC_SEARCH_ENABLED || 'false').toLowerCase() === 'true',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

export type ApiConfig = typeof API_CONFIG;

// Re-export BASE_URL for convenience
export const API_BASE_URL = API_CONFIG.BASE_URL;

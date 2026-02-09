/**
 * Shared item type definitions
 * Centralized to avoid duplication across components
 */

/**
 * Base item interface with common properties used across the application
 */
export interface BaseItem {
  id: string;
  name: string;
  status: string;
  car_brand?: string;
  model_brand?: string;
  condition?: string;
  price?: number;
  cover_image_url?: string | null;
  has_spinner?: boolean;
  original_price?: number | null;
}

/**
 * Public item for catalog display
 */
export type PublicItem = BaseItem;

/**
 * Related item for recommendation sections
 */
export type RelatedItem = BaseItem;

/**
 * Filter item for extracting unique filter values
 */
export interface FilterItem {
  car_brand?: string;
  model_brand?: string;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Item form data for creating/editing items
 */
export interface ItemFormData {
  name: string;
  brand: string;
  car_brand: string;
  model_brand: string;
  scale: string;
  condition: string;
  price: number;
  status: string;
  is_public: boolean;
  description: string;
}

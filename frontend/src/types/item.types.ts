/**
 * Shared item type definitions
 * Centralized to avoid duplication across components
 */

/**
 * Base item interface with common properties used across the application
 */
/** Flat custom attributes from API (issue #57) */
export type ItemAttributesPayload = Record<string, string | number | boolean | null>;

export interface BaseItem {
  id: string;
  name: string;
  status: 'con_hang' | 'giu_cho' | 'da_ban';
  car_brand?: string;
  model_brand?: string;
  condition?: string;
  price?: number;
  cover_image_url?: string | null;
  has_spinner?: boolean;
  original_price?: number | null;
  /** Inventory count (≥ 0); sold items are 0 on server */
  quantity?: number;
  /** Optional key-value metadata */
  attributes?: ItemAttributesPayload;
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
  quantity?: number;
  attributes?: ItemAttributesPayload;
}

/**
 * Admin item with all management fields
 */
export interface AdminItem extends BaseItem {
  is_public: boolean;
  fb_post_content?: string | null;
  /** Computed from latest facebook_posts[0] in list API */
  fb_post_url?: string | null;
  fb_posted_at?: string | null;
  fb_posts_count?: number;
  /** Full list from detail API */
  facebook_posts?: FacebookPost[];
}

/**
 * A Facebook post record linked to an item
 */
export interface FacebookPost {
  id: string;
  item_id: string;
  post_url: string;
  content?: string | null;
  posted_at: string;
  created_at: string;
}

/**
 * Pagination metadata from API responses
 */
export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/**
 * Paginated items API response
 */
export interface ItemsResponse {
  items: AdminItem[];
  pagination: Pagination;
}


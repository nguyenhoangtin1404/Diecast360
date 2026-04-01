/**
 * Centralized type definitions for backend services
 * Using Prisma types where possible for consistency
 */

import { Prisma } from '../../generated/prisma/client';

/**
 * Item with relations from Prisma query
 */
export type ItemWithImages = Prisma.ItemGetPayload<{
  include: {
    item_images: true;
    spin_sets: {
      include: {
        frames: true;
      };
    };
  };
}>;

export type ItemWithCoverImage = Prisma.ItemGetPayload<{
  include: {
    item_images: {
      where: { is_cover: true };
      take: 1;
    };
    spin_sets: {
      where: { is_default: true };
      take: 1;
    };
  };
}>;

/**
 * Item for vector store sync
 */
export interface VectorSyncItem {
  id: string;
  name: string;
  description?: string | null;
  brand?: string | null;
  car_brand?: string | null;
  scale: string;
  condition?: string | null;
  is_public: boolean;
  deleted_at?: Date | null;
}

/**
 * Mapped item response with computed fields
 */
export interface ItemResponseDto {
  id: string;
  name: string;
  description?: string | null;
  scale: string;
  brand?: string | null;
  car_brand?: string | null;
  model_brand?: string | null;
  condition?: string | null;
  price?: number | null;
  original_price?: number | null;
  status: string;
  quantity: number;
  /** Flat key-value metadata; same shape as validated `ItemAttributesInput` on write. */
  attributes: Record<string, string | number | boolean | null>;
  is_public: boolean;
  cover_image_url?: string | null;
  has_default_spin_set?: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Image response DTO
 */
export interface ImageResponseDto {
  id: string;
  item_id: string;
  url: string;
  thumbnail_url: string | null;
  is_cover: boolean;
  display_order: number;
  created_at: Date;
}

/**
 * Spin set response DTO
 */
export interface SpinSetResponseDto {
  id: string;
  item_id: string;
  label: string;
  is_default: boolean;
  frames: SpinFrameResponseDto[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Spin frame response DTO
 */
export interface SpinFrameResponseDto {
  id: string;
  spin_set_id: string;
  frame_index: number;
  image_url: string;
  thumbnail_url: string | null;
  created_at: Date;
}

/**
 * CSV field value type
 */
export type CsvFieldValue = string | number | boolean | Date | null | undefined | { toNumber: () => number };

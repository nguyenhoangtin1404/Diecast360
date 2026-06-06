import type { ItemStatus } from "../../../constants/item";

export interface AttributeRow {
  id: string;
  key: string;
  value: string;
}

export interface SpinFrame {
  id: string;
  spin_set_id: string;
  frame_index: number;
  image_url: string;
  thumbnail_url?: string | null;
  created_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  url: string;
  thumbnail_url: string | null;
  is_cover: boolean;
  display_order: number;
  created_at: string;
}

export interface SpinSet {
  id: string;
  item_id: string;
  label: string | null;
  is_default: boolean;
  frames: SpinFrame[];
  created_at: string;
  updated_at: string;
}

export interface CampaignSummary {
  pending: number;
  waiting: number;
  arrived: number;
  total: number;
  cancelable: number;
  with_deposit: number;
}

export interface UpdateItemResponse {
  item: Record<string, unknown>;
  preorders_arrived_count?: number;
  preorders_pending_count?: number;
  preorders_auto_cancelled_count?: number;
  preorders_with_deposit_count?: number;
}

export interface ItemData {
  name: string;
  description?: string;
  status?: ItemStatus;
  is_public?: boolean;
  car_brand?: string;
  model_brand?: string;
  condition?: "new" | "old";
  scale?: string;
  brand?: string;
  price?: number;
  original_price?: number;
  quantity?: number;
  attributes?: Record<string, string | number | boolean | null>;
  preorder_closes_at?: string | null;
  preorder_price?: number | null;
}

export interface ItemResponse {
  item: {
    id: string;
    preorder_closes_at?: string | null;
    preorder_price?: number | null;
    [key: string]: unknown;
  };
}

export interface AiDescriptionResponse {
  short_description: string;
  long_description: string;
  bullet_specs: string[];
  meta_title: string;
  meta_description: string;
}

export interface SavePayload {
  itemData: ItemData;
  silent?: boolean;
  navigateAfterCreate?: boolean;
}

export interface QrData {
  token: string;
  resolve_url: string;
  image_data_url: string;
}

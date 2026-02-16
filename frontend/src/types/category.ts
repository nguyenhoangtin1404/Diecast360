export interface CategoryItem {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiError {
  message?: string;
  response?: { data?: { message?: string } };
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message: string;
}

export type CategoryType = 'car_brand' | 'model_brand';

import { apiClient } from './client';
import type { ApiResponse } from '../types/category';
import type {
  AdminPreOrder,
  Pagination,
  ParticipantResponse,
  PreOrderCard,
  PreOrderStatus,
} from '../types/preorder';

interface AdminListResponse {
  preorders: AdminPreOrder[];
  pagination: Pagination;
}

interface CardListResponse {
  cards: PreOrderCard[];
  pagination: Pagination;
}

export const fetchAdminPreorders = async (
  status?: PreOrderStatus,
  options?: { page?: number; pageSize?: number },
) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (options?.page != null) params.set('page', String(options.page));
  if (options?.pageSize != null) params.set('page_size', String(options.pageSize));
  const response = (await apiClient.get(`/preorders/admin?${params.toString()}`)) as ApiResponse<AdminListResponse>;
  return response.data;
};

export const fetchPublicPreorders = async (shopId: string) => {
  const params = new URLSearchParams({ shop_id: shopId });
  const response = (await apiClient.get(`/preorders/public?${params.toString()}`)) as ApiResponse<CardListResponse>;
  return response.data;
};

export const fetchMyOrders = async () => {
  const response = (await apiClient.get('/preorders/my-orders')) as ApiResponse<CardListResponse>;
  return response.data;
};

export const transitionPreorderStatus = async (id: string, status: PreOrderStatus) => {
  const response = (await apiClient.patch(`/preorders/${id}/status`, { status })) as ApiResponse<{
    preorder: AdminPreOrder;
  }>;
  return response.data.preorder;
};

export const createPreorder = async (payload: {
  item_id: string;
  quantity: number;
  unit_price?: number;
  deposit_amount?: number;
  paid_amount?: number;
  expected_arrival_at?: string;
  expected_delivery_at?: string;
  note?: string;
  cover_image_url?: string;
}) => {
  const response = (await apiClient.post('/preorders', payload)) as ApiResponse<{ preorder: AdminPreOrder }>;
  return response.data.preorder;
};

export const fetchCampaignParticipants = async (itemId: string) => {
  const response = (await apiClient.get(`/preorders/admin/campaigns/${itemId}/participants`)) as ApiResponse<ParticipantResponse>;
  return response.data;
};


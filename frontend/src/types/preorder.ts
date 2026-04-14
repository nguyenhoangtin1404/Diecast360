export type PreOrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'WAITING_FOR_GOODS'
  | 'ARRIVED'
  | 'PAID'
  | 'CANCELLED';

export interface PreOrderCard {
  id: string;
  status: PreOrderStatus;
  quantity: number;
  display_price: number;
  deposit_amount: number;
  countdown_target: string | null;
  title: string;
  short_specs: string;
  cover_image_url: string | null;
}

export interface AdminPreOrder {
  id: string;
  status: PreOrderStatus;
  quantity: number;
  unit_price: number | null;
  total_amount: number | null;
  deposit_amount: number;
  paid_amount: number;
  note: string | null;
  expected_arrival_at: string | null;
  expected_delivery_at: string | null;
  item_id: string;
  item?: {
    name: string;
  };
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface Pagination {
  page: number;
  page_size: number;
  total?: number;
  total_pages?: number;
}

export interface Participant {
  preorder_id: string;
  status: PreOrderStatus;
  quantity: number;
  deposit_amount: number;
  paid_amount: number;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface ParticipantResponse {
  participants: Participant[];
  pagination: Pagination;
}


import type { PreOrderStatus } from './preorder';

export type PreorderReceiptPayload = {
  shop: {
    name: string;
    phone_label?: string;
    phone_tel?: string;
    address?: string;
    logo_url?: string;
  };
  preorder: {
    id: string;
    status: PreOrderStatus;
    quantity: number;
    unit_price: number | null;
    total_amount: number | null;
    deposit_amount: number;
    paid_amount: number;
    remaining_amount: number | null;
    /** null = chưa có nghiệp vụ chiết khấu — dòng sẽ ẩn trên phiếu */
    discount_amount: number | null;
    note: string | null;
    created_at: string;
    item: { name: string };
    member: {
      id: string;
      full_name: string;
      phone: string | null;
      address: string | null;
    } | null;
    user: {
      id: string;
      full_name: string | null;
      email: string | null;
    } | null;
  };
};

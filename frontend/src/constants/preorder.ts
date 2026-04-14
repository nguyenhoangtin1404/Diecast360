import type { PreOrderStatus } from '../types/preorder';

export const PREORDER_STATUS_LABELS: Record<PreOrderStatus, string> = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  WAITING_FOR_GOODS: 'Chờ hàng về',
  ARRIVED: 'Đã về hàng',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
};


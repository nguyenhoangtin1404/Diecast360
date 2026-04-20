import type { PreOrderStatus } from '../../../types/preorder';

/**
 * Các nút chuyển trạng thái trên admin — phải khớp ma trận backend
 * `PREORDER_STATUS_TRANSITIONS` trong `backend/src/preorders/domain/preorder-transition.ts`.
 */
export const PREORDER_STATUS_COLORS: Record<PreOrderStatus, string> = {
  PENDING_CONFIRMATION: '#fef3c7',
  WAITING_FOR_GOODS: '#dbeafe',
  ARRIVED: '#dcfce7',
  PAID: '#c7d2fe',
  CANCELLED: '#fecaca',
};

export const PREORDER_TRANSITIONS: Record<PreOrderStatus, PreOrderStatus[]> = {
  PENDING_CONFIRMATION: ['WAITING_FOR_GOODS', 'CANCELLED'],
  WAITING_FOR_GOODS: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

import type { PreOrderStatus } from '../../../types/preorder';
import { PREORDER_STATUS_LABELS } from '../../../constants/preorder';

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

export { PREORDER_STATUS_LABELS };


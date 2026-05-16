export const PREORDER_STATUSES = [
  'PENDING_CONFIRMATION',
  'WAITING_FOR_GOODS',
  'ARRIVED',
  'PAID',
  'REFUNDED',
  'CANCELLED',
] as const;

export type PreOrderStatus = (typeof PREORDER_STATUSES)[number];

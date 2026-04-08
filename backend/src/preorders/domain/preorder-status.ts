export const PREORDER_STATUSES = [
  'PENDING_CONFIRMATION',
  'WAITING_FOR_GOODS',
  'ARRIVED',
  'PAID',
  'CANCELLED',
] as const;

export type PreOrderStatus = (typeof PREORDER_STATUSES)[number];

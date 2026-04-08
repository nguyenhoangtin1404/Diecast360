import { PreOrderStatus } from './preorder-status';

export const PREORDER_STATUS_TRANSITIONS: Record<PreOrderStatus, ReadonlyArray<PreOrderStatus>> = {
  cho_xac_nhan: ['cho_xac_nhan', 'dang_cho_hang', 'da_huy'],
  dang_cho_hang: ['dang_cho_hang', 'da_ve', 'da_huy'],
  da_ve: ['da_ve', 'da_thanh_toan', 'da_huy'],
  da_thanh_toan: ['da_thanh_toan'],
  da_huy: ['da_huy'],
};

export function canTransitionPreOrderStatus(from: PreOrderStatus, to: PreOrderStatus): boolean {
  return PREORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function assertValidPreOrderStatusTransition(from: PreOrderStatus, to: PreOrderStatus): void {
  if (!canTransitionPreOrderStatus(from, to)) {
    throw new Error(`Invalid pre-order status transition from "${from}" to "${to}"`);
  }
}

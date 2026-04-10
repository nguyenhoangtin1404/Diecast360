import { PreOrderStatus } from './preorder-status';
import { PreOrderDomainException } from './preorder-domain.exception';

export const PREORDER_STATUS_TRANSITIONS: Record<PreOrderStatus, ReadonlyArray<PreOrderStatus>> = {
  PENDING_CONFIRMATION: ['WAITING_FOR_GOODS', 'CANCELLED'],
  WAITING_FOR_GOODS: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

export function canTransitionPreOrderStatus(from: PreOrderStatus, to: PreOrderStatus): boolean {
  if (from === to) {
    return false;
  }
  return PREORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function assertValidPreOrderStatusTransition(from: PreOrderStatus, to: PreOrderStatus): void {
  if (from === to) {
    throw new PreOrderDomainException(`No-op pre-order status transition is not allowed: "${from}"`);
  }

  if (!canTransitionPreOrderStatus(from, to)) {
    throw new PreOrderDomainException(`Invalid pre-order status transition from "${from}" to "${to}"`);
  }
}
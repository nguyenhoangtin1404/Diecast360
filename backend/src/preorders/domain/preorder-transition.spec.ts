import {
  PREORDER_STATUS_TRANSITIONS,
  assertValidPreOrderStatusTransition,
  canTransitionPreOrderStatus,
} from './preorder-transition';
import { PREORDER_STATUSES } from './preorder-status';
import type { PreOrderStatus } from './preorder-status';
import { PreOrderDomainException } from './preorder-domain.exception';

describe('pre-order status transitions', () => {
  it('allows all configured transitions', () => {
    for (const [from, toStates] of Object.entries(PREORDER_STATUS_TRANSITIONS)) {
      for (const to of toStates) {
        expect(canTransitionPreOrderStatus(from as PreOrderStatus, to)).toBe(true);
      }
    }
  });

  it('rejects same-status transition as no-op', () => {
    expect(canTransitionPreOrderStatus('PENDING_CONFIRMATION', 'PENDING_CONFIRMATION')).toBe(false);
    expect(() =>
      assertValidPreOrderStatusTransition('PENDING_CONFIRMATION', 'PENDING_CONFIRMATION'),
    ).toThrow(PreOrderDomainException);
  });

  it('rejects invalid transitions exhaustively', () => {
    for (const from of PREORDER_STATUSES) {
      for (const to of PREORDER_STATUSES) {
        const expected = PREORDER_STATUS_TRANSITIONS[from].includes(to) && from !== to;
        expect(canTransitionPreOrderStatus(from, to)).toBe(expected);
      }
    }
  });

  it('treats PAID as terminal state', () => {
    const nonSelf = PREORDER_STATUSES.filter((status) => status !== 'PAID');
    nonSelf.forEach((status) => {
      expect(canTransitionPreOrderStatus('PAID', status)).toBe(false);
    });
  });

  it('treats CANCELLED as terminal state', () => {
    const nonSelf = PREORDER_STATUSES.filter((status) => status !== 'CANCELLED');
    nonSelf.forEach((status) => {
      expect(canTransitionPreOrderStatus('CANCELLED', status)).toBe(false);
    });
  });
});

import {
  PREORDER_STATUS_TRANSITIONS,
  assertValidPreOrderStatusTransition,
  canTransitionPreOrderStatus,
} from './preorder-transition';
import { PreOrderStatus } from './preorder-status';

describe('pre-order status transitions', () => {
  it('allows all configured transitions', () => {
    for (const [from, toStates] of Object.entries(PREORDER_STATUS_TRANSITIONS)) {
      for (const to of toStates) {
        expect(canTransitionPreOrderStatus(from as PreOrderStatus, to)).toBe(true);
      }
    }
  });

  it('rejects transition from paid back to waiting', () => {
    expect(canTransitionPreOrderStatus('da_thanh_toan', 'dang_cho_hang')).toBe(false);
    expect(() => assertValidPreOrderStatusTransition('da_thanh_toan', 'dang_cho_hang')).toThrow(
      'Invalid pre-order status transition from "da_thanh_toan" to "dang_cho_hang"',
    );
  });

  it('rejects transition from cancelled to arrived', () => {
    expect(canTransitionPreOrderStatus('da_huy', 'da_ve')).toBe(false);
    expect(() => assertValidPreOrderStatusTransition('da_huy', 'da_ve')).toThrow(
      'Invalid pre-order status transition from "da_huy" to "da_ve"',
    );
  });
});

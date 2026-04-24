import { AppException } from '../../common/exceptions/http-exception.filter';
import { applyPointsMutation } from './points-rule.engine';

describe('applyPointsMutation', () => {
  it('adds points for earn', () => {
    expect(applyPointsMutation({ currentBalance: 10, type: 'earn', points: 5 })).toEqual({
      delta: 5,
      nextBalance: 15,
    });
  });

  it('subtracts points for redeem', () => {
    expect(applyPointsMutation({ currentBalance: 10, type: 'redeem', points: 4 })).toEqual({
      delta: -4,
      nextBalance: 6,
    });
  });

  it('prevents negative balances', () => {
    expect(() => applyPointsMutation({ currentBalance: 3, type: 'redeem', points: 4 })).toThrow(
      AppException,
    );
  });

  it('supports signed adjust', () => {
    expect(applyPointsMutation({ currentBalance: 10, type: 'adjust', points: -3 })).toEqual({
      delta: -3,
      nextBalance: 7,
    });
  });
});

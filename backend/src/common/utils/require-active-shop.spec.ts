import { requireActiveShopId } from './require-active-shop';
import { AppException } from '../exceptions/http-exception.filter';
import { ErrorCode } from '../exceptions/http-exception.filter';

describe('requireActiveShopId', () => {
  it('returns trimmed shop id for a valid string', () => {
    expect(requireActiveShopId('  shop-abc  ')).toBe('shop-abc');
  });

  it('throws AUTH_FORBIDDEN when tenantId is undefined', () => {
    expect(() => requireActiveShopId(undefined)).toThrow(AppException);
    expect(() => requireActiveShopId(undefined)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.AUTH_FORBIDDEN }),
    );
  });

  it('throws AUTH_FORBIDDEN when tenantId is an empty string', () => {
    expect(() => requireActiveShopId('')).toThrow(AppException);
    expect(() => requireActiveShopId('  ')).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.AUTH_FORBIDDEN }),
    );
  });
});

import { AppException, ErrorCode } from '../exceptions/http-exception.filter';

export function requireActiveShopId(tenantId: string | undefined | null): string {
  if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    throw new AppException(
      ErrorCode.AUTH_FORBIDDEN,
      'Active shop context is required for this operation.',
    );
  }
  return tenantId.trim();
}

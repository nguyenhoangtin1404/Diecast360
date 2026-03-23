import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentTenantId() — extracts tenantId from request.tenantId
 * Requires TenantGuard to be applied first.
 */
export const CurrentTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId as string;
  },
);

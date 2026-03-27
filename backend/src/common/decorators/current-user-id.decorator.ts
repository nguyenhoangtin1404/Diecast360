import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithUser = {
  user?: {
    id?: string | null;
  } | null;
};

/**
 * @CurrentUserId() — extracts authenticated user id from request.user.
 * Returns null when unauthenticated or id is missing.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.id ?? null;
  },
);


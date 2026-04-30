import { SetMetadata } from '@nestjs/common';

/**
 * Escape-hatch decorator for shop_staff write access.
 *
 * By default, RolesGuard denies all mutating HTTP methods (POST/PATCH/DELETE/PUT)
 * for shop_staff users (Option C enforcement). Apply @AllowStaffWrite() to a
 * specific route handler to override this and grant staff full access to that route.
 *
 * Example:
 *   @Patch('profile')
 *   @AllowStaffWrite()
 *   updateOwnProfile(...) { ... }
 */
export const ALLOW_STAFF_WRITE_KEY = 'allow_staff_write';
export const AllowStaffWrite = () => SetMetadata(ALLOW_STAFF_WRITE_KEY, true);

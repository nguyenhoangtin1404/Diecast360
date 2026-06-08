/** True when the active shop membership is read-only (shop_staff). */
export function isShopStaffReadOnly(role?: string | null): boolean {
  return role === 'shop_staff';
}

export const SHOP_STAFF_READONLY_TOOLTIP = 'Chế độ chỉ xem';

export const SHOP_STAFF_READONLY_BANNER_TEXT =
  'Chế độ chỉ xem — tài khoản nhân viên không thể thay đổi dữ liệu';

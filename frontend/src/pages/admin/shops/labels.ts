import type { ShopAuditLogRow } from './types';

export function shopRoleLabel(role: string): string {
  switch (role) {
    case 'shop_admin': return 'Quản trị shop';
    case 'shop_staff': return 'Nhân viên shop';
    case 'super_admin': return 'Super admin';
    default: return role;
  }
}

export function shopAuditActionLabel(action: ShopAuditLogRow['action']): string {
  switch (action) {
    case 'add_shop_admin': return 'Thêm quản trị shop';
    case 'reset_member_password': return 'Reset mật khẩu';
    case 'set_member_active': return 'Khóa/Mở khóa tài khoản';
    case 'update_shop': return 'Cập nhật shop';
    case 'deactivate_shop': return 'Tắt shop';
    case 'activate_shop': return 'Mở lại shop';
    case 'set_platform_role': return 'Gán quyền platform';
    case 'set_shop_member_role': return 'Phân quyền thành viên shop';
    default: return action;
  }
}

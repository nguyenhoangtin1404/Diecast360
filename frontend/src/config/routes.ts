/**
 * Path ứng dụng — giữ khớp với route trong `App.tsx`.
 */
export const ROUTES = {
  home: '/',
  contact: '/contact',
  preorders: '/preorders',
  myOrders: '/my-orders',
  adminLogin: '/admin/login',
  admin: {
    items: '/admin/items',
    itemsImport: '/admin/items/import',
    categories: '/admin/categories',
    preorders: '/admin/preorders',
    preordersCreate: '/admin/preorders/create',
    preordersManage: '/admin/preorders/manage',
    facebookPosts: '/admin/facebook-posts',
    shops: '/admin/shops',
  },
} as const;

/** Danh sách / chi tiết / mới — không gồm trang import AI */
export function isAdminItemsSectionActive(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.items) && !pathname.startsWith(ROUTES.admin.itemsImport);
}

export function isAdminItemsImportActive(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.itemsImport);
}

export function isAdminPreordersHubActive(pathname: string): boolean {
  return pathname === ROUTES.admin.preorders;
}

export function isAdminPreordersCreateActive(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.preordersCreate);
}

export function isAdminPreordersManageActive(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.preordersManage);
}

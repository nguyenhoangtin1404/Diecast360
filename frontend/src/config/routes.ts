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
    reports: '/admin/reports',
    members: '/admin/members',
    preorders: '/admin/preorders',
    preordersCreate: '/admin/preorders/create',
    preordersManage: '/admin/preorders/manage',
    facebookPosts: '/admin/facebook-posts',
    shops: '/admin/shops',
    /** Contact + branding (tenant); shop_admin / shop_staff */
    shopSettings: '/admin/shop-settings',
  },
} as const;

/**
 * Pathnames where `PublicShopMainGate` must not wait for catalog-scoped
 * `GET /public/shops/:shopId/contact` (shop comes from env/JWT or other rules).
 * When adding a new public route that is not catalog-scoped, append its base path here.
 */
const PUBLIC_PATHS_WITHOUT_CATALOG_CONTACT: readonly string[] = [ROUTES.preorders, ROUTES.myOrders];

/**
 * True for public pages that use `usePublicShopContext` + public shop contact for branding.
 */
export function publicRouteNeedsCatalogShopContact(pathname: string): boolean {
  return !PUBLIC_PATHS_WITHOUT_CATALOG_CONTACT.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

export function isAdminShopSettingsActive(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.shopSettings);
}

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

export function isAdminReportsActive(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.reports);
}

export function isAdminMembersActive(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.members);
}

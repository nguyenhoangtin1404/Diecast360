/**
 * E2E: Phase 15 RBAC smoke tests
 *
 * Covers:
 * 1. Platform user (platform_role = platform_super) sees "Quản lý shop" nav
 * 2. Regular shop_admin does NOT see "Quản lý shop" nav
 * 3. AddMemberModal renders role picker with shop_admin and shop_staff options
 * 4. Role picker defaults to shop_admin
 * 5. Role picker can be changed to shop_staff
 * 6. shop_staff sees read-only banner and mutation buttons hidden on items list
 * 7. shop_staff is redirected from /admin/items/new and /admin/items/import
 */
import { test, expect, apiOk, authMePayload, stubAuthCsrf, type Route } from './fixtures';
import type { MockUser, MockShop } from './fixtures';

// ---------------------------------------------------------------------------
// Mock payloads
// ---------------------------------------------------------------------------

const PLATFORM_SHOP: MockShop = {
  id: 'shop-platform',
  name: 'Platform Shop',
  slug: 'platform-shop',
  is_active: true,
  role: 'shop_admin',
};

const PLATFORM_USER: MockUser & { platform_role: string } = {
  id: 'u-platform',
  email: 'platform@example.com',
  full_name: 'Platform Super',
  role: 'admin',
  platform_role: 'platform_super',
  active_shop_id: 'shop-platform',
  allowed_shop_ids: ['shop-platform'],
  allowed_shops: [PLATFORM_SHOP],
};

const SHOP_ADMIN_USER: MockUser = {
  id: 'u-shop-admin',
  email: 'shopadmin@example.com',
  full_name: 'Shop Admin',
  role: 'admin',
  active_shop_id: 'shop-platform',
  allowed_shop_ids: ['shop-platform'],
  allowed_shops: [PLATFORM_SHOP],
};

const SHOP_STAFF_SHOP: MockShop = {
  id: 'shop-staff',
  name: 'Staff Shop',
  slug: 'staff-shop',
  is_active: true,
  role: 'shop_staff',
};

const SHOP_STAFF_USER: MockUser = {
  id: 'u-shop-staff',
  email: 'staff@example.com',
  full_name: 'Shop Staff',
  role: 'admin',
  active_shop_id: 'shop-staff',
  allowed_shop_ids: ['shop-staff'],
  allowed_shops: [SHOP_STAFF_SHOP],
};

function mockShopsList(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/admin/shops', (route: Route) =>
    route.fulfill({
      json: apiOk([
        {
          id: 'shop-platform',
          name: 'Platform Shop',
          slug: 'platform-shop',
          is_active: true,
          _count: { items: 3, user_roles: 2 },
        },
      ]),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('RBAC — platform role capability gate', () => {
  test('platform_super user sees "Quản lý shop" nav link', async ({ page }) => {
    await stubAuthCsrf(page);
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload(PLATFORM_USER as unknown as MockUser) }),
    );
    await page.route('**/api/v1/reports/**', (route: Route) =>
      route.fulfill({ json: apiOk({ total_items: 0, total_revenue: 0, items_by_status: [], revenue_trend: [] }) }),
    );

    await page.goto('/admin/reports');

    await expect(page.getByRole('link', { name: /Quản lý shop/i })).toBeVisible();
  });

  test('shop_admin user (no platform_role) does NOT see "Quản lý shop" nav link', async ({ page }) => {
    await stubAuthCsrf(page);
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload(SHOP_ADMIN_USER) }),
    );
    await page.route('**/api/v1/reports/**', (route: Route) =>
      route.fulfill({ json: apiOk({ total_items: 0, total_revenue: 0, items_by_status: [], revenue_trend: [] }) }),
    );

    await page.goto('/admin/reports');

    await expect(page.getByRole('link', { name: /Quản lý shop/i })).not.toBeVisible();
  });
});

test.describe('RBAC — AddMemberModal role picker', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthCsrf(page);
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload(PLATFORM_USER as unknown as MockUser) }),
    );
    await mockShopsList(page);
    await page.route('**/api/v1/admin/shops/*/members', (route: Route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          json: apiOk({ members: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } }),
        });
      }
      return route.fulfill({ json: apiOk({ user_id: 'new-u', shop_id: 'shop-platform', role: 'shop_staff' }) });
    });
    await page.route('**/api/v1/admin/shops/*/items**', (route: Route) =>
      route.fulfill({ json: apiOk({ items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } }) }),
    );
    await page.route('**/api/v1/admin/shops/*/audit-logs**', (route: Route) =>
      route.fulfill({ json: apiOk({ logs: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } }) }),
    );
    await page.route('**/api/v1/admin/shops/*', (route: Route) =>
      route.fulfill({
        json: apiOk({ id: 'shop-platform', name: 'Platform Shop', slug: 'platform-shop', is_active: true }),
      }),
    );
  });

  test('AddMemberModal shows role picker with shop_admin and shop_staff options', async ({ page }) => {
    await page.goto('/admin/shops');

    await page.getByRole('button', { name: /Thêm thành viên cho shop/i }).first().click();

    const roleSelect = page.locator('select[id^="member-role-"]');
    await expect(roleSelect).toBeVisible();
    await expect(roleSelect.locator('option[value="shop_admin"]')).toHaveCount(1);
    await expect(roleSelect.locator('option[value="shop_staff"]')).toHaveCount(1);
  });

  test('AddMemberModal defaults to shop_admin role', async ({ page }) => {
    await page.goto('/admin/shops');

    await page.getByRole('button', { name: /Thêm thành viên cho shop/i }).first().click();

    const roleSelect = page.locator('select[id^="member-role-"]');
    await expect(roleSelect).toHaveValue('shop_admin');
  });

  test('AddMemberModal can select shop_staff role', async ({ page }) => {
    await page.goto('/admin/shops');

    await page.getByRole('button', { name: /Thêm thành viên cho shop/i }).first().click();

    const roleSelect = page.locator('select[id^="member-role-"]');
    await roleSelect.selectOption('shop_staff');
    await expect(roleSelect).toHaveValue('shop_staff');
  });

  test('AddMemberModal submit sends selected role in API payload', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null;

    await page.route('**/api/v1/admin/shops/*/members', async (route: Route) => {
      if (route.request().method() === 'POST') {
        capturedBody = route.request().postDataJSON() as Record<string, unknown>;
        return route.fulfill({ json: apiOk({ user_id: 'new-u', shop_id: 'shop-platform', role: 'shop_staff' }) });
      }
      return route.fulfill({
        json: apiOk({ members: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } }),
      });
    });

    await page.goto('/admin/shops');
    await page.getByRole('button', { name: /Thêm thành viên cho shop/i }).first().click();

    const roleSelect = page.locator('select[id^="member-role-"]');
    await roleSelect.selectOption('shop_staff');

    await page.locator('input[type="email"]').fill('staff@example.com');
    // Click the "Thêm thành viên" confirm button (last button in the modal)
    await page.getByRole('button', { name: /^Thêm thành viên$/ }).click();

    await page.waitForTimeout(500);

    expect(capturedBody).not.toBeNull();
    expect(capturedBody?.role).toBe('shop_staff');
    expect(capturedBody?.email).toBe('staff@example.com');
  });
});

test.describe('RBAC — shop_staff read-only UI', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthCsrf(page);
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload(SHOP_STAFF_USER) }),
    );
    await page.route('**/api/v1/items*', (route: Route) =>
      route.fulfill({
        json: apiOk({
          items: [
            {
              id: 'item-1',
              name: 'Test Diecast',
              status: 'con_hang',
              price: 500_000,
              quantity: 3,
              is_public: true,
              created_at: '2026-04-01T00:00:00.000Z',
              updated_at: '2026-04-01T00:00:00.000Z',
            },
          ],
          pagination: { total: 1, page: 1, page_size: 20, total_pages: 1 },
        }),
      }),
    );
    await page.route('**/api/v1/categories*', (route: Route) =>
      route.fulfill({ json: apiOk({ categories: [] }) }),
    );
  });

  test('shop_staff sees read-only banner on admin pages', async ({ page }) => {
    await page.goto('/admin/items');

    await expect(page.getByTestId('shop-staff-readonly-banner')).toBeVisible();
    await expect(page.getByTestId('shop-staff-readonly-banner')).toContainText('Chế độ chỉ xem');
  });

  test('shop_staff items list hides create/import actions but keeps search', async ({ page }) => {
    await page.goto('/admin/items');

    await expect(page.getByRole('link', { name: /Thêm sản phẩm/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Thêm sản phẩm \(AI\)/i })).not.toBeVisible();
    await expect(page.getByPlaceholder(/tìm kiếm ai/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Xuất dữ liệu/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /AI tool/i })).not.toBeVisible();
  });

  test('shop_staff items table hides delete and publish toggles', async ({ page }) => {
    await page.goto('/admin/items');

    await expect(page.getByRole('button', { name: /Xóa Test Diecast/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Ẩn Test Diecast/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Xem Test Diecast/i })).toBeVisible();
  });

  test('shop_staff navigating to /admin/items/new is redirected to items list', async ({ page }) => {
    await page.goto('/admin/items/new');

    await expect(page).toHaveURL(/\/admin\/items\/?$/, { timeout: 10_000 });
    await expect(page.getByTestId('shop-staff-readonly-banner')).toBeVisible();
  });

  test('shop_staff navigating to /admin/items/import is redirected to items list', async ({ page }) => {
    await page.goto('/admin/items/import');

    await expect(page).toHaveURL(/\/admin\/items\/?$/, { timeout: 10_000 });
    await expect(page.getByTestId('shop-staff-readonly-banner')).toBeVisible();
  });
});

import { test, expect, apiOk, type Route } from './fixtures';

const itemsListResponse = apiOk({
  items: [
    {
      id: 'item-1',
      name: 'Lamborghini Huracán 1:18',
      status: 'con_hang',
      price: 3_500_000,
      quantity: 5,
      is_public: true,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'item-2',
      name: 'Ferrari 488 GTB 1:24',
      status: 'con_hang',
      price: 4_200_000,
      quantity: 2,
      is_public: false,
      created_at: '2026-04-02T00:00:00.000Z',
      updated_at: '2026-04-02T00:00:00.000Z',
    },
  ],
  pagination: { total: 2, page: 1, page_size: 20, total_pages: 1 },
});

test.describe('Admin items list smoke', () => {
  // authenticatedPage fixture pre-wires /auth/me → ADMIN_USER (see fixtures/index.ts)
  test.beforeEach(async ({ authenticatedPage }) => {
    // Silence CSRF bootstrap — Vite proxy returns 502 when backend is absent,
    // which delays auth resolution in the test environment.
    await authenticatedPage.route('**/api/v1/auth/csrf', (route: Route) =>
      route.fulfill({ status: 200, json: {} }),
    );
    await authenticatedPage.route('**/api/v1/items*', (route: Route) =>
      route.fulfill({ json: itemsListResponse }),
    );
  });

  test('renders page heading', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/items');

    await expect(authenticatedPage.locator('h1')).toContainText('Quản lý sản phẩm');
  });

  test('renders items from API response', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/items');

    // Item names appear twice per row (mobileOnly div + desktopOnly td),
    // so we check tbody row count instead of a specific text locator.
    await expect(authenticatedPage.locator('table tbody tr')).toHaveCount(2);
  });

  test('shows search input', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/items');

    await expect(authenticatedPage.getByPlaceholder(/tìm kiếm ai/i)).toBeVisible();
  });

  test('shows error state when API returns 500', async ({ authenticatedPage }) => {
    // LIFO: this override takes priority over the beforeEach items mock
    await authenticatedPage.route('**/api/v1/items*', (route: Route) =>
      route.fulfill({ status: 500, json: { ok: false, message: 'Internal error' } }),
    );
    await authenticatedPage.goto('/admin/items');

    await expect(authenticatedPage.getByText('Lỗi khi tải sản phẩm')).toBeVisible();
  });

  test('shows empty table when API returns no items', async ({ authenticatedPage }) => {
    // LIFO: this override takes priority over the beforeEach items mock
    await authenticatedPage.route('**/api/v1/items*', (route: Route) =>
      route.fulfill({
        json: apiOk({ items: [], pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 } }),
      }),
    );
    await authenticatedPage.goto('/admin/items');

    await expect(authenticatedPage.locator('h1')).toContainText('Quản lý sản phẩm');
    await expect(authenticatedPage.locator('table')).toBeVisible();
    await expect(authenticatedPage.locator('table tbody tr')).toHaveCount(0);
  });
});

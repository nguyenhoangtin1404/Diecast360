import { test, expect, apiOk, type Route } from './fixtures';

const publicItemsResponse = apiOk({
  items: [
    {
      id: 'pub-1',
      name: 'Porsche 911 GT3 1:18',
      price: 5_000_000,
      status: 'con_hang',
      is_public: true,
      images: [{ id: 'img-1', url: 'https://placehold.co/400x300', order: 0 }],
      categories: [{ id: 'cat-1', name: 'Sports' }],
      created_at: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'pub-2',
      name: 'McLaren 720S 1:64',
      price: 1_800_000,
      status: 'con_hang',
      is_public: true,
      images: [],
      categories: [],
      created_at: '2026-04-02T00:00:00.000Z',
    },
  ],
  pagination: { total: 2, page: 1, page_size: 20, total_pages: 1 },
});

test.describe('Public catalog smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/public/items**', (route: Route) =>
      route.fulfill({ json: publicItemsResponse }),
    );
  });

  test('renders product names from public API', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Porsche 911 GT3 1:18')).toBeVisible();
    await expect(page.getByText('McLaren 720S 1:64')).toBeVisible();
  });

  test('renders search input on catalog page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByPlaceholder('Tìm kiếm theo tên...')).toBeVisible();
  });

  test('public catalog stays on root URL — no redirect to login', async ({ page }) => {
    // Public pages must not redirect unauthenticated users to /admin/login.
    // No /auth/me mock — verify URL is stable after page settles.
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/');
  });

  test('shows empty state when catalog has no products', async ({ page }) => {
    // LIFO: this override takes priority over the beforeEach public/items mock
    await page.route('**/api/v1/public/items**', (route: Route) =>
      route.fulfill({
        json: apiOk({ items: [], pagination: { total: 0, page: 1, page_size: 20, total_pages: 1 } }),
      }),
    );
    await page.goto('/');

    await expect(page.getByText('Không tìm thấy sản phẩm nào.')).toBeVisible();
  });

  test('shows error state when API fails', async ({ page }) => {
    // LIFO: this override takes priority over the beforeEach public/items mock
    await page.route('**/api/v1/public/items**', (route: Route) =>
      route.fulfill({ status: 500, json: { ok: false, message: 'Internal error' } }),
    );
    await page.goto('/');

    await expect(page.getByText('Không tải được catalog')).toBeVisible();
  });
});

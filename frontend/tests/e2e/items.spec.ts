import { test, expect, type Route } from '@playwright/test';
import { authMePayload, apiOk } from './fixtures';

const itemsListResponse = apiOk({
  items: [
    {
      id: 'item-1',
      name: 'Lamborghini Huracán 1:18',
      status: 'con_hang',
      price: 3_500_000,
      quantity: 5,
      is_public: true,
      images: [],
      categories: [],
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
      images: [],
      categories: [],
      created_at: '2026-04-02T00:00:00.000Z',
      updated_at: '2026-04-02T00:00:00.000Z',
    },
  ],
  pagination: { total: 2, page: 1, page_size: 20, total_pages: 1 },
});

test.describe('Admin items list smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload() }),
    );
    // Silence CSRF bootstrap — Vite proxy returns 502 when backend is absent,
    // which delays auth resolution in the test environment.
    await page.route('**/api/v1/auth/csrf', (route: Route) =>
      route.fulfill({ status: 200, json: {} }),
    );
    await page.route(
      (url) => url.pathname.startsWith('/api/v1/items'),
      (route: Route) => route.fulfill({ json: itemsListResponse }),
    );
  });

  test('renders page heading', async ({ page }) => {
    await page.goto('/admin/items');

    await expect(page.locator('h1')).toContainText('Quản lý sản phẩm');
  });

  test('renders items from API response', async ({ page }) => {
    await page.goto('/admin/items');

    // Wait for heading to confirm auth + data resolved.
    // Item names appear twice per row (mobileOnly div + desktopOnly td),
    // so we check tbody row count instead of a specific text locator.
    await expect(page.locator('h1')).toContainText('Quản lý sản phẩm');
    await expect(page.locator('table tbody tr')).toHaveCount(2);
  });

  test('shows search input', async ({ page }) => {
    await page.goto('/admin/items');

    await expect(page.locator('input').first()).toBeVisible();
  });
});

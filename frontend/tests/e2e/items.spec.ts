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

// The items page loads auth + CSRF + items before rendering — allow 10s
const RENDER_TIMEOUT = 10_000;

test.describe('Admin items list smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload() }),
    );
    // Silence CSRF bootstrap so Vite proxy 502 doesn't delay auth resolution
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

    await expect(page.locator('h1')).toContainText('Quản lý sản phẩm', { timeout: RENDER_TIMEOUT });
  });

  test('renders items from API response', async ({ page }) => {
    await page.goto('/admin/items');

    // Wait for the heading — ensures auth + data resolved and page is rendered.
    // Item names appear twice per row (mobileOnly + desktopOnly), so we check
    // the tbody row count instead of a specific text locator.
    await expect(page.locator('h1')).toContainText('Quản lý sản phẩm', { timeout: RENDER_TIMEOUT });
    await expect(page.locator('table tbody tr')).toHaveCount(2, { timeout: RENDER_TIMEOUT });
  });

  test('shows input on page', async ({ page }) => {
    await page.goto('/admin/items');

    await expect(page.locator('input').first()).toBeVisible({ timeout: RENDER_TIMEOUT });
  });
});

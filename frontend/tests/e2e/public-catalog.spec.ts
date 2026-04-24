import { test, expect, type Route } from '@playwright/test';
import { apiOk } from './fixtures';

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

    await expect(page.locator('input').first()).toBeVisible();
  });

  test('public catalog is accessible without authentication', async ({ page }) => {
    // No auth/me mock — public pages must not require login
    await page.goto('/');

    await expect(page.getByText('Porsche 911 GT3 1:18')).toBeVisible();
  });
});

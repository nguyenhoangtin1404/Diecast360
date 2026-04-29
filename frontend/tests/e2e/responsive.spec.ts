import { test, expect, stubAuthCsrf, apiOk, type Route } from './fixtures';

const itemsListResponse = apiOk({
  items: [
    {
      id: 'item-r1',
      name: 'Responsive Test Item',
      status: 'con_hang',
      price: 1_000_000,
      quantity: 1,
      is_public: true,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-01T00:00:00.000Z',
    },
  ],
  pagination: { total: 1, page: 1, page_size: 20, total_pages: 1 },
});

test.describe('Responsive admin smoke', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('items page search and table remain usable on mobile width', async ({ authenticatedPage }) => {
    await stubAuthCsrf(authenticatedPage);
    await authenticatedPage.route('**/api/v1/items*', (route: Route) =>
      route.fulfill({ json: itemsListResponse }),
    );

    await authenticatedPage.goto('/admin/items');

    await expect(authenticatedPage.getByPlaceholder(/tìm kiếm ai/i)).toBeVisible();
    await expect(authenticatedPage.getByText('Responsive Test Item').first()).toBeVisible();
    await expect(authenticatedPage.locator('table')).toBeVisible();
  });
});

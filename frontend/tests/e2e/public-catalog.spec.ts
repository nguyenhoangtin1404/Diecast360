import { test, expect, apiOk, type Route } from './fixtures';

/** Shared shapes — list API returns snake_case fields used by catalog cards */
const aggregateItems = [
  {
    id: 'pub-1',
    name: 'Porsche 911 GT3 1:18',
    price: 5_000_000,
    status: 'con_hang',
    is_public: true,
    cover_image_url: 'https://placehold.co/400x300',
    has_spinner: false,
    created_at: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'pub-2',
    name: 'McLaren 720S 1:64',
    price: 1_800_000,
    status: 'con_hang',
    is_public: true,
    cover_image_url: null,
    has_spinner: false,
    created_at: '2026-04-02T00:00:00.000Z',
  },
];

const shopAExclusive = {
  id: 'pub-shop-a',
  name: 'Shop A Exclusive Tomica',
  price: 99_000,
  status: 'con_hang' as const,
  is_public: true,
  cover_image_url: null,
  has_spinner: false,
  created_at: '2026-04-03T00:00:00.000Z',
};

const shopBExclusive = {
  id: 'pub-shop-b',
  name: 'Shop B Exclusive Hot Wheels',
  price: 120_000,
  status: 'con_hang' as const,
  is_public: true,
  cover_image_url: null,
  has_spinner: false,
  created_at: '2026-04-04T00:00:00.000Z',
};

function publicItemsEnvelope(items: typeof aggregateItems) {
  return apiOk({
    items,
    pagination: {
      total: items.length,
      page: 1,
      page_size: 20,
      total_pages: items.length > 0 ? 1 : 0,
    },
  });
}

/**
 * Mock GET /api/v1/public/items: response depends on `shop_id` query (slug),
 * matching backend tenant isolation for public catalog.
 */
async function routePublicItemsByShop(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/public/items**', (route: Route) => {
    const url = new URL(route.request().url());
    const shopId = url.searchParams.get('shop_id');
    if (shopId === 'shop-a') {
      return route.fulfill({ json: publicItemsEnvelope([aggregateItems[0], shopAExclusive]) });
    }
    if (shopId === 'shop-b') {
      return route.fulfill({ json: publicItemsEnvelope([aggregateItems[1], shopBExclusive]) });
    }
    // No shop context: aggregate across tenants (legacy behavior)
    return route.fulfill({ json: publicItemsEnvelope([...aggregateItems]) });
  });
}

test.describe('Public catalog smoke', () => {
  test.beforeEach(async ({ page }) => {
    await routePublicItemsByShop(page);
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
        json: apiOk({ items: [], pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 } }),
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

test.describe('Public catalog multi-tenant (shop_id)', () => {
  test.beforeEach(async ({ page }) => {
    await routePublicItemsByShop(page);
  });

  test('with shop-a shows only shop A inventory (not shop B exclusive title)', async ({ page }) => {
    await page.goto('/?shop_id=shop-a');
    await expect(page.getByText('Shop A Exclusive Tomica')).toBeVisible();
    await expect(page.getByText('Shop B Exclusive Hot Wheels')).not.toBeVisible();
    await expect(page.getByText('Porsche 911 GT3 1:18')).toBeVisible();
  });

  test('with shop-b shows only shop B inventory (not shop A exclusive title)', async ({ page }) => {
    await page.goto('/?shop_id=shop-b');
    await expect(page.getByText('Shop B Exclusive Hot Wheels')).toBeVisible();
    await expect(page.getByText('Shop A Exclusive Tomica')).not.toBeVisible();
  });

  test('without shop_id shows aggregate items (smoke regression)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Porsche 911 GT3 1:18')).toBeVisible();
    await expect(page.getByText('McLaren 720S 1:64')).toBeVisible();
  });

  test('public nav preserves shop_id on preorder link', async ({ page }) => {
    await page.goto('/?shop_id=shop-a');
    const preorderLink = page.getByRole('link', { name: /Đặt trước/i });
    await expect(preorderLink).toHaveAttribute('href', /shop_id=shop-a/);
  });
});

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

const itemDetailResponse = apiOk({
  item: {
    id: 'item-1',
    name: 'Lamborghini Huracán 1:18',
    description: '',
    status: 'con_hang',
    is_public: false,
    condition: 'new',
    price: 3_500_000,
    original_price: null,
    scale: '1:18',
    brand: 'AUTOart',
    quantity: 5,
    attributes: {},
    fb_post_content: '',
  },
  images: [],
  spin_sets: [],
  facebook_posts: [],
});

test.describe('Admin item detail — Pre-order campaign button', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/items/item-1*', (route: Route) =>
      route.fulfill({ json: itemDetailResponse }),
    );
    await authenticatedPage.route('**/api/v1/categories*', (route: Route) =>
      route.fulfill({ json: apiOk({ categories: [] }) }),
    );
    await authenticatedPage.route('**/api/v1/inventory/items/item-1/transactions*', (route: Route) =>
      route.fulfill({ json: apiOk({ transactions: [], current_quantity: 5 }) }),
    );
    // LIFO: QR mock overrides the general items/item-1* mock for QR requests
    await authenticatedPage.route('**/api/v1/items/item-1/qr*', (route: Route) =>
      route.fulfill({
        json: apiOk({
          token: 'tok123',
          resolve_url: 'https://example.com/qr/tok123',
          image_data_url: 'data:image/png;base64,MOCK',
        }),
      }),
    );
  });

  test('shows Pre-order campaign button on existing item detail page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/items/item-1');

    await expect(authenticatedPage.getByText(/Chiến dịch Pre-order/i)).toBeVisible();
  });

  test('Pre-order campaign button points to correct create URL', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/items/item-1');

    const link = authenticatedPage.getByText(/Chiến dịch Pre-order/i);
    await expect(link).toBeVisible();
    const href = await link.evaluate((el) => el.closest('a')?.getAttribute('href') ?? '');
    expect(href).toContain('/admin/preorders/create');
    expect(href).toContain('item_id=item-1');
  });

  test('Pre-order campaign button is not shown on new item form', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/categories*', (route: Route) =>
      route.fulfill({ json: apiOk({ categories: [] }) }),
    );

    await authenticatedPage.goto('/admin/items/new');

    await expect(authenticatedPage.getByText(/Tạo sản phẩm mới/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Chiến dịch Pre-order/i)).toHaveCount(0);
  });

  test('status selector includes Pre-order option on item detail page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/items/item-1');

    await expect(authenticatedPage.getByText('Pre-order')).toBeVisible();
  });
});

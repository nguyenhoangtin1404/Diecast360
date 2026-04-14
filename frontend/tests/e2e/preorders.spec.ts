import { expect, test, type Route } from '@playwright/test';

const authMeResponse = {
  ok: true,
  data: {
    user: {
      id: 'u1',
      email: 'admin@example.com',
      full_name: 'Admin',
      role: 'shop_admin',
      active_shop_id: 'shop-1',
      allowed_shop_ids: ['shop-1'],
      allowed_shops: [{ id: 'shop-1', name: 'Main Shop', slug: 'main-shop', is_active: true, role: 'shop_admin' }],
    },
  },
  message: '',
};

const adminListResponse = {
  ok: true,
  data: {
    preorders: [
      {
        id: 'po-1',
        status: 'PENDING_CONFIRMATION',
        quantity: 2,
        unit_price: 1200000,
        total_amount: 2400000,
        deposit_amount: 200000,
        paid_amount: 200000,
        note: null,
        expected_arrival_at: null,
        expected_delivery_at: null,
        item_id: 'item-1',
        item: { name: 'Mini GT Porsche' },
        user: { id: 'u2', full_name: 'Buyer A', email: 'buyer@example.com' },
      },
    ],
    pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
  },
  message: '',
};

const adminListMultiCampaignResponse = {
  ok: true,
  data: {
    preorders: [
      adminListResponse.data.preorders[0],
      {
        id: 'po-2',
        status: 'WAITING_FOR_GOODS',
        quantity: 1,
        unit_price: 900000,
        total_amount: 900000,
        deposit_amount: 100000,
        paid_amount: 100000,
        note: null,
        expected_arrival_at: null,
        expected_delivery_at: null,
        item_id: 'item-2',
        item: { name: 'Hot Wheels Set' },
        user: { id: 'u3', full_name: 'Buyer B', email: 'buyerb@example.com' },
      },
    ],
    pagination: { page: 1, page_size: 20, total: 2, total_pages: 1 },
  },
  message: '',
};

const participantsResponse = {
  ok: true,
  data: {
    participants: [
      {
        preorder_id: 'po-1',
        status: 'PENDING_CONFIRMATION',
        quantity: 2,
        deposit_amount: 200000,
        paid_amount: 200000,
        user: { id: 'u2', full_name: 'Buyer A', email: 'buyer@example.com' },
      },
    ],
    pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
  },
  message: '',
};

const participantsResponseItem2 = {
  ok: true,
  data: {
    participants: [
      {
        preorder_id: 'po-2',
        status: 'WAITING_FOR_GOODS',
        quantity: 1,
        deposit_amount: 100000,
        paid_amount: 100000,
        user: { id: 'u3', full_name: 'Buyer B', email: 'buyerb@example.com' },
      },
    ],
    pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
  },
  message: '',
};

const publicCardsResponse = {
  ok: true,
  data: {
    cards: [
      {
        id: 'card-1',
        status: 'WAITING_FOR_GOODS',
        quantity: 1,
        display_price: 1990000,
        deposit_amount: 500000,
        countdown_target: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'LBWK Nissan GTR',
        short_specs: '1:64 | Mini GT',
        cover_image_url: 'https://images.example/gtr.jpg',
      },
    ],
    pagination: { page: 1, page_size: 20 },
  },
  message: '',
};

const myOrdersResponse = {
  ok: true,
  data: {
    cards: [
      {
        id: 'my-1',
        status: 'ARRIVED',
        quantity: 1,
        display_price: 2190000,
        deposit_amount: 500000,
        countdown_target: null,
        title: 'Ferrari 296 GTB',
        short_specs: '1:18 | BBR',
        cover_image_url: 'https://images.example/ferrari.jpg',
      },
    ],
    pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
  },
  message: '',
};

async function mockBase(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/me', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(authMeResponse) }),
  );
}

test.describe('Pre-order flows', () => {
  test('admin flow supports list, transition and campaign management', async ({ page }) => {
    await mockBase(page);
    let currentStatus = 'PENDING_CONFIRMATION';
    await page.route('**/api/v1/preorders/admin**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...adminListResponse,
          data: {
            ...adminListResponse.data,
            preorders: adminListResponse.data.preorders.map((row) => ({ ...row, status: currentStatus })),
          },
        }),
      }),
    );
    await page.route('**/api/v1/preorders/admin/campaigns/item-1/participants**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(participantsResponse) }),
    );

    await page.goto('/admin/preorders');
    await expect(page.getByTestId('admin-preorder-card')).toBeVisible();
    await expect(page.getByTestId('admin-preorder-status-badge')).toContainText('Chờ xác nhận');
    await page.route('**/api/v1/preorders/po-1/status', async (route: Route) => {
      currentStatus = 'WAITING_FOR_GOODS';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            preorder: {
              ...adminListResponse.data.preorders[0],
              status: 'WAITING_FOR_GOODS',
            },
          },
          message: '',
        }),
      });
    });
    await page.getByRole('button', { name: /Chuyển sang: Chờ hàng về/i }).click();
    await expect(page.getByTestId('admin-preorder-status-badge')).toContainText('Chờ hàng về');
    await page.getByRole('link', { name: /Quản lý theo campaign/i }).click();
    await expect(page.getByTestId('admin-campaign-summary')).toBeVisible();
    await expect(page.getByTestId('admin-participant-row')).toBeVisible();
  });

  test('admin list surfaces API error on rejected status transition', async ({ page }) => {
    await mockBase(page);
    await page.route('**/api/v1/preorders/admin**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...adminListResponse,
          data: {
            ...adminListResponse.data,
            preorders: [{ ...adminListResponse.data.preorders[0], status: 'ARRIVED' }],
          },
        }),
      }),
    );
    await page.route('**/api/v1/preorders/po-1/status', (route: Route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          message: 'Invalid pre-order status transition from "ARRIVED" to "PAID"',
        }),
      }),
    );

    await page.goto('/admin/preorders');
    await page.getByRole('button', { name: /Chuyển sang: Đã thanh toán/i }).click();
    await expect(page.getByTestId('admin-preorder-transition-error')).toContainText(
      'Chuyển trạng thái thất bại',
    );
  });

  test('admin management switches participants when campaign changes', async ({ page }) => {
    await mockBase(page);
    await page.route('**/api/v1/preorders/admin**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminListMultiCampaignResponse),
      }),
    );
    await page.route('**/api/v1/preorders/admin/campaigns/**/participants**', async (route: Route) => {
      const url = route.request().url();
      if (url.includes('item-2')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(participantsResponseItem2),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(participantsResponse),
      });
    });

    await page.goto('/admin/preorders/manage');
    await expect(page.getByTestId('admin-campaign-summary')).toBeVisible();
    await expect(page.getByTestId('admin-participant-row').first()).toContainText('Buyer A');
    await page.getByTestId('admin-campaign-selector').selectOption('item-2');
    await expect(page.getByTestId('admin-participant-row').first()).toContainText('Buyer B');
  });

  test('create preorder form prefills item_id from query string', async ({ page }) => {
    await mockBase(page);
    await page.goto('/admin/preorders/create?item_id=item-99');
    await expect(page.getByTestId('admin-preorder-item-id')).toHaveValue('item-99');
  });

  test('public preorder page works for anonymous visitor with query shop_id', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ ok: false }) }),
    );
    await page.route('**/api/v1/preorders/public**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(publicCardsResponse) }),
    );

    await page.goto('/preorders?shop_id=shop-1');
    await expect(page.getByRole('heading', { name: 'Mô hình Đặt trước' })).toBeVisible();
    await expect(page.getByTestId('public-preorder-card')).toBeVisible();
    await expect(page.getByTestId('public-preorder-cta')).toBeVisible();
  });

  test('public preorder listing works for anonymous user via default shop env', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ ok: false }) }),
    );
    await page.route('**/api/v1/preorders/public**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(publicCardsResponse) }),
    );

    await page.goto('/preorders');
    await expect(page.getByTestId('public-preorder-card')).toBeVisible();
  });

  test('public preorder page shows empty state when no cards', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ ok: false }) }),
    );
    await page.route('**/api/v1/preorders/public**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { cards: [], pagination: { page: 1, page_size: 20 } }, message: '' }),
      }),
    );

    await page.goto('/preorders?shop_id=shop-1');
    await expect(page.getByText('Chưa có sản phẩm pre-order nào ở thời điểm hiện tại.')).toBeVisible();
  });

  test('public preorder page shows error state for API failure', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ ok: false }) }),
    );
    await page.route('**/api/v1/preorders/public**', (route: Route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false }) }),
    );

    await page.goto('/preorders?shop_id=shop-1');
    await expect(page.getByText('Không thể tải danh sách pre-order. Vui lòng thử lại.')).toBeVisible();
  });

  test('my-orders shows error state on network failure', async ({ page }) => {
    await mockBase(page);
    await page.route('**/api/v1/preorders/my-orders**', (route: Route) => route.abort('timedout'));

    await page.goto('/my-orders');
    await expect(page.getByText('Không thể tải danh sách đơn hàng. Vui lòng thử lại.')).toBeVisible();
  });

  test('my-orders shows empty state when user has no orders', async ({ page }) => {
    await mockBase(page);
    await page.route('**/api/v1/preorders/my-orders**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { cards: [], pagination: { page: 1, page_size: 20 } }, message: '' }),
      }),
    );

    await page.goto('/my-orders');
    await expect(page.getByText('Bạn chưa có đơn pre-order nào.')).toBeVisible();
  });

  test('create preorder form shows validation errors and handles API failure', async ({ page }) => {
    await mockBase(page);
    await page.route('**/api/v1/preorders', (route: Route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, message: 'Validation failed' }),
      }),
    );

    await page.goto('/admin/preorders/create');
    await page.getByTestId('admin-preorder-item-id').fill('item-1');
    await page.locator('input[type="number"]').nth(1).fill('100');
    await page.locator('input[type="number"]').nth(2).fill('200');
    await expect(page.getByText('Tiền đặt cọc không được vượt tổng giá trị đơn.')).toBeVisible();

    await page.locator('input[type="number"]').nth(2).fill('50');
    await page.locator('input[type="number"]').nth(3).fill('20');
    await expect(page.getByText('Tiền đã thanh toán không được nhỏ hơn tiền đặt cọc.')).toBeVisible();

    await page.locator('input[type="number"]').nth(3).fill('50');
    await page.getByTestId('admin-preorder-note').fill('test submit');
    await page.getByTestId('admin-preorder-submit').click();
    await expect(page.getByText('Tạo pre-order thất bại. Vui lòng kiểm tra lại.')).toBeVisible();
  });

  test('public pages render preorder cards and my order tracking', async ({ page }) => {
    await mockBase(page);
    await page.route('**/api/v1/preorders/public**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(publicCardsResponse) }),
    );
    await page.route('**/api/v1/preorders/my-orders**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(myOrdersResponse) }),
    );

    await page.goto('/preorders');
    await expect(page.getByRole('heading', { name: 'Mô hình Đặt trước' })).toBeVisible();
    await expect(page.getByTestId('public-preorder-card')).toBeVisible();
    await expect(page.getByTestId('public-preorder-countdown')).toBeVisible();
    await expect(page.getByTestId('public-preorder-cta')).toBeVisible();

    await page.goto('/my-orders');
    await expect(page.getByRole('heading', { name: 'Đơn hàng của tôi' })).toBeVisible();
    await expect(page.getByTestId('my-order-card')).toBeVisible();
    await expect(page.getByTestId('my-order-status')).toBeVisible();
  });
});


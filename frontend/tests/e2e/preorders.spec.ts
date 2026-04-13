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
    await page.route('**/api/v1/preorders/admin**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminListResponse) }),
    );
    await page.route('**/api/v1/preorders/po-1/status', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { preorder: adminListResponse.data.preorders[0] }, message: '' }),
      }),
    );
    await page.route('**/api/v1/preorders/admin/campaigns/item-1/participants**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(participantsResponse) }),
    );

    await page.goto('/admin/preorders');
    await expect(page.getByTestId('admin-preorder-card')).toBeVisible();
    await page.getByRole('button', { name: /Chuyen sang: Chờ hàng về/i }).click();
    await page.getByRole('link', { name: /Quan ly theo campaign/i }).click();
    await expect(page.getByTestId('admin-campaign-summary')).toBeVisible();
    await expect(page.getByTestId('admin-participant-row')).toBeVisible();
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
    await expect(page.getByText('Mo hinh Dat truoc')).toBeVisible();
    await expect(page.getByTestId('public-preorder-card')).toBeVisible();
    await expect(page.getByTestId('public-preorder-countdown')).toBeVisible();
    await expect(page.getByTestId('public-preorder-cta')).toBeVisible();

    await page.goto('/my-orders');
    await expect(page.getByRole('heading', { name: 'Don hang cua toi' })).toBeVisible();
    await expect(page.getByTestId('my-order-card')).toBeVisible();
    await expect(page.getByTestId('my-order-status')).toBeVisible();
  });
});


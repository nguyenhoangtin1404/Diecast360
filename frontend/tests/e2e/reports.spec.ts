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
      allowed_shops: [
        { id: 'shop-1', name: 'Main Shop', slug: 'main-shop', is_active: true, role: 'shop_admin' },
      ],
    },
  },
  message: '',
};

const reportSummaryResponse = {
  ok: true,
  data: {
    range: '30d',
    from: '2026-03-24T00:00:00.000Z',
    to: '2026-04-22T23:59:59.999Z',
    summary: {
      stock_in_units: 30,
      stock_out_units: 12,
      adjustment_net_units: -2,
      movement_units: 44,
      preorder_created_count: 5,
      preorder_paid_count: 3,
      preorder_created_revenue: 12000000,
      preorder_paid_revenue: 8300000,
      facebook_post_count: 4,
      current_stock_units: 128,
      active_preorder_count: 6,
    },
  },
  message: '',
};

const reportTrendsResponse = {
  ok: true,
  data: {
    range: '30d',
    bucket: 'day',
    series: [
      {
        bucket_start: '2026-04-20T00:00:00.000Z',
        inventory_movement_units: 6,
        preorder_created_count: 1,
        preorder_paid_count: 0,
        preorder_revenue: 1900000,
        facebook_post_count: 1,
      },
      {
        bucket_start: '2026-04-21T00:00:00.000Z',
        inventory_movement_units: 12,
        preorder_created_count: 2,
        preorder_paid_count: 1,
        preorder_revenue: 4200000,
        facebook_post_count: 2,
      },
    ],
  },
  message: '',
};

async function mockAuth(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/me', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authMeResponse),
    }),
  );
}

test.describe('Reports dashboard', () => {
  test('renders KPI cards and reacts to range changes', async ({ page }) => {
    await mockAuth(page);

    await page.route('**/api/v1/reports/summary**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reportSummaryResponse),
      }),
    );
    await page.route('**/api/v1/reports/trends**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reportTrendsResponse),
      }),
    );

    await page.goto('/admin/reports');

    await expect(page.getByRole('heading', { name: /Báo cáo và thống kê/i })).toBeVisible();
    await expect(page.getByTestId('reports-summary-grid')).toBeVisible();
    await expect(page.getByTestId('reports-metric-card').first()).toBeVisible();
    await expect(page.getByTestId('reports-trend-list')).toBeVisible();

    await page.getByTestId('reports-range-7d').click();
    await expect(page.getByTestId('reports-summary-grid')).toBeVisible();
  });

  test('shows empty state when trends have no data', async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/v1/reports/summary**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reportSummaryResponse),
      }),
    );
    await page.route('**/api/v1/reports/trends**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: { range: '30d', bucket: 'day', series: [] },
          message: '',
        }),
      }),
    );

    await page.goto('/admin/reports');
    await expect(page.getByTestId('reports-empty')).toBeVisible();
  });

  test('shows error state when API fails', async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/v1/reports/summary**', (route: Route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, message: 'Internal error' }),
      }),
    );
    await page.route('**/api/v1/reports/trends**', (route: Route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, message: 'Internal error' }),
      }),
    );

    await page.goto('/admin/reports');
    await expect(page.getByTestId('reports-error')).toBeVisible();
  });
});

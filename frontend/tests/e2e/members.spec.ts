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

test.describe('Members dashboard', () => {
  test('renders list and ledger areas', async ({ page }) => {
    let createTierCalled = false;
    let deleteTierCalled = false;
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authMeResponse),
      }),
    );
    await page.route('**/api/v1/members/tiers', (route: Route) => {
      const method = route.request().method();
      if (method === 'POST') {
        createTierCalled = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            data: { tier: { id: 't2', name: 'Gold', rank: 3, min_points: 5000 } },
            message: '',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: { tiers: [{ id: 't1', name: 'Silver', rank: 2, min_points: 1000 }] },
          message: '',
        }),
      });
    });
    await page.route('**/api/v1/members/tiers/*', (route: Route) => {
      if (route.request().method() === 'DELETE') {
        deleteTierCalled = true;
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { ok: true }, message: '' }),
      });
    });
    await page.route('**/api/v1/members?**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            members: [
              {
                id: 'm1',
                full_name: 'Nguyen Van A',
                email: 'a@example.com',
                phone: null,
                points_balance: 1200,
                tier_id: null,
                tier: null,
                created_at: '2026-04-22T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
          },
          message: '',
        }),
      }),
    );
    await page.route('**/api/v1/members/m1/ledger', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            entries: [
              {
                id: 'l1',
                type: 'earn',
                points: 100,
                delta: 100,
                balance_after: 1200,
                reason: 'Mua hang',
                note: null,
                created_at: '2026-04-22T03:00:00.000Z',
              },
            ],
            pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
          },
          message: '',
        }),
      }),
    );

    await page.goto('/admin/members');
    await expect(page.getByRole('heading', { name: /Hội viên và điểm thưởng/i })).toBeVisible();
    await expect(page.getByTestId('members-list')).toBeVisible();
    await expect(page.getByTestId('member-tier-list')).toBeVisible();
    await page.getByPlaceholder('Tên hạng (ví dụ: Silver)').fill('Gold');
    await page.getByRole('button', { name: /Thêm hạng/i }).click();
    expect(createTierCalled).toBeTruthy();
    await page.getByRole('button', { name: /Xoá/i }).first().click();
    expect(deleteTierCalled).toBeTruthy();
    await page.getByText('Nguyen Van A').click();
    await expect(page.getByTestId('members-ledger-list')).toBeVisible();
  });
});

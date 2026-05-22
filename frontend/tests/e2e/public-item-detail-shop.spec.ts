import { test, expect, apiOk, routePublicShopContact, type Route } from './fixtures';

const ITEM_ID = 'pub-detail-1';

test.describe('Public item detail — shop scope', () => {
  test.beforeEach(async ({ page }) => {
    await routePublicShopContact(page);
    await page.route(`**/api/v1/public/items/${ITEM_ID}**`, (route: Route) => {
      const url = new URL(route.request().url());
      if (!url.searchParams.get('shop_id')) {
        return route.fulfill({
          status: 422,
          json: {
            ok: false,
            error: { code: 'PUBLIC_SHOP_REQUIRED', details: [] },
            message: 'Public catalog requires shop_id',
          },
        });
      }
      return route.fulfill({
        json: apiOk({
          item: {
            id: ITEM_ID,
            name: 'E2E Public Detail',
            description: 'd',
            scale: '1:64',
            brand: 'HW',
            car_brand: null,
            model_brand: null,
            condition: 'new',
            price: 100000,
            original_price: null,
            status: 'con_hang',
            is_public: true,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
          images: [],
          spinner: null,
        }),
      });
    });
  });

  test('without shop_id shows guidance and does not request detail API', async ({ page }) => {
    let detailRequestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes(`/api/v1/public/items/${ITEM_ID}`)) {
        detailRequestCount += 1;
      }
    });

    await page.goto(`/items/${ITEM_ID}`);
    await expect(page.getByText('Chưa chọn cửa hàng')).toBeVisible();
    expect(detailRequestCount).toBe(0);
  });

  test('with shop_id loads item from public API', async ({ page }) => {
    await page.goto(`/items/${ITEM_ID}?shop_id=shop-a`);
    await expect(page.getByText('E2E Public Detail')).toBeVisible();
  });
});

test.describe('Public item detail — preorder status badge', () => {
  const PREORDER_ITEM_ID = 'pub-preorder-1';

  test.beforeEach(async ({ page }) => {
    await routePublicShopContact(page);
    await page.route(`**/api/v1/public/items/${PREORDER_ITEM_ID}**`, (route: Route) => {
      const url = new URL(route.request().url());
      if (!url.searchParams.get('shop_id')) {
        return route.fulfill({
          status: 422,
          json: { ok: false, error: { code: 'PUBLIC_SHOP_REQUIRED', details: [] }, message: '' },
        });
      }
      return route.fulfill({
        json: apiOk({
          item: {
            id: PREORDER_ITEM_ID,
            name: 'Ferrari F40 Pre-order',
            description: '',
            scale: '1:64',
            brand: 'MiniGT',
            car_brand: null,
            model_brand: null,
            condition: 'new',
            price: 500000,
            original_price: null,
            status: 'preorder',
            is_public: true,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
          images: [],
          spinner: null,
        }),
      });
    });
  });

  test('shows Pre-order badge for a preorder item', async ({ page }) => {
    await page.goto(`/items/${PREORDER_ITEM_ID}?shop_id=shop-a`);
    await expect(page.getByText('Ferrari F40 Pre-order')).toBeVisible();
    await expect(page.getByText('Pre-order', { exact: true })).toBeVisible();
  });
});

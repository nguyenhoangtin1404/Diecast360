import { test, expect, apiOk, routePublicShopContact, type Route } from './fixtures';

const ITEM_ID = 'item-qr-e2e';

const itemResponse = apiOk({
  item: {
    id: ITEM_ID,
    name: 'Hot Wheels QR Test',
    description: 'desc',
    scale: '1:64',
    brand: 'HW',
    car_brand: null,
    model_brand: null,
    condition: 'new',
    price: 150000,
    original_price: null,
    status: 'con_hang',
    is_public: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    fb_post_content: null,
    qr_token: null,
  },
  images: [],
  spin_sets: [],
  facebook_posts: [],
});

const itemPrivateResponse = apiOk({
  ...itemResponse.data,
  item: { ...itemResponse.data.item, is_public: false },
});

const qrResponse = apiOk({
  token: 'abc123def456789a',
  resolve_url: 'https://api.example.com/api/v1/public/qr/abc123def456789a',
  image_data_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
});

async function stubAdminItemRoutes(
  page: Parameters<typeof routePublicShopContact>[0],
  itemPayload: typeof itemResponse = itemResponse,
) {
  await page.route('**/api/v1/categories**', (route: Route) =>
    route.fulfill({ json: apiOk({ categories: [] }) }),
  );
  await page.route(`**/api/v1/items/${ITEM_ID}/qr`, (route: Route) =>
    route.fulfill({ json: qrResponse }),
  );
  await page.route(`**/api/v1/items/${ITEM_ID}`, (route: Route) =>
    route.fulfill({ json: itemPayload }),
  );
}

test.describe('Admin — QR step 5', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await stubAdminItemRoutes(authenticatedPage);
  });

  test('step 5 tab appears in the wizard stepper', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/admin/items/${ITEM_ID}`);

    await expect(authenticatedPage.getByRole('button', { name: /Mã QR/i }).first()).toBeVisible();
  });

  test('QR image renders after entering step 5', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=5`);

    const img = authenticatedPage.getByAltText('Mã QR sản phẩm');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src).toContain('data:image/png;base64,');
  });

  test('resolve_url is displayed in the URL box', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=5`);

    await expect(
      authenticatedPage.getByText('https://api.example.com/api/v1/public/qr/abc123def456789a'),
    ).toBeVisible();
  });

  test('private item shows riêng tư warning banner', async ({ authenticatedPage }) => {
    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}`, (route: Route) =>
      route.fulfill({ json: itemPrivateResponse }),
    );

    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=5`);

    await expect(
      authenticatedPage.getByText(/riêng tư/i),
    ).toBeVisible();
  });

  test('error state shown and retry button visible on QR API failure', async ({ authenticatedPage }) => {
    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}/qr`, (route: Route) =>
      route.fulfill({ status: 500, json: { ok: false, message: 'Internal error' } }),
    );

    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=5`);

    await expect(authenticatedPage.getByText(/Không thể tải mã QR/i)).toBeVisible();
    await expect(authenticatedPage.getByRole('button', { name: /Thử lại/i })).toBeVisible();
  });

  test('retry button fetches QR again and renders image on success', async ({ authenticatedPage }) => {
    let callCount = 0;
    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}/qr`, (route: Route) => {
      callCount += 1;
      if (callCount === 1) {
        return route.fulfill({ status: 500, json: { ok: false, message: 'fail' } });
      }
      return route.fulfill({ json: qrResponse });
    });

    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=5`);
    await expect(authenticatedPage.getByText(/Không thể tải mã QR/i)).toBeVisible();

    await authenticatedPage.getByRole('button', { name: /Thử lại/i }).click();

    await expect(authenticatedPage.getByAltText('Mã QR sản phẩm')).toBeVisible();
    expect(callCount).toBe(2);
  });

  test('download link has correct filename attribute', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=5`);

    await authenticatedPage.getByAltText('Mã QR sản phẩm').waitFor();
    const downloadLink = authenticatedPage.getByRole('link', { name: /Tải PNG/i });
    await expect(downloadLink).toBeVisible();
    const downloadAttr = await downloadLink.getAttribute('download');
    expect(downloadAttr).toBe(`qr-${ITEM_ID}.png`);
  });

  test('shows save-first message for new item without fetching QR', async ({ authenticatedPage }) => {
    let qrFetched = false;
    await authenticatedPage.route('**/api/v1/items/new/qr', () => {
      qrFetched = true;
    });

    await authenticatedPage.goto('/admin/items/new?step=5');

    await authenticatedPage.waitForTimeout(300);
    expect(qrFetched).toBe(false);
    await expect(authenticatedPage.getByText(/Lưu sản phẩm trước khi tạo mã QR/i)).toBeVisible();
  });
});

test.describe('Public — QR source banner', () => {
  test.beforeEach(async ({ page }) => {
    await routePublicShopContact(page);
    await page.route(`**/api/v1/public/items/${ITEM_ID}**`, (route: Route) =>
      route.fulfill({
        json: apiOk({
          item: {
            id: ITEM_ID,
            name: 'QR Public Item',
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
      }),
    );
  });

  test('shows QR banner when source=qr in URL', async ({ page }) => {
    await page.goto(`/items/${ITEM_ID}?shop_id=shop-a&source=qr`);

    await expect(page.getByText('Bạn đang xem sản phẩm qua mã QR')).toBeVisible();
  });

  test('does not show QR banner when source is absent', async ({ page }) => {
    await page.goto(`/items/${ITEM_ID}?shop_id=shop-a`);

    await expect(page.getByText('Bạn đang xem sản phẩm qua mã QR')).not.toBeVisible();
  });

  test('QR banner and item name are both visible when source=qr', async ({ page }) => {
    await page.goto(`/items/${ITEM_ID}?shop_id=shop-a&source=qr`);

    await expect(page.getByText('Bạn đang xem sản phẩm qua mã QR')).toBeVisible();
    await expect(page.getByText('QR Public Item')).toBeVisible();
  });
});

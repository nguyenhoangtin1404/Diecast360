import { test, expect, authMePayload, stubAuthCsrf, routePublicShopContact, type Route } from './fixtures';

const RECEIPT_PREORDER_ID = 'po-1';
const MY_ORDER_PREORDER_ID = 'my-1';

const receiptPayload = {
  shop: {
    name: 'Diecast360 Test Shop',
    phone_label: '0901234567',
    phone_tel: '+84901234567',
    address: '123 Đường E2E, TP.HCM',
    logo_url: undefined,
  },
  preorder: {
    id: RECEIPT_PREORDER_ID,
    status: 'WAITING_FOR_GOODS',
    quantity: 2,
    unit_price: 1_200_000,
    total_amount: 2_400_000,
    deposit_amount: 200_000,
    paid_amount: 200_000,
    remaining_amount: 2_200_000,
    discount_amount: null,
    note: 'Giao cuối tuần — E2E',
    created_at: '2026-05-01T08:00:00.000Z',
    item: { name: 'Mini GT Porsche' },
    member: {
      id: 'mem-1',
      full_name: 'Member A',
      phone: '0901111111',
      address: '456 Member St',
    },
    user: { id: 'u2', full_name: 'Buyer A', email: 'buyer@example.com' },
  },
};

const receiptResponse = {
  ok: true,
  data: receiptPayload,
  message: '',
};

const adminListResponse = {
  ok: true,
  data: {
    preorders: [
      {
        id: RECEIPT_PREORDER_ID,
        status: 'WAITING_FOR_GOODS',
        quantity: 2,
        unit_price: 1_200_000,
        total_amount: 2_400_000,
        deposit_amount: 200_000,
        paid_amount: 200_000,
        note: null,
        expected_arrival_at: null,
        expected_delivery_at: null,
        item_id: 'item-1',
        item: { name: 'Mini GT Porsche' },
        user: { id: 'u2', full_name: 'Buyer A', email: 'buyer@example.com' },
        member_id: 'mem-1',
        member: { id: 'mem-1', full_name: 'Member A', phone: null },
      },
    ],
    pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
  },
  message: '',
};

const myOrdersResponse = {
  ok: true,
  data: {
    cards: [
      {
        id: MY_ORDER_PREORDER_ID,
        status: 'ARRIVED',
        quantity: 1,
        display_price: 2_190_000,
        deposit_amount: 500_000,
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

async function mockAdminAuth(page: import('@playwright/test').Page) {
  await stubAuthCsrf(page);
  await page.route('**/api/v1/auth/me', (route: Route) =>
    route.fulfill({ json: authMePayload() }),
  );
}

async function routeReceipt(
  page: import('@playwright/test').Page,
  preorderId: string,
  body: unknown = receiptResponse,
  status = 200,
) {
  await page.route(`**/api/v1/preorders/${preorderId}/receipt`, (route: Route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

test.describe('Pre-order receipt — print and share', () => {
  test('admin list shows receipt actions and opens print modal with receipt preview', async ({ page }) => {
    await mockAdminAuth(page);
    await page.route('**/api/v1/preorders/admin**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminListResponse),
      }),
    );
    await routeReceipt(page, RECEIPT_PREORDER_ID);

    await page.goto('/admin/preorders');
    const actions = page.getByTestId('preorder-receipt-actions');
    await expect(actions).toBeVisible();
    await expect(page.getByTestId('preorder-receipt-print')).toBeEnabled();
    await expect(page.getByTestId('preorder-receipt-share-image')).toBeEnabled();

    await page.getByTestId('preorder-receipt-print').click();

    // Modal mở với preview iframe
    const modal = page.getByTestId('print-receipt-modal');
    await expect(modal).toBeVisible();

    // Kiểm tra paper selector và nút In ngay
    await expect(modal.getByText('58mm (K57)')).toBeVisible();
    await expect(modal.getByText('80mm (K80)')).toBeVisible();
    await expect(page.getByTestId('print-receipt-confirm')).toBeEnabled();

    // Preview iframe chứa dữ liệu phiếu đúng
    const previewFrame = page.frameLocator('[data-testid="print-receipt-preview"]');
    await expect(previewFrame.getByText('PHIẾU ĐẶT HÀNG')).toBeVisible();
    await expect(previewFrame.getByText('Mini GT Porsche')).toBeVisible();
    await expect(previewFrame.getByText('Giao cuối tuần — E2E')).toBeVisible();

    // Đóng modal
    await modal.getByRole('button', { name: 'Đóng' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('admin share image downloads PNG when Web Share is unavailable', async ({ page }) => {
    await mockAdminAuth(page);
    await page.route('**/api/v1/preorders/admin**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminListResponse),
      }),
    );
    await routeReceipt(page, RECEIPT_PREORDER_ID);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });

    await page.goto('/admin/preorders');
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('preorder-receipt-share-image').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^phieu-dat-hang-.+\.png$/);
  });

  test('admin shows error when receipt API fails', async ({ page }) => {
    await mockAdminAuth(page);
    await page.route('**/api/v1/preorders/admin**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminListResponse),
      }),
    );
    await routeReceipt(
      page,
      RECEIPT_PREORDER_ID,
      { ok: false, message: 'Forbidden' },
      403,
    );

    await page.goto('/admin/preorders');
    await page.getByTestId('preorder-receipt-print').click();
    await expect(page.getByRole('alert')).toContainText('Không thể tải hoặc in phiếu');
  });

  test('my-orders page can create receipt PNG for owned order', async ({ page }) => {
    await mockAdminAuth(page);
    await routePublicShopContact(page);
    await page.route('**/api/v1/preorders/my-orders**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(myOrdersResponse),
      }),
    );
    await routeReceipt(page, MY_ORDER_PREORDER_ID, {
      ...receiptResponse,
      data: {
        ...receiptPayload,
        preorder: { ...receiptPayload.preorder, id: MY_ORDER_PREORDER_ID },
      },
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });

    await page.goto('/my-orders');
    await expect(page.getByTestId('my-order-card')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('preorder-receipt-share-image').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^phieu-dat-hang-.+\.png$/);
  });
});

import { test, expect, type Route } from '@playwright/test';

const MAX_FRAMES = 48;

// Helper to create a fake item response with max frames
function createItemResponseWithMaxFrames() {
  const frames = Array.from({ length: MAX_FRAMES }, (_, i) => ({
    id: `frame-${i + 1}`,
    spin_set_id: 'spin1',
    frame_index: i,
    image_url: `https://img.example/f${i + 1}.jpg`,
    thumbnail_url: null,
    created_at: '2026-01-01',
  }));

  return {
    data: {
      item: {
        id: '1',
        name: 'Ferrari F40',
        description: '',
        status: 'con_hang',
        is_public: false,
        condition: 'new',
        price: 0,
        original_price: 0,
        scale: '1:64',
        brand: 'Test',
      },
      images: [],
      spin_sets: [
        {
          id: 'spin1',
          item_id: '1',
          label: 'Default',
          is_default: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          frames,
        },
      ],
      facebook_posts: [],
    },
  };
}

// Fake user response for authenticated pages
const mockUserResponse = {
  data: {
    user: {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
    },
  },
};

test.describe('Spinner upload limits', () => {
  test('disables upload and shows warning when 48 frames are already present', async ({ page }) => {
    // Ensure auth check passes
    await page.route('**/api/v1/auth/me', (route: Route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUserResponse) });
    });

    // Return an item that already has 48 frames in its spin set
    await page.route('**/api/v1/items/1', (route: Route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createItemResponseWithMaxFrames()) });
    });

    // Fail fast if the page attempts to upload another frame (UI should block)
    await page.route('**/api/v1/spin-sets/*/frames', () => {
      throw new Error('Upload should not be attempted when max frames reached');
    });

    await page.goto('/admin/items/1?step=3');

    // Ensure warning message is visible and upload input is disabled
    await expect(page.getByText(/Đã đạt giới hạn 48 frames/)).toBeVisible();
    await expect(page.getByTestId('spinner-frame-upload')).toBeDisabled();
  });

  test('shows error when API rejects upload beyond 48 frames', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUserResponse) });
    });

    // Return an item already at 48 frames
    await page.route('**/api/v1/items/1', (route: Route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createItemResponseWithMaxFrames()) });
    });

    // Simulate backend rejecting uploads beyond max frames
    await page.route('**/api/v1/spin-sets/*/frames', (route: Route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: { code: 'MAX_FRAMES', message: 'Max frames reached' } }),
      });
    });

    // Capture the alert triggered by upload failure
    const alertPromise = page.waitForEvent('dialog');

    await page.goto('/admin/items/1?step=3');

    // Force-enable the upload input and attempt to upload a file
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="spinner-frame-upload"]') as HTMLInputElement | null;
      if (input) {
        input.disabled = false;
      }
    });

    // Provide a small dummy file
    const file = { name: 'frame.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) };
    await page.setInputFiles('[data-testid="spinner-frame-upload"]', file);

    const dialog = await alertPromise;
    expect(dialog.message()).toContain('Có lỗi khi upload frames');
    await dialog.dismiss();
  });
});

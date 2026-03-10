import { test, expect, type Route } from '@playwright/test';
import { MAX_SPINNER_FRAMES } from '../../src/constants/spinner';

// Helper to create a fake item response with max frames
function createItemResponseWithFrames(frameCount = MAX_SPINNER_FRAMES) {
  const frames = Array.from({ length: frameCount }, (_, i) => ({
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
  test('disables upload and shows warning when max frames are already present', async ({ page }) => {
    // Ensure auth check passes
    await page.route('**/api/v1/auth/me', (route: Route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUserResponse) });
    });

    // Return an item that already has 48 frames in its spin set
    await page.route('**/api/v1/items/1', (route: Route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createItemResponseWithFrames()) });
    });

    // Fail fast if the page attempts to upload another frame (UI should block)
    await page.route('**/api/v1/spin-sets/*/frames', () => {
      throw new Error('Upload should not be attempted when max frames reached');
    });

    await page.goto('/admin/items/1?step=3');

    // Ensure warning message is visible and upload input is disabled
    await expect(page.getByText(new RegExp(`Đã đạt giới hạn ${MAX_SPINNER_FRAMES} frames`))).toBeVisible();
    await expect(page.getByTestId('spinner-frame-upload')).toBeDisabled();
  });

  test('shows error when API rejects upload even when UI still allows selecting file', async ({ page }) => {
    await page.addInitScript(() => {
      const alerts: string[] = [];
      (window as unknown as { __alerts: string[] }).__alerts = alerts;
      window.alert = (message?: string) => {
        alerts.push(String(message ?? ''));
      };
    });

    await page.route('**/api/v1/auth/me', (route: Route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUserResponse) });
    });

    // Return an item below limit so UI still allows selecting a file
    await page.route('**/api/v1/items/1', (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createItemResponseWithFrames(MAX_SPINNER_FRAMES - 1)),
      });
    });

    // Simulate backend rejecting upload (e.g. concurrent updates already reached limit)
    await page.route('**/api/v1/spin-sets/*/frames', (route: Route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: { code: 'MAX_FRAMES', message: 'Max frames reached' } }),
      });
    });

    await page.goto('/admin/items/1?step=3');
    await expect(page.getByTestId('spinner-frame-upload')).toBeEnabled();
    await expect.poll(async () => {
      return page.evaluate(() => {
        const alerts = (window as unknown as { __alerts?: string[] }).__alerts ?? [];
        return alerts.length;
      });
    }).toBe(0);

    // Provide a small dummy file
    const file = { name: 'frame.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) };
    await page.setInputFiles('[data-testid="spinner-frame-upload"]', file);

    await expect.poll(async () => {
      return page.evaluate(() => {
        const alerts = (window as unknown as { __alerts?: string[] }).__alerts ?? [];
        return alerts.length;
      });
    }).toBeGreaterThan(0);

    const alerts = await page.evaluate(() => {
      return (window as unknown as { __alerts?: string[] }).__alerts ?? [];
    });
    expect(alerts.some((msg) => msg.includes('Có lỗi khi upload frames'))).toBeTruthy();
  });
});

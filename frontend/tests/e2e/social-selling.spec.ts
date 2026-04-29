import { test, expect, stubAuthCsrf, apiOk, type Route } from './fixtures';
import { buildItemDetailEnvelope, type SpinFrameMock } from './utils/item-detail-mocks';

const ITEM_ID = '88';

const minimalFrames: SpinFrameMock[] = [
  {
    id: 'sf1',
    spin_set_id: 'spin-e2e',
    frame_index: 0,
    image_url: 'https://placehold.co/40x40/png',
    thumbnail_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

test.describe('Social selling (AI FB)', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await stubAuthCsrf(authenticatedPage);

    await authenticatedPage.route('**/api/v1/categories?type=*', (route: Route) =>
      route.fulfill({ json: apiOk({ categories: [] }) }),
    );

    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}`, (route: Route) => {
      if (route.request().method() !== 'GET') {
        return route.continue();
      }
      return route.fulfill({ json: buildItemDetailEnvelope(ITEM_ID, minimalFrames) });
    });
  });

  test('AI generate fills caption from fb-post response', async ({ authenticatedPage }) => {
    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}/fb-post`, (route: Route) =>
      route.fulfill({
        json: apiOk({
          content: 'E2E generated FB caption',
        }),
      }),
    );

    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=4`);

    await authenticatedPage.getByRole('button', { name: /Tạo bài FB bằng AI/i }).click();

    const ta = authenticatedPage.getByPlaceholder(/Nội dung bài FB sẽ hiển thị ở đây/i);
    await expect(ta).toHaveValue('E2E generated FB caption', { timeout: 15_000 });
  });

  test('save caption PATCHes item and add link posts facebook-posts', async ({ authenticatedPage }) => {
    const patches: unknown[] = [];
    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}`, (route: Route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({ json: buildItemDetailEnvelope(ITEM_ID, minimalFrames) });
      }
      if (method === 'PATCH') {
        patches.push(route.request().postDataJSON());
        return route.fulfill({
          json: apiOk({
            item: { id: ITEM_ID, fb_post_content: 'Saved for E2E' },
          }),
        });
      }
      return route.continue();
    });

    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}/facebook-posts`, (route: Route) =>
      route.fulfill({
        json: apiOk({
          post: {
            id: 'post-e2e',
            item_id: ITEM_ID,
            post_url: 'https://www.facebook.com/e2e-post',
            content: 'Saved for E2E',
            posted_at: '2026-04-29T12:00:00.000Z',
            created_at: '2026-04-29T12:00:00.000Z',
          },
        }),
      }),
    );

    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=4`);

    await authenticatedPage.getByPlaceholder(/Nội dung bài FB sẽ hiển thị ở đây/i).fill('Saved for E2E');
    await authenticatedPage.getByRole('button', { name: /Lưu nội dung/i }).click();

    await expect.poll(() => patches.length).toBeGreaterThanOrEqual(1);
    expect(patches.some((p) => (p as { fb_post_content?: string }).fb_post_content === 'Saved for E2E')).toBeTruthy();

    await authenticatedPage.getByPlaceholder('https://www.facebook.com/...').fill('https://www.facebook.com/e2e-post');
    await authenticatedPage.getByRole('button', { name: /Thêm link FB/i }).click();

    await expect(authenticatedPage.getByText(/facebook.com\/e2e-post/i)).toBeVisible({ timeout: 15_000 });
  });
});

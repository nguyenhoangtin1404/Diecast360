import { test, expect, stubAuthCsrf, apiOk, type Route } from './fixtures';
import { buildItemDetailEnvelope, type SpinFrameMock } from './utils/item-detail-mocks';

const ITEM_ID = '99';

function twoFrames(): SpinFrameMock[] {
  return [
    {
      id: 'frame-a',
      spin_set_id: 'spin-e2e',
      frame_index: 0,
      image_url: 'https://placehold.co/80x80/png?text=A',
      thumbnail_url: null,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'frame-b',
      spin_set_id: 'spin-e2e',
      frame_index: 1,
      image_url: 'https://placehold.co/80x80/png?text=B',
      thumbnail_url: null,
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ];
}

test.describe('Spinner 360 workflow', () => {
  test('reorder frames calls PATCH with new order and refetches item', async ({ authenticatedPage }) => {
    await stubAuthCsrf(authenticatedPage);

    let frames = twoFrames();

    await authenticatedPage.route('**/api/v1/categories?type=*', (route: Route) =>
      route.fulfill({ json: apiOk({ categories: [] }) }),
    );

    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}`, (route: Route) => {
      if (route.request().method() !== 'GET') {
        return route.continue();
      }
      return route.fulfill({ json: buildItemDetailEnvelope(ITEM_ID, frames) });
    });

    let orderBody: { frame_ids?: string[] } | null = null;
    await authenticatedPage.route('**/api/v1/spin-sets/spin-e2e/frames/order', async (route: Route) => {
      orderBody = route.request().postDataJSON() as { frame_ids?: string[] };
      const ids = orderBody?.frame_ids ?? [];
      frames = ids.map((id, i) => {
        const base = twoFrames().find((f) => f.id === id)!;
        return { ...base, frame_index: i };
      });
      await route.fulfill({ json: apiOk({}) });
    });

    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=3`);

    await expect(authenticatedPage.getByText(/Frames \(2\)/)).toBeVisible();
    await expect(authenticatedPage.getByText('Frame 1')).toBeVisible();
    await expect(authenticatedPage.getByText('Frame 2')).toBeVisible();

    const downButtons = authenticatedPage.getByRole('button', { name: '↓' });
    await downButtons.first().click();

    await expect.poll(() => orderBody?.frame_ids).toEqual(['frame-b', 'frame-a']);

    await expect(authenticatedPage.getByText('Frame 1')).toBeVisible();
    await expect(authenticatedPage.getByText('Frame 2')).toBeVisible();
  });

  test('upload frame sends multipart to spin-sets frames endpoint', async ({ authenticatedPage }) => {
    await stubAuthCsrf(authenticatedPage);

    const initial: SpinFrameMock[] = [
      {
        id: 'frame-1',
        spin_set_id: 'spin-e2e',
        frame_index: 0,
        image_url: 'https://placehold.co/80x80/png?text=1',
        thumbnail_url: null,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ];

    let frames = [...initial];

    await authenticatedPage.route('**/api/v1/categories?type=*', (route: Route) =>
      route.fulfill({ json: apiOk({ categories: [] }) }),
    );

    await authenticatedPage.route(`**/api/v1/items/${ITEM_ID}`, (route: Route) => {
      if (route.request().method() !== 'GET') {
        return route.continue();
      }
      return route.fulfill({ json: buildItemDetailEnvelope(ITEM_ID, frames) });
    });

    let uploadSeen = false;
    await authenticatedPage.route('**/api/v1/spin-sets/spin-e2e/frames', async (route: Route) => {
      if (route.request().method() !== 'POST') {
        return route.continue();
      }
      uploadSeen = true;
      frames = [
        ...initial,
        {
          id: 'frame-new',
          spin_set_id: 'spin-e2e',
          frame_index: 1,
          image_url: 'https://placehold.co/80x80/png?text=N',
          thumbnail_url: null,
          created_at: '2026-01-02T00:00:00.000Z',
        },
      ];
      await route.fulfill({ json: apiOk({ frame: frames[1] }) });
    });

    await authenticatedPage.goto(`/admin/items/${ITEM_ID}?step=3`);

    await expect(authenticatedPage.getByTestId('spinner-frame-upload')).toBeEnabled();

    const file = {
      name: 'new-frame.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]),
    };
    await authenticatedPage.setInputFiles('[data-testid="spinner-frame-upload"]', file);

    await expect.poll(() => uploadSeen).toBe(true);
    await expect(authenticatedPage.getByText(/Frames \(2\)/)).toBeVisible({ timeout: 15_000 });
  });
});

import { apiOk } from '../fixtures';

export type SpinFrameMock = {
  id: string;
  spin_set_id: string;
  frame_index: number;
  image_url: string;
  thumbnail_url: string | null;
  created_at: string;
};

export function buildItemDetailEnvelope(itemId: string, frames: SpinFrameMock[]) {
  return apiOk({
    item: {
      id: itemId,
      name: 'E2E Product',
      description: 'desc',
      status: 'con_hang',
      is_public: false,
      condition: 'new',
      price: 1000000,
      original_price: null,
      scale: '1:64',
      brand: 'Brand',
      quantity: 1,
      attributes: {},
      fb_post_content: '',
    },
    images: [
      {
        id: `img-${itemId}`,
        item_id: itemId,
        url: 'https://placehold.co/120x90/png',
        thumbnail_url: 'https://placehold.co/120x90/png',
        is_cover: true,
        display_order: 0,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    spin_sets: [
      {
        id: 'spin-e2e',
        item_id: itemId,
        label: 'Default',
        is_default: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        frames,
      },
    ],
    facebook_posts: [] as unknown[],
  });
}

// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemDetailPage } from '../../src/pages/admin/ItemDetailPage';

type Params = { id: string };

const h = vi.hoisted(() => ({
  params: { id: '1' } as Params,
  search: '',
  mockItemResponse: {} as unknown,
  mockNavigate: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockShowToast: vi.fn(),
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({ data: {} })),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({ ok: true, data: { item: { id: 'new123' } } })),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({ ok: true, data: { item: { id: '1' } } })),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({})),
  },
}));

function createBaseItemData() {
  return {
    item: {
      id: '1',
      name: 'Ferrari F40',
      description: '',
      status: 'con_hang',
      is_public: false,
      condition: 'new',
    },
    images: [
      {
        id: 'img1',
        item_id: '1',
        url: 'https://img.example/1.jpg',
        thumbnail_url: null,
        is_cover: true,
        display_order: 0,
        created_at: '2026-01-01',
      },
    ],
    spin_sets: [
      {
        id: 'spin1',
        item_id: '1',
        label: 'Default',
        is_default: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        frames: [
          {
            id: 'frame1',
            spin_set_id: 'spin1',
            frame_index: 0,
            image_url: 'https://img.example/f1.jpg',
            thumbnail_url: null,
            created_at: '2026-01-01',
          },
        ],
      },
    ],
    facebook_posts: [],
  };
}

vi.mock('react-router-dom', () => ({
  useParams: () => h.params,
  useNavigate: () => h.mockNavigate,
  useSearchParams: () => [new URLSearchParams(h.search)],
}));

vi.mock('../../src/api/client', () => ({
  apiClient: h.apiClient,
  uploadFile: vi.fn(async () => ({})),
}));

vi.mock('../../src/utils/toast', () => ({
  showToast: (...args: unknown[]) => h.mockShowToast(...args),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'item') {
      return { data: h.mockItemResponse, isLoading: false };
    }
    if (queryKey[0] === 'categories') {
      return { data: { categories: [] }, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  },
  useQueryClient: () => ({
    invalidateQueries: h.mockInvalidateQueries,
  }),
  useMutation: (options: {
    mutationFn: (vars: unknown) => Promise<unknown>;
    onSuccess?: (response: unknown, variables: unknown) => void | Promise<void>;
  }) => {
    const mutateAsync = vi.fn(async (vars: unknown) => {
        const response = await options.mutationFn(vars);
        if (options.onSuccess) {
          await options.onSuccess(response, vars);
        }
        return response;
      });
    return {
      mutate: (vars: unknown) => void mutateAsync(vars),
      mutateAsync,
      isPending: false,
    };
  },
}));

describe('ItemDetailPage main flows', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    h.params = { id: '1' };
    h.search = '';
    h.mockItemResponse = createBaseItemData();
    h.apiClient.get.mockImplementation(async () => ({ data: h.mockItemResponse }));
    h.apiClient.post.mockImplementation(async () => ({ ok: true, data: { item: { id: 'new123' } } }));
    h.apiClient.patch.mockImplementation(async () => ({ ok: true, data: { item: { id: '1' } } }));
    h.mockNavigate.mockReset();
    h.mockInvalidateQueries.mockReset();
    h.mockShowToast.mockReset();
  });

  it('does not submit when pressing Enter in step 1 input', async () => {
    render(<ItemDetailPage />);
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.keyDown(nameInput, { key: 'Enter', code: 'Enter' });
    await waitFor(() => {
      expect(h.apiClient.patch).not.toHaveBeenCalled();
      expect(h.apiClient.post).not.toHaveBeenCalled();
    });
  });

  it('auto-saves when clicking directly on stepper step', async () => {
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('Ferrari F40');
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Hình ảnh/i })[0]);

    await waitFor(() => {
      expect(h.apiClient.patch).toHaveBeenCalled();
    });
    expect(h.apiClient.patch).toHaveBeenCalledWith(
      '/items/1',
      expect.objectContaining({ name: 'Ferrari F40' }),
    );
  });

  it('navigates to step 2 URL after creating from step 1', async () => {
    h.params = { id: 'new' };
    h.mockItemResponse = { item: null, images: [], spin_sets: [], facebook_posts: [] };
    h.apiClient.post.mockResolvedValueOnce({ ok: true, data: { item: { id: 'new123' } } });

    render(<ItemDetailPage />);
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Porsche 911' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Bước tiếp/i })[0]);

    await waitFor(() => {
      expect(h.apiClient.post).toHaveBeenCalled();
      expect(h.mockNavigate).toHaveBeenCalledWith('/admin/items/new123?step=2');
    });
  });

  it('allows finishing and returns to list when media is complete', async () => {
    render(<ItemDetailPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /AI gen nội dung FB/i })[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Hoàn tất/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Hoàn tất/i }));

    await waitFor(() => {
      expect(h.mockNavigate).toHaveBeenCalledWith('/admin/items');
    });
  });
  it('disables upload input and shows limit message when 48 frames are already present', async () => {
    const maxFramesResponse = createBaseItemData();
    // Replace the single frame with 48 frames
    maxFramesResponse.spin_sets[0].frames = Array.from({ length: 48 }, (_, i) => ({
      id: `frame-${i + 1}`,
      spin_set_id: 'spin1',
      frame_index: i,
      image_url: `https://img.example/f${i + 1}.jpg`,
      thumbnail_url: null,
      created_at: '2026-01-01',
    }));

    h.mockItemResponse = maxFramesResponse;
    h.apiClient.get.mockImplementation(async () => ({ data: h.mockItemResponse }));

    render(<ItemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Đã đạt giới hạn 48 frames/)).toBeTruthy();
    });

    const fileInput = screen.getByTestId('spinner-frame-upload') as HTMLInputElement;
    expect(fileInput.disabled).toBe(true);
  });});

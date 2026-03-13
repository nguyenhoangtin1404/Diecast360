// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemDetailPage } from '../../src/pages/admin/ItemDetailPage';
import { MAX_SPINNER_FRAMES } from '../../src/constants/spinner';

type Params = { id: string };

const h = vi.hoisted(() => ({
  params: { id: '1' } as Params,
  search: '',
  mockItemResponse: {} as unknown,
  mockNavigate: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockShowToast: vi.fn(),
  uploadFile: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({})),
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
  uploadFile: (...args: unknown[]) => h.uploadFile(...args),
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
    h.uploadFile.mockReset();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async () => undefined),
      },
    });
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
  it('disables upload input and shows limit message when max frames are already present', async () => {
    const maxFramesResponse = createBaseItemData();
    // Replace the single frame with max frames
    maxFramesResponse.spin_sets[0].frames = Array.from({ length: MAX_SPINNER_FRAMES }, (_, i) => ({
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
      expect(screen.getByText(new RegExp(`Đã đạt giới hạn ${MAX_SPINNER_FRAMES} frames`))).toBeTruthy();
    });

    const fileInput = screen.getByTestId('spinner-frame-upload') as HTMLInputElement;
    expect(fileInput.disabled).toBe(true);
  });

  it('uses flattened fb-post response shape and fills the caption textarea', async () => {
    h.search = 'step=4';
    h.apiClient.post.mockResolvedValueOnce({
      data: {
        content: 'Caption from AI',
      },
    });

    render(<ItemDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: /Tạo bài FB bằng AI/i }));

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText(/Nội dung bài FB sẽ hiển thị ở đây/i) as HTMLTextAreaElement).value,
      ).toBe('Caption from AI');
    });
  });

  it('invalidates items, fb-posts, and item detail when saving fb post content', async () => {
    h.search = 'step=4';
    render(<ItemDetailPage />);

    const textarea = screen.getByPlaceholderText(/Nội dung bài FB sẽ hiển thị ở đây/i);
    fireEvent.change(textarea, { target: { value: 'Saved caption' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu nội dung/i }));

    await waitFor(() => {
      expect(h.apiClient.patch).toHaveBeenCalledWith('/items/1', { fb_post_content: 'Saved caption' });
    });
    expect(h.mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['items'] });
    expect(h.mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['fb-posts'] });
    expect(h.mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['item', '1'] });
  });

  it('stores current caption snapshot when adding a facebook post link', async () => {
    h.search = 'step=4';
    h.apiClient.post.mockResolvedValueOnce({
      data: {
        post: {
          id: 'post-1',
          item_id: '1',
          post_url: 'https://facebook.com/post-1',
          content: 'Caption snapshot',
          posted_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      },
    });

    render(<ItemDetailPage />);

    fireEvent.change(screen.getByPlaceholderText(/Nội dung bài FB sẽ hiển thị ở đây/i), {
      target: { value: 'Caption snapshot' },
    });
    fireEvent.change(screen.getByPlaceholderText('https://www.facebook.com/...'), {
      target: { value: 'https://facebook.com/post-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Thêm link FB/i }));

    await waitFor(() => {
      expect(h.apiClient.post).toHaveBeenCalledWith('/items/1/facebook-posts', {
        post_url: 'https://facebook.com/post-1',
        content: 'Caption snapshot',
      });
    });
    expect(h.mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['fb-posts'] });
  });

  it('uploads multiple images and invalidates item query after each upload', async () => {
    const noImageResponse = createBaseItemData();
    noImageResponse.images = [];
    h.mockItemResponse = noImageResponse;
    h.apiClient.get.mockImplementation(async () => ({ data: h.mockItemResponse }));

    render(<ItemDetailPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /Hình ảnh/i })[0]);

    const fileInput = await screen.findByLabelText('Upload item images');
    const file1 = new File([new Uint8Array([1, 2, 3])], 'img-1.jpg', { type: 'image/jpeg' });
    const file2 = new File([new Uint8Array([4, 5, 6])], 'img-2.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(h.uploadFile).toHaveBeenCalledTimes(2);
    });

    const firstForm = h.uploadFile.mock.calls[0][1] as FormData;
    const secondForm = h.uploadFile.mock.calls[1][1] as FormData;
    expect(firstForm.get('is_cover')).toBe('true');
    expect(secondForm.get('is_cover')).toBe('false');
    expect(h.mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['item', '1'] });
  });

  it('keeps UI in sync when setting cover then deleting previous cover image', async () => {
    h.mockItemResponse = {
      ...createBaseItemData(),
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
        {
          id: 'img2',
          item_id: '1',
          url: 'https://img.example/2.jpg',
          thumbnail_url: null,
          is_cover: false,
          display_order: 1,
          created_at: '2026-01-01',
        },
      ],
    };
    h.apiClient.get.mockImplementation(async () => ({ data: h.mockItemResponse }));

    render(<ItemDetailPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /Hình ảnh/i })[0]);

    const setCoverButtons = await screen.findAllByRole('button', { name: /Đặt làm ảnh đại diện/i });
    fireEvent.click(setCoverButtons[0]);

    await waitFor(() => {
      expect(h.apiClient.patch).toHaveBeenCalledWith('/items/1/images/img2', { is_cover: true });
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Xóa' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(h.apiClient.delete).toHaveBeenCalledWith('/items/1/images/img1');
    });

    expect(h.mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['item', '1'] });
  });
});

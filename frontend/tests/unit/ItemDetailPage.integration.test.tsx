// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemDetailPage } from '../../src/pages/admin/ItemDetailPage';

type Params = { id: string };

const h = vi.hoisted(() => ({
  params: { id: '1' } as Params,
  search: '',
  mockNavigate: vi.fn(),
  mockShowToast: vi.fn(),
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({ data: {} })),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({ ok: true, data: { item: { id: '1' } } })),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({ ok: true, data: { item: { id: '1' } } })),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({})),
  },
}));

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

vi.mock('../../src/components/Spinner360/Spinner360', () => ({
  Spinner360: () => <div>Spinner360</div>,
}));

vi.mock('../../src/components/admin/CategoryQuickManage', () => ({
  CategoryQuickManage: () => <div />,
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createItemData() {
  return {
    item: {
      id: '1',
      name: 'Ferrari F40',
      description: '',
      status: 'con_hang',
      is_public: false,
      condition: 'new',
      scale: '1:64',
      brand: 'MiniGT',
      price: 1000000,
      original_price: 1200000,
    },
    images: [],
    spin_sets: [],
    facebook_posts: [],
  };
}

describe('ItemDetailPage integration (real React Query)', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    h.params = { id: '1' };
    h.search = '';
    h.mockNavigate.mockReset();
    h.mockShowToast.mockReset();
    h.apiClient.patch.mockReset();
    h.apiClient.post.mockReset();
    h.apiClient.get.mockImplementation(async (...args: unknown[]) => {
      const urlStr = typeof args[0] === 'string' ? args[0] : '';
      if (urlStr.startsWith('/items/')) {
        return { data: createItemData() };
      }
      if (urlStr.startsWith('/categories?type=')) {
        return { data: { categories: [] } };
      }
      return { data: {} };
    });
  });

  it('auto-saves before switching to step 2 when clicking stepper directly', async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('Ferrari F40');
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Hình ảnh/i })[0]);

    await waitFor(() => {
      expect(h.apiClient.patch).toHaveBeenCalledWith(
        '/items/1',
        expect.objectContaining({ name: 'Ferrari F40' }),
      );
    });

    expect(screen.getByText('Chưa có ảnh nào được upload.')).toBeTruthy();
    expect(screen.getByLabelText('Upload item images')).toBeTruthy();
  });

  it('stays on create page and shows toast when create response has no item id', async () => {
    h.params = { id: 'new' };
    h.apiClient.get.mockImplementation(async (...args: unknown[]) => {
      const urlStr = typeof args[0] === 'string' ? args[0] : '';
      if (urlStr.startsWith('/categories?type=')) {
        return { data: { categories: [] } };
      }
      return { data: {} };
    });
    const missingItemIdResponse = { ok: true, data: {} };
    h.apiClient.post.mockResolvedValueOnce(missingItemIdResponse);

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
    });
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Test Create Missing Id' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Bước tiếp/i })[0]);

    await waitFor(() => {
      expect(h.apiClient.post).toHaveBeenCalled();
      expect(h.mockNavigate).not.toHaveBeenCalled();
      expect(h.mockShowToast).toHaveBeenCalledWith('Không thể tạo sản phẩm. Vui lòng thử lại.');
    });
  });

  it('does not trigger duplicate auto-save when clicking step quickly twice', async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('Ferrari F40');
    });

    const step2Btn = screen.getAllByRole('button', { name: /Hình ảnh/i })[0];
    fireEvent.click(step2Btn);
    fireEvent.click(step2Btn);

    await waitFor(() => {
      expect(h.apiClient.patch).toHaveBeenCalledTimes(1);
    });
  });
});

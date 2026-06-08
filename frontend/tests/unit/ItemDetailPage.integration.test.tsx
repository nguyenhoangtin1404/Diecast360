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
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('a', { href: String(to), ...rest }, children),
  useSearchParams: () => {
    const [params, setParams] = React.useState(() => new URLSearchParams(h.search));
    const setSearchParams = React.useCallback(
      (next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => {
        setParams((prev) => {
          const resolved = typeof next === 'function' ? next(prev) : next;
          h.search = resolved.toString();
          return new URLSearchParams(resolved.toString());
        });
      },
      [],
    );
    return [params, setSearchParams] as const;
  },
}));

vi.mock('../../src/hooks/useShop', () => ({
  useShop: () => ({
    activeShop: { id: 'shop-1', name: 'Test Shop', slug: 'test-shop', is_active: true, role: 'shop_admin' },
    allowedShops: [],
    switchShop: vi.fn(),
    loading: false,
  }),
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

  it('writes ?step= to the URL when advancing the wizard via the stepper', async () => {
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
      expect(h.search).toContain('step=2');
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

describe('Pre-order campaign button', () => {
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

  it('renders the Pre-order campaign button for an existing item', async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Chiến dịch Pre-order/i)).toBeTruthy();
    });
  });

  it('Pre-order campaign button links to /admin/preorders/create?item_id=1', async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const btn = screen.getByText(/Chiến dịch Pre-order/i).closest('a');
      expect(btn).toBeTruthy();
      expect((btn as HTMLAnchorElement).href).toContain('/admin/preorders/create?item_id=1');
    });
  });

  it('does not render the Pre-order campaign button for a new item', async () => {
    h.params = { id: 'new' };
    h.apiClient.get.mockImplementation(async (...args: unknown[]) => {
      const urlStr = typeof args[0] === 'string' ? args[0] : '';
      if (urlStr.startsWith('/categories?type=')) {
        return { data: { categories: [] } };
      }
      return { data: {} };
    });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Tạo sản phẩm mới/i)).toBeTruthy();
    });

    expect(screen.queryByText(/Chiến dịch Pre-order/i)).toBeNull();
  });
});

describe('Pre-order auto-trigger toasts', () => {
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

  it('shows "hàng về" toast when preorders_arrived_count > 0', async () => {
    h.apiClient.patch.mockResolvedValueOnce({
      ok: true,
      data: { item: { id: '1' }, preorders_arrived_count: 3 },
    });

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
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Đã tự động chuyển 3 đơn pre-order sang "Hàng về"',
      );
    });
  });

  it('shows cancel summary toast when auto-cancelled and deposit counts are present', async () => {
    h.apiClient.patch.mockResolvedValueOnce({
      ok: true,
      data: {
        item: { id: '1' },
        preorders_auto_cancelled_count: 2,
        preorders_with_deposit_count: 1,
      },
    });

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
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Pre-order: tự động hủy 2 đơn chưa cọc · 1 đơn đã cọc cần hủy thủ công.',
      );
    });
  });

  it('does not show preorder toast when all counts are zero', async () => {
    h.apiClient.patch.mockResolvedValueOnce({
      ok: true,
      data: {
        item: { id: '1' },
        preorders_arrived_count: 0,
        preorders_auto_cancelled_count: 0,
        preorders_with_deposit_count: 0,
      },
    });

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
      expect(h.apiClient.patch).toHaveBeenCalled();
    });

    expect(h.mockShowToast).not.toHaveBeenCalledWith(
      expect.stringContaining('Đã tự động chuyển'),
    );
    expect(h.mockShowToast).not.toHaveBeenCalledWith(
      expect.stringContaining('Pre-order:'),
    );
  });
});

function createPreorderItemData() {
  return {
    item: {
      id: '1',
      name: 'Ferrari F40',
      description: '',
      status: 'preorder',
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

function mockGetWithSummary(summary: {
  pending: number; waiting: number; arrived: number;
  total: number; cancelable: number; with_deposit: number;
}) {
  h.apiClient.get.mockImplementation(async (...args: unknown[]) => {
    const urlStr = typeof args[0] === 'string' ? args[0] : '';
    if (urlStr.includes('/campaigns/') && urlStr.includes('/summary')) {
      return { data: summary };
    }
    if (urlStr.startsWith('/items/')) {
      return { data: createPreorderItemData() };
    }
    if (urlStr.startsWith('/categories?type=')) {
      return { data: { categories: [] } };
    }
    return { data: {} };
  });
}

describe('Campaign widget', () => {
  afterEach(() => { cleanup(); });

  beforeEach(() => {
    h.params = { id: '1' };
    h.search = '';
    h.mockNavigate.mockReset();
    h.mockShowToast.mockReset();
    h.apiClient.patch.mockReset();
    h.apiClient.post.mockReset();
  });

  it('renders campaign widget with correct counts when item is preorder', async () => {
    mockGetWithSummary({ pending: 2, waiting: 1, arrived: 0, total: 3, cancelable: 1, with_deposit: 1 });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/2 chờ xác nhận/i)).toBeTruthy();
      expect(screen.getByText(/1 chờ hàng/i)).toBeTruthy();
    });
  });

  it('does not render campaign widget when all counts are zero', async () => {
    mockGetWithSummary({ pending: 0, waiting: 0, arrived: 0, total: 0, cancelable: 0, with_deposit: 0 });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('Ferrari F40');
    });

    expect(screen.queryByText(/📋 Chiến dịch/)).toBeNull();
  });

  it('campaign widget count links point to filtered preorders URL', async () => {
    mockGetWithSummary({ pending: 2, waiting: 0, arrived: 0, total: 2, cancelable: 2, with_deposit: 0 });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const link = screen.getByText(/2 chờ xác nhận/i).closest('a');
      expect(link).toBeTruthy();
      expect((link as HTMLAnchorElement).href).toContain('status=PENDING_CONFIRMATION');
      expect((link as HTMLAnchorElement).href).toContain('item_id=1');
    });
  });
});

describe('Confirmation modal — preorder → da_ban', () => {
  afterEach(() => { cleanup(); });

  beforeEach(() => {
    h.params = { id: '1' };
    h.search = '';
    h.mockNavigate.mockReset();
    h.mockShowToast.mockReset();
    h.apiClient.patch.mockReset();
    h.apiClient.post.mockReset();
    mockGetWithSummary({ pending: 1, waiting: 1, arrived: 0, total: 2, cancelable: 2, with_deposit: 0 });
  });

  it('shows confirmation modal when transitioning preorder → da_ban with active orders', async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Pre-order' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Đã bán' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Hình ảnh/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Xác nhận chuyển sang "Đã bán"/i)).toBeTruthy();
    });

    expect(h.apiClient.patch).not.toHaveBeenCalled();
  });

  it('does NOT call patch when modal is dismissed', async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Pre-order' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Đã bán' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Hình ảnh/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Hủy bỏ/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/Hủy bỏ/i));

    expect(h.apiClient.patch).not.toHaveBeenCalled();
    expect(screen.queryByText(/Xác nhận chuyển sang "Đã bán"/i)).toBeNull();
  });

  it('calls patch after confirming modal', async () => {
    h.apiClient.patch.mockResolvedValueOnce({
      ok: true,
      data: { item: { id: '1' }, preorders_auto_cancelled_count: 2, preorders_with_deposit_count: 0 },
    });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ItemDetailPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Pre-order' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Đã bán' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Hình ảnh/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Xác nhận chuyển Đã bán/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/Xác nhận chuyển Đã bán/i));

    await waitFor(() => {
      expect(h.apiClient.patch).toHaveBeenCalledWith(
        '/items/1',
        expect.objectContaining({ status: 'da_ban' }),
      );
    });
  });
});

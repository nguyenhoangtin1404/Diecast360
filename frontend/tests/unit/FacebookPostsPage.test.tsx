// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FacebookPostsPage } from '../../src/pages/admin/FacebookPostsPage';
import type { AdminItem, Pagination } from '../../src/types/item.types';

type FacebookPostsQueryData = {
  items: AdminItem[];
  pagination: Pagination;
};

const h = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({
      data: {
        items: [],
        pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
      },
    })),
  },
  queryData: {
    items: [],
    pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
  } as FacebookPostsQueryData,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => h.mockNavigate,
}));

vi.mock('../../src/api/client', () => ({
  apiClient: h.apiClient,
}));

vi.mock('../../src/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryFn }: { queryFn: () => Promise<unknown> }) => {
    void queryFn();
    return {
      data: h.queryData,
      isLoading: false,
    };
  },
}));

describe('FacebookPostsPage', () => {
  beforeEach(() => {
    h.mockNavigate.mockReset();
    h.apiClient.get.mockClear();
    h.queryData = {
      items: [
        {
          id: 'item-1',
          name: 'MiniGT Skyline',
          status: 'con_hang',
          is_public: true,
          price: 100000,
          fb_post_url: 'https://facebook.com/post-1',
          fb_posted_at: '2026-01-01T00:00:00.000Z',
          fb_posts_count: 2,
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders facebook history badge count from admin items data', async () => {
    render(<FacebookPostsPage />);

    expect(screen.getByText('MiniGT Skyline')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('queries posted items with search term when filters change', async () => {
    render(<FacebookPostsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Đã đăng/i }));
    fireEvent.change(screen.getByPlaceholderText('Tìm sản phẩm...'), {
      target: { value: 'skyline' },
    });

    await waitFor(() => {
      expect(h.apiClient.get).toHaveBeenLastCalledWith('/items?page=1&page_size=20&fb_status=posted&q=skyline');
    });
  });
});

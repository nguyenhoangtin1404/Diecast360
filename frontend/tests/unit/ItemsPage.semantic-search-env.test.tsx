// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({
      data: {
        items: [],
        pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 },
      },
    })),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({})),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({})),
  },
}));

vi.mock('../../src/pages/admin/components/ItemsTable', () => ({
  ItemsTable: () => <div data-testid="items-table" />,
}));

vi.mock('../../src/pages/admin/components/PaginationControl', () => ({
  PaginationControl: () => <div data-testid="pagination-control" />,
}));

vi.mock('../../src/pages/admin/components/DeleteConfirmModal', () => ({
  DeleteConfirmModal: () => null,
}));

vi.mock('../../src/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryFn }: { queryFn: () => Promise<unknown> }) => {
    void queryFn();
    return {
      data: { items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } },
      isLoading: false,
      error: null,
    };
  },
  useMutation: () => ({
    mutateAsync: vi.fn(async () => ({})),
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.clearAllMocks();
});

const setupAndRender = async (semanticEnabled: boolean) => {
  vi.doMock('../../src/config/api', () => ({
    API_CONFIG: {
      BASE_URL: 'http://localhost:3000/api/v1',
      ADMIN_SEMANTIC_SEARCH_ENABLED: semanticEnabled,
      TIMEOUT: 30000,
      HEADERS: { 'Content-Type': 'application/json' },
    },
  }));

  vi.doMock('../../src/api/client', () => ({
    apiClient: h.apiClient,
  }));

  vi.doMock('../../src/pages/admin/components/SearchHeader', () => ({
    SearchHeader: ({ search, onSearchChange }: { search: string; onSearchChange: (v: string) => void }) => (
      <input
        aria-label="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    ),
  }));

  const module = await import('../../src/pages/admin/ItemsPage');
  render(<module.ItemsPage />);
};

describe('ItemsPage semantic search env toggle', () => {
  it('calls /items/search when semantic search is enabled', async () => {
    await setupAndRender(true);

    fireEvent.change(screen.getByLabelText('search'), { target: { value: 'ferrari' } });

    await waitFor(() => {
      expect(h.apiClient.get).toHaveBeenCalledWith('/items/search?q=ferrari');
    });
  });

  it('calls /items with q param when semantic search is disabled', async () => {
    await setupAndRender(false);

    fireEvent.change(screen.getByLabelText('search'), { target: { value: 'ferrari' } });

    await waitFor(() => {
      expect(h.apiClient.get).toHaveBeenCalledWith('/items?page=1&page_size=20&q=ferrari');
    });
  });
});

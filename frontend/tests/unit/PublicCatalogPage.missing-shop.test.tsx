// @vitest-environment jsdom

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicCatalogPage } from '../../src/pages/PublicCatalogPage';

const setSearchParamsMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [currentSearchParams, setSearchParamsMock],
}));

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock('../../src/hooks/usePublicShopContext', () => ({
  usePublicShopContext: () => ({
    effectiveShopId: '',
    queryShopId: '',
    envShopId: '',
    authLoading: false,
    shopContextReady: true,
    publicApiShopReady: false,
  }),
}));

vi.mock('../../src/components/catalog/ItemCard', () => ({
  ItemCard: () => null,
}));
vi.mock('../../src/components/catalog/InfiniteScrollTrigger', () => ({
  InfiniteScrollTrigger: () => null,
}));
vi.mock('../../src/components/catalog/CatalogSort', () => ({
  CatalogSort: () => null,
}));
vi.mock('../../src/components/catalog/CatalogFilters', () => ({
  CatalogFilters: () => null,
}));
vi.mock('../../src/components/catalog/CatalogSearchInput', () => ({
  CatalogSearchInput: () => null,
}));

describe('PublicCatalogPage missing shop scope', () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    setSearchParamsMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows guidance when publicApiShopReady is false', () => {
    render(<PublicCatalogPage />);
    expect(screen.getByText('Chưa chọn cửa hàng')).toBeVisible();
    expect(screen.getByText(/VITE_PUBLIC_CATALOG_SHOP_ID/)).toBeVisible();
  });
});

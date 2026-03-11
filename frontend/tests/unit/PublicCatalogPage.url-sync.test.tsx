// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicCatalogPage } from '../../src/pages/PublicCatalogPage';

let currentSearchParams = new URLSearchParams();
const setSearchParamsMock = vi.fn();
const useInfiniteQueryMock = vi.fn();
const appliedSearchParams: string[] = [];

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [currentSearchParams, setSearchParamsMock],
}));

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: (options: unknown) => useInfiniteQueryMock(options),
}));

vi.mock('../../src/components/catalog/ItemCard', () => ({
  ItemCard: () => <div>item-card</div>,
}));

vi.mock('../../src/components/catalog/InfiniteScrollTrigger', () => ({
  InfiniteScrollTrigger: () => null,
}));

vi.mock('../../src/components/catalog/CatalogSort', () => ({
  CatalogSort: ({ onSortChange }: { onSortChange: (sortBy: 'name' | 'price' | 'created_at', sortOrder: 'asc' | 'desc') => void }) => (
    <button onClick={() => onSortChange('price', 'asc')}>change-sort</button>
  ),
}));

vi.mock('../../src/components/catalog/CatalogFilters', () => ({
  CatalogFilters: ({ onCarBrandChange }: { onCarBrandChange: (brand: string | null) => void }) => (
    <button onClick={() => onCarBrandChange('Honda')}>change-brand</button>
  ),
}));

describe('PublicCatalogPage URL sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setSearchParamsMock.mockClear();
    appliedSearchParams.length = 0;
    setSearchParamsMock.mockImplementation((nextSearchParams: unknown) => {
      if (typeof nextSearchParams === 'function') {
        currentSearchParams = (nextSearchParams as (prev: URLSearchParams) => URLSearchParams)(
          currentSearchParams,
        );
      } else {
        currentSearchParams = new URLSearchParams(nextSearchParams as URLSearchParams);
      }
      appliedSearchParams.push(currentSearchParams.toString());
    });
    useInfiniteQueryMock.mockReset();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [{ items: [] }] },
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should derive state from URL params on mount', () => {
    currentSearchParams = new URLSearchParams(
      'q=%20civic%20&car_brand=Toyota&condition=old&sort_by=name&sort_order=asc',
    );

    render(<PublicCatalogPage />);

    expect(
      (screen.getByPlaceholderText('Tìm kiếm theo tên...') as HTMLInputElement).value,
    ).toBe('civic');

    const firstCallArgs = useInfiniteQueryMock.mock.calls[0][0] as { queryKey: unknown[] };
    expect(firstCallArgs.queryKey).toEqual([
      'public-items',
      'civic',
      'Toyota',
      null,
      'old',
      'name',
      'asc',
    ]);
  });

  it('should update URL when filters, sort, and search input change', () => {
    currentSearchParams = new URLSearchParams('q=civic');

    render(<PublicCatalogPage />);

    fireEvent.click(screen.getByText('change-brand'));
    fireEvent.click(screen.getByText('change-sort'));
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm theo tên...'), {
      target: { value: 'mx5' },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(appliedSearchParams).toContain('q=civic&car_brand=Honda');
    expect(appliedSearchParams).toContain('q=civic&car_brand=Honda&sort_by=price&sort_order=asc');
    expect(appliedSearchParams).toContain('q=mx5&car_brand=Honda&sort_by=price&sort_order=asc');
    expect(appliedSearchParams.at(-1)).toBe('q=mx5&car_brand=Honda&sort_by=price&sort_order=asc');
  });

  it('should not reset search input when URL q changes from external navigation', () => {
    currentSearchParams = new URLSearchParams('q=civic');

    const { rerender } = render(<PublicCatalogPage />);
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm theo tên...'), {
      target: { value: 'supra ' },
    });

    currentSearchParams = new URLSearchParams('q=skyline');
    rerender(<PublicCatalogPage />);

    expect(
      (screen.getByPlaceholderText('Tìm kiếm theo tên...') as HTMLInputElement).value,
    ).toBe('supra ');
  });
});

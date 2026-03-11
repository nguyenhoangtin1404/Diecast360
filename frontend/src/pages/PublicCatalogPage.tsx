import { useState, useMemo, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ItemCard } from '../components/catalog/ItemCard';
import { CatalogSearchInput } from '../components/catalog/CatalogSearchInput';
import { CatalogFilters } from '../components/catalog/CatalogFilters';
import { CatalogSort } from '../components/catalog/CatalogSort';
import { InfiniteScrollTrigger } from '../components/catalog/InfiniteScrollTrigger';
import type { PublicItem } from '../types/item.types';
import { useDebounce } from '../hooks/useDebounce';
import {
  buildCatalogSearchParams,
  parseCatalogUrlState,
  type CatalogSortBy,
  type CatalogSortOrder,
} from './publicCatalogUrlState';

export const PublicCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(() => parseCatalogUrlState(searchParams), [searchParams]);
  const [searchInput, setSearchInput] = useState(() => urlState.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  const commitUrlState = useCallback(
    (
      updater: (state: ReturnType<typeof parseCatalogUrlState>) => ReturnType<typeof parseCatalogUrlState>,
    ) => {
      setSearchParams((currentSearchParams) => {
        const currentState = parseCatalogUrlState(currentSearchParams);
        const nextState = updater(currentState);
        const nextParams = buildCatalogSearchParams(nextState);
        return nextParams.toString() === currentSearchParams.toString()
          ? currentSearchParams
          : nextParams;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const updateSearchInUrl = useCallback((nextSearch: string) => {
    commitUrlState((currentState) => {
      return {
        ...currentState,
        search: nextSearch,
      };
    });
  }, [commitUrlState]);

  useEffect(() => {
    updateSearchInUrl(debouncedSearch);
  }, [debouncedSearch, updateSearchInUrl]);

  const updateUrlState = useCallback((
    patch: Partial<{
      carBrand: string | null;
      modelBrand: string | null;
      condition: 'new' | 'old' | null;
      sortBy: CatalogSortBy;
      sortOrder: CatalogSortOrder;
    }>,
  ) => {
    commitUrlState((currentState) => ({
      ...currentState,
      ...patch,
    }));
  }, [commitUrlState]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      'public-items',
      urlState.search,
      urlState.carBrand,
      urlState.modelBrand,
      urlState.condition,
      urlState.sortBy,
      urlState.sortOrder,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        page_size: '20',
      });
      if (urlState.search) params.append('q', urlState.search);
      if (urlState.carBrand) params.append('car_brand', urlState.carBrand);
      if (urlState.modelBrand) params.append('model_brand', urlState.modelBrand);
      if (urlState.condition) params.append('condition', urlState.condition);
      params.append('sort_by', urlState.sortBy);
      params.append('sort_order', urlState.sortOrder);

      const response = await apiClient.get(`/public/items?${params.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      if (pagination.page < pagination.total_pages) {
        return pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const items = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) || [];
  }, [data]);

  const handleSortChange = (
    newSortBy: CatalogSortBy,
    newSortOrder: CatalogSortOrder,
  ) => {
    updateUrlState({
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    });
  };

  if (error) {
    console.error('Error loading catalog:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading catalog. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <CatalogSearchInput
            value={searchInput}
            onChange={setSearchInput}
          />
        </div>

        {/* Filters */}
        <CatalogFilters
          carBrand={urlState.carBrand}
          modelBrand={urlState.modelBrand}
          condition={urlState.condition}
          onCarBrandChange={(nextCarBrand) => updateUrlState({ carBrand: nextCarBrand })}
          onModelBrandChange={(nextModelBrand) => updateUrlState({ modelBrand: nextModelBrand })}
          onConditionChange={(nextCondition) => updateUrlState({ condition: nextCondition })}
        />

        {/* Sort */}
        <CatalogSort
          sortBy={urlState.sortBy}
          sortOrder={urlState.sortOrder}
          onSortChange={handleSortChange}
        />

        {/* Loading State */}
        {isLoading && items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        )}

        {/* Items Grid */}
        {items.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Không tìm thấy sản phẩm nào.</p>
            {(urlState.search || urlState.carBrand || urlState.modelBrand || urlState.condition) && (
              <p className="text-gray-500 mt-2">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
            )}
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item: PublicItem, index: number) => (
                <ItemCard key={item.id} item={item} index={index} />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <InfiniteScrollTrigger
              onIntersect={() => fetchNextPage()}
              hasMore={hasNextPage ?? false}
              isLoading={isFetchingNextPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

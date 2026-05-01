import { useState, useMemo, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { usePublicShopContext } from '../hooks/usePublicShopContext';
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
  const { effectiveShopId, shopContextReady } = usePublicShopContext();
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

  useEffect(() => {
    if (!effectiveShopId || urlState.shopId === effectiveShopId) {
      return;
    }
    setSearchParams(
      (prev) => {
        const state = parseCatalogUrlState(prev);
        if (state.shopId === effectiveShopId) {
          return prev;
        }
        return buildCatalogSearchParams({ ...state, shopId: effectiveShopId });
      },
      { replace: true },
    );
  }, [effectiveShopId, urlState.shopId, setSearchParams]);

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
      effectiveShopId,
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
      if (effectiveShopId) {
        params.append('shop_id', effectiveShopId);
      }
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
    enabled: shopContextReady,
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

  const waitingForShopContext = !shopContextReady;

  if (error) {
    console.error('Error loading catalog:', error);
    return (
      <div className="relative min-h-[50vh] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800 shadow-corporate-card">
            <p className="font-semibold">Không tải được catalog</p>
            <p className="mt-1 text-sm text-rose-700/90">Vui lòng thử lại sau.</p>
          </div>
        </div>
      </div>
    );
  }

  if (waitingForShopContext) {
    return (
      <div className="relative min-h-[50vh] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            <p className="mt-4 text-sm font-medium text-slate-500">Đang tải catalog…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-500/25 blur-3xl motion-safe:animate-blob-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-32 h-[380px] w-[380px] rounded-full bg-gradient-to-bl from-violet-500/25 to-indigo-400/20 blur-3xl motion-safe:animate-blob-drift [animation-delay:-6s]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <section className="mb-10 grid gap-10 lg:mb-14 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Khám phá{' '}
              <span className="text-gradient-trust">kho xe 1:64</span>
              <br />
              ảnh thật & góc nhìn 360°
            </h1>
          </div>

          <div className="relative lg:justify-self-end">
            <div
              className="mx-auto max-w-md rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-corporate-card backdrop-blur transition-all duration-500 ease-out hover:shadow-corporate-card-hover sm:p-8"
            >
              <p className="text-sm font-semibold text-slate-700">Tìm nhanh</p>
              <div className="mt-3">
                <CatalogSearchInput value={searchInput} onChange={setSearchInput} />
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-corporate-card sm:p-6 lg:p-8">
          <CatalogFilters
            carBrand={urlState.carBrand}
            modelBrand={urlState.modelBrand}
            condition={urlState.condition}
            onCarBrandChange={(nextCarBrand) => updateUrlState({ carBrand: nextCarBrand })}
            onModelBrandChange={(nextModelBrand) => updateUrlState({ modelBrand: nextModelBrand })}
            onConditionChange={(nextCondition) => updateUrlState({ condition: nextCondition })}
          />

          <div className="mt-6 border-t border-slate-100 pt-6">
            <CatalogSort
              sortBy={urlState.sortBy}
              sortOrder={urlState.sortOrder}
              onSortChange={handleSortChange}
            />
          </div>

          {isLoading && items.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="mt-4 text-sm font-medium text-slate-500">Đang tải catalog…</p>
            </div>
          )}

          {items.length === 0 && !isLoading && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-14 text-center">
              <p className="text-lg font-semibold text-slate-800">Không tìm thấy sản phẩm nào.</p>
              {(urlState.search || urlState.carBrand || urlState.modelBrand || urlState.condition) && (
                <p className="mt-2 text-sm text-slate-500">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
              )}
            </div>
          )}

          {items.length > 0 && (
            <>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item: PublicItem, index: number) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    shopSearch={effectiveShopId ? `?shop_id=${encodeURIComponent(effectiveShopId)}` : ''}
                  />
                ))}
              </div>

              <InfiniteScrollTrigger
                onIntersect={() => fetchNextPage()}
                hasMore={hasNextPage ?? false}
                isLoading={isFetchingNextPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

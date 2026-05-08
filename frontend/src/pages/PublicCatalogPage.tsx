import { useState, useMemo, useEffect, useCallback, useId } from 'react';
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
  const { effectiveShopId, shopContextReady, publicApiShopReady } = usePublicShopContext();
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
    enabled: shopContextReady && publicApiShopReady,
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

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const sortFieldId = useId();
  const filterPanelId = useId();
  const filterPanelTitleId = useId();

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (urlState.carBrand) {
      n += 1;
    }
    if (urlState.modelBrand) {
      n += 1;
    }
    if (urlState.condition) {
      n += 1;
    }
    return n;
  }, [urlState.carBrand, urlState.modelBrand, urlState.condition]);

  const clearCatalogFilters = useCallback(() => {
    updateUrlState({ carBrand: null, modelBrand: null, condition: null });
  }, [updateUrlState]);

  const closeFilterPanel = useCallback(() => {
    setFilterPanelOpen(false);
  }, []);

  useEffect(() => {
    if (!filterPanelOpen) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFilterPanelOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [filterPanelOpen]);

  useEffect(() => {
    if (!filterPanelOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [filterPanelOpen]);

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

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-shop/40 to-shopAccent/25 blur-3xl motion-safe:animate-blob-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-32 h-[380px] w-[380px] rounded-full bg-gradient-to-bl from-shopAccent/25 to-shop/20 blur-3xl motion-safe:animate-blob-drift [animation-delay:-6s]"
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
          <div className="mb-6 flex flex-col gap-4">
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-live="polite">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Đang lọc</span>
                {urlState.carBrand && (
                  <button
                    type="button"
                    className="inline-flex max-w-[min(100%,14rem)] items-center gap-1 rounded-full bg-shop/10 py-1 pl-3 pr-2 text-sm font-medium text-shop ring-1 ring-shop/15 hover:bg-shop/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2"
                    onClick={() => updateUrlState({ carBrand: null })}
                  >
                    <span className="truncate">{urlState.carBrand}</span>
                    <span className="text-base leading-none opacity-70" aria-hidden>
                      ×
                    </span>
                    <span className="sr-only">Gỡ lọc hãng xe</span>
                  </button>
                )}
                {urlState.modelBrand && (
                  <button
                    type="button"
                    className="inline-flex max-w-[min(100%,14rem)] items-center gap-1 rounded-full bg-shop/10 py-1 pl-3 pr-2 text-sm font-medium text-shop ring-1 ring-shop/15 hover:bg-shop/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2"
                    onClick={() => updateUrlState({ modelBrand: null })}
                  >
                    <span className="truncate">{urlState.modelBrand}</span>
                    <span className="text-base leading-none opacity-70" aria-hidden>
                      ×
                    </span>
                    <span className="sr-only">Gỡ lọc hãng mô hình</span>
                  </button>
                )}
                {urlState.condition && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-shop/10 py-1 pl-3 pr-2 text-sm font-medium text-shop ring-1 ring-shop/15 hover:bg-shop/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2"
                    onClick={() => updateUrlState({ condition: null })}
                  >
                    {urlState.condition === 'new' ? 'Mới' : 'Cũ'}
                    <span className="text-base leading-none opacity-70" aria-hidden>
                      ×
                    </span>
                    <span className="sr-only">Gỡ lọc tình trạng</span>
                  </button>
                )}
                <button
                  type="button"
                  className="ml-1 text-sm font-semibold text-shop underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2"
                  onClick={clearCatalogFilters}
                >
                  Xóa lọc
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                <label htmlFor={sortFieldId} className="text-sm font-semibold text-slate-600">
                  Sắp xếp
                </label>
                <CatalogSort
                  id={sortFieldId}
                  sortBy={urlState.sortBy}
                  sortOrder={urlState.sortOrder}
                  onSortChange={handleSortChange}
                  className="min-w-0 flex-1 sm:max-w-xs"
                />
              </div>
              <button
                type="button"
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-shop/30 hover:bg-shop/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2 active:bg-shop/10"
                aria-expanded={filterPanelOpen}
                aria-controls={filterPanelId}
                onClick={() => setFilterPanelOpen(true)}
              >
                <span>Bộ lọc</span>
                {activeFilterCount > 0 ? (
                  <span className="ml-2 rounded-full bg-shop px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {filterPanelOpen ? (
            <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-4">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
                aria-label="Đóng bộ lọc"
                onClick={closeFilterPanel}
              />
              <div
                id={filterPanelId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={filterPanelTitleId}
                className="relative z-10 flex max-h-[min(92vh,840px)] w-full max-w-lg flex-col rounded-t-2xl border border-slate-100 bg-white shadow-corporate-card lg:max-h-[min(85vh,720px)] lg:rounded-2xl"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                  <h2 id={filterPanelTitleId} className="text-lg font-bold text-slate-900">
                    Bộ lọc
                  </h2>
                  <button
                    type="button"
                    className="flex h-10 min-w-[44px] items-center justify-center rounded-lg text-2xl leading-none text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2"
                    onClick={closeFilterPanel}
                    aria-label="Đóng"
                  >
                    ×
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                  <CatalogFilters
                    shopId={effectiveShopId}
                    carBrand={urlState.carBrand}
                    modelBrand={urlState.modelBrand}
                    condition={urlState.condition}
                    onCarBrandChange={(nextCarBrand) => updateUrlState({ carBrand: nextCarBrand })}
                    onModelBrandChange={(nextModelBrand) => updateUrlState({ modelBrand: nextModelBrand })}
                    onConditionChange={(nextCondition) => updateUrlState({ condition: nextCondition })}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {isLoading && items.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-shop/25 border-t-shop" />
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

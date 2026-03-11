import { useState, useMemo, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ItemCard } from '../components/catalog/ItemCard';
import { CatalogFilters } from '../components/catalog/CatalogFilters';
import { CatalogSort } from '../components/catalog/CatalogSort';
import { InfiniteScrollTrigger } from '../components/catalog/InfiniteScrollTrigger';
import type { PublicItem } from '../types/item.types';
import { useDebounce } from '../hooks/useDebounce';

export const PublicCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isSyncingFromUrl = useRef(false);

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [carBrand, setCarBrand] = useState<string | null>(() => searchParams.get('car_brand'));
  const [modelBrand, setModelBrand] = useState<string | null>(() => searchParams.get('model_brand'));
  const [condition, setCondition] = useState<string | null>(() => searchParams.get('condition'));
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>(() => {
    const initial = searchParams.get('sort_by');
    return initial === 'name' || initial === 'price' || initial === 'created_at'
      ? initial
      : 'created_at';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const initial = searchParams.get('sort_order');
    return initial === 'asc' || initial === 'desc' ? initial : 'desc';
  });
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const nextSearch = searchParams.get('q') ?? '';
    const nextCarBrand = searchParams.get('car_brand');
    const nextModelBrand = searchParams.get('model_brand');
    const nextCondition = searchParams.get('condition');
    const rawSortBy = searchParams.get('sort_by');
    const rawSortOrder = searchParams.get('sort_order');
    const nextSortBy: 'name' | 'price' | 'created_at' =
      rawSortBy === 'name' || rawSortBy === 'price' || rawSortBy === 'created_at'
        ? rawSortBy
        : 'created_at';
    const nextSortOrder: 'asc' | 'desc' = rawSortOrder === 'asc' || rawSortOrder === 'desc'
      ? rawSortOrder
      : 'desc';

    const hasDiff =
      search !== nextSearch ||
      carBrand !== nextCarBrand ||
      modelBrand !== nextModelBrand ||
      condition !== nextCondition ||
      sortBy !== nextSortBy ||
      sortOrder !== nextSortOrder;

    if (!hasDiff) {
      return;
    }

    isSyncingFromUrl.current = true;
    let disposed = false;

    queueMicrotask(() => {
      if (disposed) {
        return;
      }

      setSearch(nextSearch);
      setCarBrand(nextCarBrand);
      setModelBrand(nextModelBrand);
      setCondition(nextCondition);
      setSortBy(nextSortBy);
      setSortOrder(nextSortOrder);
    });

    return () => {
      disposed = true;
    };
  }, [searchParams, search, carBrand, modelBrand, condition, sortBy, sortOrder]);

  useEffect(() => {
    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (carBrand) params.set('car_brand', carBrand);
    if (modelBrand) params.set('model_brand', modelBrand);
    if (condition) params.set('condition', condition);
    if (sortBy !== 'created_at') params.set('sort_by', sortBy);
    if (sortOrder !== 'desc') params.set('sort_order', sortOrder);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [debouncedSearch, carBrand, modelBrand, condition, sortBy, sortOrder, searchParams, setSearchParams]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['public-items', debouncedSearch, carBrand, modelBrand, condition, sortBy, sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        page_size: '20',
      });
      if (debouncedSearch.trim()) params.append('q', debouncedSearch.trim());
      if (carBrand) params.append('car_brand', carBrand);
      if (modelBrand) params.append('model_brand', modelBrand);
      if (condition) params.append('condition', condition);
      if (sortBy) params.append('sort_by', sortBy);
      if (sortOrder) params.append('sort_order', sortOrder);

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

  const handleSortChange = (newSortBy: 'name' | 'price' | 'created_at', newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
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
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <CatalogFilters
          carBrand={carBrand}
          modelBrand={modelBrand}
          condition={condition}
          onCarBrandChange={setCarBrand}
          onModelBrandChange={setModelBrand}
          onConditionChange={setCondition}
        />

        {/* Sort */}
        <CatalogSort sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />

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
            {(search || carBrand || modelBrand || condition) && (
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

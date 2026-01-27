import { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ItemCard } from '../components/catalog/ItemCard';
import { CatalogFilters } from '../components/catalog/CatalogFilters';
import { CatalogSort } from '../components/catalog/CatalogSort';
import { InfiniteScrollTrigger } from '../components/catalog/InfiniteScrollTrigger';

export const PublicCatalogPage = () => {
  const [search, setSearch] = useState('');
  const [carBrand, setCarBrand] = useState<string | null>(null);
  const [modelBrand, setModelBrand] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['public-items', search, carBrand, modelBrand, condition, sortBy, sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        page_size: '20',
      });
      if (search) params.append('q', search);
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
              {items.map((item: any, index: number) => (
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

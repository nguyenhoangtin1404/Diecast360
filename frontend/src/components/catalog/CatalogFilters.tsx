import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { CategoryItem } from '../../types/category';

interface CatalogFiltersProps {
  carBrand: string | null;
  modelBrand: string | null;
  condition: 'new' | 'old' | null;
  onCarBrandChange: (brand: string | null) => void;
  onModelBrandChange: (brand: string | null) => void;
  onConditionChange: (condition: 'new' | 'old' | null) => void;
}

export const CatalogFilters = ({
  carBrand,
  modelBrand,
  condition,
  onCarBrandChange,
  onModelBrandChange,
  onConditionChange,
}: CatalogFiltersProps) => {
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery<{ categories: CategoryItem[] }>({
    queryKey: ['catalog-filters', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/categories?is_active=true');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const carBrands = useMemo(
    () => (categoriesData?.categories ?? [])
      .filter((category) => category.type === 'car_brand')
      .map((category) => category.name)
      .sort((a, b) => a.localeCompare(b)),
    [categoriesData],
  );

  const modelBrands = useMemo(
    () => (categoriesData?.categories ?? [])
      .filter((category) => category.type === 'model_brand')
      .map((category) => category.name)
      .sort((a, b) => a.localeCompare(b)),
    [categoriesData],
  );

  const handleCarBrandClick = (brand: string) => {
    onCarBrandChange(carBrand === brand ? null : brand);
  };

  const handleModelBrandClick = (brand: string) => {
    onModelBrandChange(modelBrand === brand ? null : brand);
  };

  const handleConditionClick = (cond: 'new' | 'old') => {
    onConditionChange(condition === cond ? null : cond);
  };

  return (
    <div className="space-y-6 mb-6">
      {isCategoriesError && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Không thể tải bộ lọc lúc này.
        </div>
      )}

      {/* Car Brand Filters */}
      {isCategoriesLoading && (
        <div className="text-sm text-gray-500">Đang tải bộ lọc...</div>
      )}
      {carBrands.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Hãng xe</h3>
          <div className="flex flex-wrap gap-2">
            {carBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => handleCarBrandClick(brand)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  carBrand === brand
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Model Brand Filters */}
      {modelBrands.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Hãng mô hình</h3>
          <div className="flex flex-wrap gap-2">
            {modelBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => handleModelBrandClick(brand)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  modelBrand === brand
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Condition Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tình trạng</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleConditionClick('new')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              condition === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mới
          </button>
          <button
            onClick={() => handleConditionClick('old')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              condition === 'old'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cũ
          </button>
        </div>
      </div>
    </div>
  );
};

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { CategoryItem } from '../../types/category';
import { cn } from '../../lib/utils';

interface CatalogFiltersProps {
  carBrand: string | null;
  modelBrand: string | null;
  condition: 'new' | 'old' | null;
  onCarBrandChange: (brand: string | null) => void;
  onModelBrandChange: (brand: string | null) => void;
  onConditionChange: (condition: 'new' | 'old' | null) => void;
}

const chipBase =
  'min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

const chipInactive = 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-800';
const chipActive =
  'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-corporate-btn hover:-translate-y-0.5 hover:shadow-corporate-card-hover';

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
    <div className="mb-2 space-y-8">
      {isCategoriesError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Không thể tải bộ lọc lúc này.
        </div>
      )}

      {isCategoriesLoading && (
        <div className="text-sm font-medium text-slate-500">Đang tải bộ lọc…</div>
      )}
      {carBrands.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Hãng xe</h3>
          <div className="flex flex-wrap gap-2">
            {carBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => handleCarBrandClick(brand)}
                className={cn(chipBase, carBrand === brand ? chipActive : chipInactive)}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {modelBrands.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Hãng mô hình</h3>
          <div className="flex flex-wrap gap-2">
            {modelBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => handleModelBrandClick(brand)}
                className={cn(chipBase, modelBrand === brand ? chipActive : chipInactive)}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Tình trạng</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleConditionClick('new')}
            className={cn(chipBase, condition === 'new' ? chipActive : chipInactive)}
          >
            Mới
          </button>
          <button
            type="button"
            onClick={() => handleConditionClick('old')}
            className={cn(chipBase, condition === 'old' ? chipActive : chipInactive)}
          >
            Cũ
          </button>
        </div>
      </div>
    </div>
  );
};

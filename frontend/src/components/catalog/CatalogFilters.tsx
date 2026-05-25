import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { CategoryItem } from '../../types/category';
import { cn } from '../../lib/utils';

interface CatalogFiltersProps {
  shopId: string | null;
  carBrand: string | null;
  modelBrand: string | null;
  condition: 'new' | 'old' | null;
  preorderOpen: boolean;
  onCarBrandChange: (brand: string | null) => void;
  onModelBrandChange: (brand: string | null) => void;
  onConditionChange: (condition: 'new' | 'old' | null) => void;
  onPreorderOpenChange: (value: boolean) => void;
}

const chipBase =
  'min-h-[44px] shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2';

const chipInactive =
  'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-shop/25 hover:bg-shop/5 active:bg-shop/10 hover:text-shop';
const chipActive =
  'border-transparent bg-gradient-to-r from-shop to-shopAccent text-white shadow-corporate-btn hover:-translate-y-0.5 hover:shadow-corporate-card-hover active:translate-y-0 active:brightness-95';

const scrollRowClass =
  'flex gap-2 overflow-x-auto pb-1 pt-0.5 [-webkit-overflow-scrolling:touch]';

const sectionTitleClass = 'mb-2 text-xs font-bold uppercase tracking-wide text-slate-500';

export const CatalogFilters = ({
  shopId,
  carBrand,
  modelBrand,
  condition,
  preorderOpen,
  onCarBrandChange,
  onModelBrandChange,
  onConditionChange,
  onPreorderOpenChange,
}: CatalogFiltersProps) => {
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery<{ categories: CategoryItem[] }>({
    queryKey: ['catalog-filters', shopId ?? 'none'],
    queryFn: async () => {
      const params = new URLSearchParams({ is_active: 'true' });
      if (shopId) {
        params.set('shop_id', shopId);
      }
      const response = await apiClient.get(`/categories?${params.toString()}`);
      return response.data;
    },
    enabled: Boolean(shopId),
    staleTime: 5 * 60 * 1000,
  });

  const carBrands = useMemo(
    () => (categoriesData?.categories ?? [])
      .filter((c) => c.type === 'car_brand' && c.is_active)
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b)),
    [categoriesData],
  );

  const modelBrands = useMemo(
    () => (categoriesData?.categories ?? [])
      .filter((c) => c.type === 'model_brand' && c.is_active)
      .map((c) => c.name)
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
    <div className="space-y-4">
      {isCategoriesError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Không thể tải bộ lọc lúc này.
        </div>
      )}

      {isCategoriesLoading && (
        <div className="text-sm font-medium text-slate-500">Đang tải bộ lọc...</div>
      )}
      {carBrands.length > 0 && (
        <div>
          <h3 className={sectionTitleClass}>Hãng xe</h3>
          <div className={scrollRowClass}>
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
          <h3 className={sectionTitleClass}>Hãng mô hình</h3>
          <div className={scrollRowClass}>
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
        <h3 className={sectionTitleClass}>Tình trạng</h3>
        <div className={scrollRowClass}>
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

      <div>
        <h3 className={sectionTitleClass}>Pre-order</h3>
        <div className={scrollRowClass}>
          <button
            type="button"
            onClick={() => onPreorderOpenChange(!preorderOpen)}
            className={cn(chipBase, preorderOpen ? chipActive : chipInactive)}
          >
            Đang mở đặt hàng
          </button>
        </div>
      </div>
    </div>
  );
};

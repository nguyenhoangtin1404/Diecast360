import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { CategoryItem } from '../../types/category';
import { cn } from '../../lib/utils';

interface CatalogFiltersProps {
  shopId: string | null;
  /** Resolved shop name for audit copy (optional). */
  shopDisplayName?: string | null;
  carBrand: string | null;
  modelBrand: string | null;
  condition: 'new' | 'old' | null;
  onCarBrandChange: (brand: string | null) => void;
  onModelBrandChange: (brand: string | null) => void;
  onConditionChange: (condition: 'new' | 'old' | null) => void;
}

const chipBase =
  'min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2';

const chipInactive = 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-shop/25 hover:bg-shop/5 hover:text-shop';
const chipActive =
  'border-transparent bg-gradient-to-r from-shop to-shopAccent text-white shadow-corporate-btn hover:-translate-y-0.5 hover:shadow-corporate-card-hover';

export const CatalogFilters = ({
  shopId,
  shopDisplayName,
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
    <div className="mb-2 space-y-8">
      {Boolean(shopId) && (
        <p
          className="mb-1 rounded-lg border border-slate-100 bg-slate-50/90 px-3 py-2 text-xs leading-relaxed text-slate-600"
          role="note"
        >
          Bộ lọc hãng xe và hãng mô hình gồm{' '}
          <strong>danh mục chung (toàn hệ thống)</strong> và{' '}
          <strong>
            danh mục riêng của shop
            {shopDisplayName ? ` «${shopDisplayName}»` : ''}
          </strong>
          . Danh mục chỉ thuộc shop khác không xuất hiện ở đây.
        </p>
      )}

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

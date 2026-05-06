import { cn } from '../../lib/utils';
import type { CatalogSortBy, CatalogSortOrder } from '../../pages/publicCatalogUrlState';

interface CatalogSortProps {
  sortBy: CatalogSortBy;
  sortOrder: CatalogSortOrder;
  onSortChange: (sortBy: CatalogSortBy, sortOrder: CatalogSortOrder) => void;
  id?: string;
  className?: string;
}

const SORT_OPTIONS: { value: `${CatalogSortBy}:${CatalogSortOrder}`; label: string }[] = [
  { value: 'created_at:desc', label: 'Mới nhất' },
  { value: 'created_at:asc', label: 'Cũ nhất (theo ngày)' },
  { value: 'price:desc', label: 'Giá giảm dần' },
  { value: 'price:asc', label: 'Giá tăng dần' },
  { value: 'name:asc', label: 'Tên A → Z' },
  { value: 'name:desc', label: 'Tên Z → A' },
];

function parseSortValue(value: string): { sortBy: CatalogSortBy; sortOrder: CatalogSortOrder } | null {
  const colon = value.indexOf(':');
  if (colon <= 0) {
    return null;
  }
  const sortBy = value.slice(0, colon);
  const sortOrder = value.slice(colon + 1);
  if (sortBy !== 'name' && sortBy !== 'price' && sortBy !== 'created_at') {
    return null;
  }
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    return null;
  }
  return { sortBy, sortOrder };
}

export const CatalogSort = ({
  sortBy,
  sortOrder,
  onSortChange,
  id = 'catalog-sort',
  className,
}: CatalogSortProps) => {
  const currentValue = `${sortBy}:${sortOrder}`;

  return (
    <select
      id={id}
      aria-label="Sắp xếp kết quả"
      className={cn('select-trust min-h-[44px] max-w-full sm:min-w-[220px]', className)}
      value={SORT_OPTIONS.some((o) => o.value === currentValue) ? currentValue : SORT_OPTIONS[0].value}
      onChange={(e) => {
        const parsed = parseSortValue(e.target.value);
        if (parsed) {
          onSortChange(parsed.sortBy, parsed.sortOrder);
        }
      }}
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

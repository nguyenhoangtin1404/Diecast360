import { cn } from '../../lib/utils';

interface CatalogSortProps {
  sortBy: 'name' | 'price' | 'created_at';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'price' | 'created_at', sortOrder: 'asc' | 'desc') => void;
}

const btn =
  'min-h-[44px] rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

const btnOff = 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-slate-50';
const btnOn = 'border-transparent bg-indigo-50 text-indigo-800 ring-1 ring-indigo-100';

export const CatalogSort = ({ sortBy, sortOrder, onSortChange }: CatalogSortProps) => {
  const handleSortClick = (field: 'name' | 'price' | 'created_at') => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'desc');
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Sắp xếp</span>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => handleSortClick('name')} className={cn(btn, sortBy === 'name' ? btnOn : btnOff)}>
          Tên {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button type="button" onClick={() => handleSortClick('price')} className={cn(btn, sortBy === 'price' ? btnOn : btnOff)}>
          Giá {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          type="button"
          onClick={() => handleSortClick('created_at')}
          className={cn(btn, sortBy === 'created_at' ? btnOn : btnOff)}
        >
          Mới nhất {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>
    </div>
  );
};

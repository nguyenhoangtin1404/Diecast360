interface CatalogSortProps {
  sortBy: 'name' | 'price' | 'created_at';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'price' | 'created_at', sortOrder: 'asc' | 'desc') => void;
}

export const CatalogSort = ({ sortBy, sortOrder, onSortChange }: CatalogSortProps) => {
  const handleSortClick = (field: 'name' | 'price' | 'created_at') => {
    if (sortBy === field) {
      // Toggle order if same field
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc order
      onSortChange(field, 'desc');
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-semibold text-gray-700">Sắp xếp:</span>
      <div className="flex gap-2">
        <button
          onClick={() => handleSortClick('name')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            sortBy === 'name'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tên {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSortClick('price')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            sortBy === 'price'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Giá {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSortClick('created_at')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            sortBy === 'created_at'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Mới nhất {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>
    </div>
  );
};


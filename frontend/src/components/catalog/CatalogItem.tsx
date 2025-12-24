import { Link } from 'react-router-dom';

interface CatalogItemProps {
  item: {
    id: string;
    name: string;
    cover_image_url?: string | null;
    status: string;
    has_spinner?: boolean;
    price?: number | null;
    condition?: string | null;
  };
  index: number;
}

export const CatalogItem = ({ item, index }: CatalogItemProps) => {
  const statusText =
    item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán';

  const conditionText = item.condition === 'new' ? 'Mới' : item.condition === 'old' ? 'Cũ' : null;

  return (
    <Link
      to={`/items/${item.id}`}
      className="group relative block opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={item.cover_image_url || '/placeholder-item.svg'}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {item.has_spinner && (
            <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              360°
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {item.name}
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{statusText}</span>
            {conditionText && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {conditionText}
              </span>
            )}
          </div>
          {item.price && (
            <div className="mt-2 text-lg font-bold text-gray-900">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(item.price)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};


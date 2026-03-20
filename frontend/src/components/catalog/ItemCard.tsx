import { Link } from 'react-router-dom';

interface ItemCardProps {
  item: {
    id: string;
    name: string;
    cover_image_url?: string | null;
    status: string;
    has_spinner?: boolean;
    price?: number | null;
    original_price?: number | null;
    condition?: string | null;
  };
  index?: number;
}

export const ItemCard = ({ item, index = 0 }: ItemCardProps) => {
  const statusText =
    item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán';

  const conditionText = item.condition === 'new' ? 'Mới' : item.condition === 'old' ? 'Cũ' : null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const calculateDiscount = (original: number, current: number) => {
    if (original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  const hasDiscount = item.original_price && item.price && item.original_price > item.price;
  const discountPercent = hasDiscount ? calculateDiscount(item.original_price!, item.price!) : 0;

  return (
    <Link
      to={`/items/${item.id}`}
      className="group relative block opacity-0 animate-fade-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-full border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={item.cover_image_url || '/placeholder-item.svg'}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(event) => {
              event.currentTarget.src = '/placeholder-item.svg';
            }}
          />
          {item.has_spinner && (
            <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              360°
            </span>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-base leading-6 min-h-[3rem]">
            {item.name}
          </h3>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-600">{statusText}</span>
            {conditionText && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs whitespace-nowrap">
                {conditionText}
              </span>
            )}
          </div>
          {item.price != null && (
            <div className="mt-2">
              {hasDiscount && item.original_price && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(item.original_price)}
                  </span>
                  {discountPercent > 0 && (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              )}
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(item.price)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

// Backward compatibility alias
export const CatalogItem = ItemCard;

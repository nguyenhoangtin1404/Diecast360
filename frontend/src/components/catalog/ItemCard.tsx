import { Link } from 'react-router-dom';
import { PreorderCountdown } from '../preorder/PreorderCountdown';

interface ItemCardProps {
  item: {
    id: string;
    name: string;
    cover_image_url?: string | null;
    status: string;
    has_spinner?: boolean;
    price?: number | null;
    original_price?: number | null;
    preorder_price?: number | null;
    preorder_closes_at?: string | null;
    preorder_opens_at?: string | null;
    created_at?: string;
    condition?: string | null;
  };
  index?: number;
  /** e.g. `?shop_id=slug` — appended to item link for public catalog scope */
  shopSearch?: string;
}

export const ItemCard = ({ item, index = 0, shopSearch = '' }: ItemCardProps) => {
  const statusText =
    item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : item.status === 'preorder' ? 'Pre-order' : 'Đã bán';

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

  const isPreorderOpen =
    item.status === 'preorder' &&
    item.preorder_price != null &&
    (!item.preorder_closes_at || new Date(item.preorder_closes_at) > new Date());

  // During an open preorder window, show preorder_price as the active price
  const displayPrice = isPreorderOpen ? item.preorder_price! : item.price;

  const hasDiscount = item.original_price && displayPrice && item.original_price > displayPrice;
  const discountPercent = hasDiscount ? calculateDiscount(item.original_price!, displayPrice!) : 0;

  return (
    <Link
      to={`/items/${item.id}${shopSearch}`}
      className="group relative block opacity-0 animate-fade-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-corporate-card transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-corporate-card-hover">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <img
            src={item.cover_image_url || '/placeholder-item.svg'}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = '/placeholder-item.svg';
            }}
          />
          {item.has_spinner && (
            <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-shop to-shopAccent px-2.5 py-1 text-xs font-bold text-white shadow-corporate-glow">
              360°
            </span>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="mb-2 line-clamp-2 min-h-[3rem] text-base font-semibold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-shop">
            {item.name}
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-500">{statusText}</span>
            {conditionText && (
              <span className="whitespace-nowrap rounded-full bg-shop/10 px-2.5 py-0.5 text-xs font-semibold text-shop ring-1 ring-shop/15">
                {conditionText}
              </span>
            )}
          </div>
          {displayPrice != null && (
            <div className="mt-2">
              {hasDiscount && item.original_price && (
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-400 line-through">
                    {formatPrice(item.original_price)}
                  </span>
                  {discountPercent > 0 && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              )}
              <div className="text-lg font-extrabold tracking-tight text-slate-900">
                {formatPrice(displayPrice)}
              </div>
            </div>
          )}
          {isPreorderOpen && item.preorder_closes_at && (
            <div className="mt-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Hạn đặt cọc
              </p>
              <PreorderCountdown
                opensAt={item.preorder_opens_at ?? item.created_at}
                closesAt={item.preorder_closes_at}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export const CatalogItem = ItemCard;

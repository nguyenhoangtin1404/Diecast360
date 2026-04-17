import React from 'react';
import { cn } from '../../lib/utils';
import { useShop } from '../../hooks/useShop';
import type { Shop } from '../../contexts/ShopContext';

/**
 * ShopSelector — dropdown to switch the active shop context.
 * Shown in the admin Layout header.
 */
const ShopSelector: React.FC = () => {
  const shopCtx = useShop();

  if (!shopCtx || shopCtx.allowedShops.length === 0) {
    return null;
  }

  const { activeShop, allowedShops, switchShop, loading } = shopCtx;

  const badgeClass = cn(
    'flex max-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm',
  );

  if (allowedShops.length === 1) {
    return (
      <div className={badgeClass} title="Shop hiện tại">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
          aria-hidden
        />
        <span className="truncate">{activeShop?.name || allowedShops[0].name}</span>
      </div>
    );
  }

  return (
    <div className={cn(badgeClass, 'gap-1.5')} title="Chọn shop đang hoạt động">
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
      <select
        id="shop-selector"
        aria-label="Chọn shop"
        value={activeShop?.id || ''}
        onChange={(e) => switchShop(e.target.value)}
        disabled={loading}
        className="max-w-[160px] cursor-pointer truncate border-0 bg-transparent text-sm font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:opacity-60"
      >
        {!activeShop && (
          <option value="" disabled>
            Chọn shop...
          </option>
        )}
        {allowedShops.map((shop: Shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
      {loading && <span className="text-xs text-slate-500">⏳</span>}
    </div>
  );
};

export default ShopSelector;

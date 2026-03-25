import React from 'react';
import { useShop } from '../../hooks/useShop';
import type { Shop } from '../../contexts/ShopContext';

/**
 * ShopSelector — dropdown to switch the active shop context.
 * Shown in the admin Layout header.
 * - If user has 1 shop: shows a static label (no dropdown).
 * - If user has multiple shops: shows a dropdown to switch.
 * - Always shows the active shop name or "Chọn shop..." if none.
 */
const ShopSelector: React.FC = () => {
  const shopCtx = useShop();

  if (!shopCtx || shopCtx.allowedShops.length === 0) {
    return null;
  }

  const { activeShop, allowedShops, switchShop, loading } = shopCtx;

  // Only one shop — show static label
  if (allowedShops.length === 1) {
    return (
      <div style={styles.staticBadge} title="Shop hiện tại">
        <span style={styles.dot} />
        <span style={styles.shopName}>{activeShop?.name || allowedShops[0].name}</span>
      </div>
    );
  }

  return (
    <div style={styles.wrapper} title="Chọn shop đang hoạt động">
      <span style={styles.dot} />
      <select
        id="shop-selector"
        aria-label="Chọn shop"
        value={activeShop?.id || ''}
        onChange={(e) => switchShop(e.target.value)}
        disabled={loading}
        style={styles.select}
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
      {loading && <span style={styles.spinner}>⏳</span>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)',
  },
  staticBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)',
    fontSize: '13px',
    fontWeight: 500,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e', // green — active indicator
    flexShrink: 0,
  },
  shopName: {
    color: 'inherit',
    fontWeight: 500,
    fontSize: '13px',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    maxWidth: '140px',
  },
  spinner: {
    fontSize: '12px',
  },
};

export default ShopSelector;

import React from 'react';
import { EyeOff, Loader2, Pencil, UserPlus } from 'lucide-react';
import { styles } from '../ShopsPage.styles';
import ShopMetaButton from './ShopMetaButton';
import type { Shop } from './types';

type Props = {
  shop: Shop;
  shopActionLoadingId: string | null;
  memberAddingForShopId: string | null;
  onOpenItems: (shop: Shop) => void;
  onOpenMembers: (shop: Shop) => void;
  onOpenAudit: (shop: Shop) => void;
  onOpenEdit: (shop: Shop) => void;
  onDeactivate: (shopId: string) => void;
  onActivate: (shopId: string) => void;
  onOpenAddMember: (shopId: string) => void;
};

const ShopCard: React.FC<Props> = ({
  shop,
  shopActionLoadingId,
  memberAddingForShopId,
  onOpenItems,
  onOpenMembers,
  onOpenAudit,
  onOpenEdit,
  onDeactivate,
  onActivate,
  onOpenAddMember,
}) => {
  return (
    <div style={{ ...styles.card, opacity: shop.is_active ? 1 : 0.5 }}>
      <div style={styles.cardHeader}>
        <span style={{ ...styles.dot, background: shop.is_active ? '#22c55e' : '#9ca3af' }} />
        <strong style={styles.shopName}>{shop.name}</strong>
        <code style={styles.slug}>{shop.slug}</code>
      </div>
      <div style={styles.meta}>
        <ShopMetaButton
          style={styles.metaClickable}
          onClick={() => onOpenItems(shop)}
          title="Xem danh sách mặt hàng của shop"
          label={`📦 ${shop._count?.items ?? 0} mặt hàng`}
        />
        <ShopMetaButton
          style={styles.metaClickable}
          onClick={() => onOpenMembers(shop)}
          title="Xem danh sách thành viên shop"
          label={`👥 ${shop._count?.user_roles ?? 0} thành viên`}
        />
        <ShopMetaButton
          style={styles.metaClickable}
          onClick={() => onOpenAudit(shop)}
          title="Xem lịch sử hoạt động"
          label="🕘 Lịch sử"
        />
      </div>
      {shop.is_active && (
        <div style={styles.cardActionsRow}>
          <div style={styles.cardActionsLeft}>
            <button
              type="button"
              style={{
                ...styles.iconBtnEdit,
                opacity: shopActionLoadingId === shop.id ? 0.5 : 1,
                cursor: shopActionLoadingId === shop.id ? 'not-allowed' : 'pointer',
              }}
              onClick={() => onOpenEdit(shop)}
              disabled={shopActionLoadingId === shop.id}
              title="Sửa thông tin shop (tên shop)"
              aria-label="Sửa thông tin shop"
            >
              <Pencil size={18} aria-hidden />
            </button>
            <button
              type="button"
              style={{
                ...styles.iconBtnDanger,
                opacity: shopActionLoadingId === shop.id ? 0.5 : 1,
                cursor: shopActionLoadingId === shop.id ? 'not-allowed' : 'pointer',
              }}
              onClick={() => onDeactivate(shop.id)}
              disabled={shopActionLoadingId === shop.id}
              title="Tắt shop — ẩn shop khỏi hoạt động (dữ liệu vẫn giữ)"
              aria-label="Tắt shop — ẩn shop khỏi hoạt động"
            >
              <EyeOff size={18} aria-hidden />
            </button>
          </div>
          <button
            id={`add-shop-admin-active-${shop.id}`}
            type="button"
            style={{
              ...styles.iconBtnSuccess,
              opacity: memberAddingForShopId === shop.id ? 0.7 : 1,
              cursor: memberAddingForShopId === shop.id ? 'wait' : 'pointer',
            }}
            disabled={memberAddingForShopId === shop.id}
            onClick={() => onOpenAddMember(shop.id)}
            title="Thêm thành viên — gán shop_admin hoặc shop_staff"
            aria-label="Thêm thành viên cho shop"
          >
            {memberAddingForShopId === shop.id ? (
              <Loader2 size={18} className="animate-spin" aria-hidden />
            ) : (
              <UserPlus size={18} aria-hidden />
            )}
          </button>
        </div>
      )}
      {!shop.is_active && (
        <>
          <span style={styles.inactiveLabel}>Đã tắt</span>
          <button
            style={styles.activateBtn}
            onClick={() => onActivate(shop.id)}
            disabled={shopActionLoadingId === shop.id}
            type="button"
          >
            {shopActionLoadingId === shop.id ? 'Đang mở...' : 'Mở lại shop'}
          </button>
        </>
      )}

      {!shop.is_active && (
        <div style={styles.memberBox}>
          <div style={styles.cardActionsLeft}>
            <button
              type="button"
              style={{
                ...styles.iconBtnEdit,
                alignSelf: 'flex-start',
                opacity: shopActionLoadingId === shop.id ? 0.5 : 1,
                cursor: shopActionLoadingId === shop.id ? 'not-allowed' : 'pointer',
              }}
              onClick={() => onOpenEdit(shop)}
              disabled={shopActionLoadingId === shop.id}
              title="Sửa thông tin shop (tên shop)"
              aria-label="Sửa thông tin shop"
            >
              <Pencil size={18} aria-hidden />
            </button>
            <button
              id={`add-shop-admin-inactive-${shop.id}`}
              type="button"
              style={{ ...styles.iconBtnSuccess, opacity: memberAddingForShopId === shop.id ? 0.7 : 1 }}
              disabled={memberAddingForShopId === shop.id}
              onClick={() => onOpenAddMember(shop.id)}
              title="Thêm thành viên — gán shop_admin hoặc shop_staff"
              aria-label="Thêm thành viên cho shop"
            >
              {memberAddingForShopId === shop.id ? (
                <Loader2 size={18} className="animate-spin" aria-hidden />
              ) : (
                <UserPlus size={18} aria-hidden />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopCard;

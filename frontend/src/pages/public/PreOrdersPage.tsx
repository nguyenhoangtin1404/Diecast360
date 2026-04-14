import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicPreorders } from '../../api/preorders';
import { API_CONFIG } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { PREORDER_STATUS_LABELS } from '../../constants/preorder';
import { safeHttpUrlForAttribute } from '../../utils/safeHttpUrl';
import { sanitizeShopIdQueryParam } from '../../utils/sanitizeShopId';
import { BottomNavigation } from './preorders/BottomNavigation';
import styles from './preorders/preordersPublic.module.css';

const formatCountdown = (target: string | null) => {
  if (!target) return 'Chưa có lịch giao';
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return 'Sẵn sàng giao';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `Còn ${days} ngày`;
};

export const PreOrdersPage = () => {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const queryShopId = sanitizeShopIdQueryParam(searchParams.get('shop_id'));
  const configShopId = sanitizeShopIdQueryParam(API_CONFIG.PUBLIC_PREORDER_SHOP_ID);
  /** Anonymous-friendly order: URL and deploy config do not depend on auth. */
  const shopId =
    queryShopId ||
    configShopId ||
    sanitizeShopIdQueryParam(user?.active_shop_id ?? null) ||
    sanitizeShopIdQueryParam(user?.allowed_shop_ids?.[0] ?? null) ||
    '';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-preorders', shopId],
    queryFn: async () => fetchPublicPreorders(shopId),
    enabled: Boolean(shopId),
  });

  const cards = data?.cards ?? [];

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Mô hình Đặt trước</h1>
      {isLoading && <div>Đang tải danh sách...</div>}
      {authLoading && !shopId && <div>Đang tải thông tin shop...</div>}
      {!authLoading && !shopId && <div>Chưa có thông tin shop để hiển thị pre-order.</div>}
      {shopId && isError && <div>Không thể tải danh sách pre-order. Vui lòng thử lại.</div>}
      {shopId && !isLoading && !isError && cards.length === 0 && (
        <div>Chưa có sản phẩm pre-order nào ở thời điểm hiện tại.</div>
      )}
      {cards.map((card) => (
        <article key={card.id} className={styles.card} data-testid="public-preorder-card">
          <img
            className={styles.image}
            src={safeHttpUrlForAttribute(card.cover_image_url)}
            alt={card.title}
          />
          <div className={styles.body}>
            <span className={styles.badge} data-testid="public-preorder-status-badge">
              {PREORDER_STATUS_LABELS[card.status]}
            </span>
            <strong>{card.title}</strong>
            <span>{card.short_specs}</span>
            <span data-testid="public-preorder-countdown">{formatCountdown(card.countdown_target)}</span>
            <span className={styles.price}>{card.display_price.toLocaleString('vi-VN')} VND</span>
            <button className={styles.cta} type="button" data-testid="public-preorder-cta">
              Đặt hàng ngay
            </button>
          </div>
        </article>
      ))}
      <BottomNavigation preordersSearch={shopId ? `?shop_id=${encodeURIComponent(shopId)}` : ''} />
    </div>
  );
};


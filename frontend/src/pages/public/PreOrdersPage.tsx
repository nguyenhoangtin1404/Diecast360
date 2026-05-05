import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicPreorders } from '../../api/preorders';
import { API_CONFIG } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { PREORDER_STATUS_LABELS } from '../../constants/preorder';
import { safeHttpUrlForAttribute } from '../../utils/safeHttpUrl';
import { sanitizeShopIdQueryParam } from '../../utils/sanitizeShopId';
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
  /** Có shop cố định từ URL hoặc env build — không cần chờ JWT /auth/me. */
  const hasDeterministicShopContext = Boolean(queryShopId || configShopId);
  /** Thứ tự: query → env build → người dùng đã đăng nhập (active / allowed shop). */
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
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-500/25 blur-3xl motion-safe:animate-blob-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-32 h-[380px] w-[380px] rounded-full bg-gradient-to-bl from-violet-500/25 to-indigo-400/20 blur-3xl motion-safe:animate-blob-drift [animation-delay:-6s]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className={styles.pageContent}>
          <h1 className={styles.heading}>
            Mô hình <span className={styles.headingGradient}>Đặt trước</span>
          </h1>
          {isLoading && <div className={styles.loading}>Đang tải danh sách...</div>}
          {authLoading && !shopId && !hasDeterministicShopContext && (
            <div className={styles.loading}>Đang tải thông tin shop...</div>
          )}
          {!authLoading && !shopId && (
            <div className={styles.alert}>
              Chưa có thông tin shop để hiển thị pre-order. Dùng <code>?shop_id=...</code> trên URL hoặc cấu hình{' '}
              <code>VITE_PUBLIC_PREORDER_SHOP_ID</code> khi build (xem <code>frontend/.env.example</code>).
            </div>
          )}
          {shopId && isError && (
            <div className={styles.alert}>Không thể tải danh sách pre-order. Vui lòng thử lại.</div>
          )}
          {shopId && !isLoading && !isError && cards.length === 0 && (
            <div className={styles.alert}>Chưa có sản phẩm pre-order nào ở thời điểm hiện tại.</div>
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
        </div>
      </div>
    </div>
  );
};


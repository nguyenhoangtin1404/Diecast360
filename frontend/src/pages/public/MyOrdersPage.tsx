import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrders } from '../../api/preorders';
import { useAuth } from '../../hooks/useAuth';
import { PREORDER_STATUS_LABELS } from '../../constants/preorder';
import { safeHttpUrlForAttribute } from '../../utils/safeHttpUrl';
import styles from './preorders/preordersPublic.module.css';

export const MyOrdersPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
    enabled: isAuthenticated,
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
            <span className={styles.headingGradient}>Đơn hàng</span> của tôi
          </h1>
          {authLoading && <div className={styles.loading}>Đang kiểm tra đăng nhập...</div>}
          {!authLoading && !isAuthenticated && (
            <div className={styles.card}>
              <div className={styles.body}>
                <strong>Vui lòng đăng nhập để xem đơn hàng của bạn.</strong>
                <Link className={styles.cta} to="/admin/login">
                  Đăng nhập
                </Link>
              </div>
            </div>
          )}
          {isLoading && <div className={styles.loading}>Đang tải đơn hàng...</div>}
          {!authLoading && isAuthenticated && isError && (
            <div className={styles.alert}>Không thể tải danh sách đơn hàng. Vui lòng thử lại.</div>
          )}
          {!authLoading && isAuthenticated && !isLoading && !isError && cards.length === 0 && (
            <div className={styles.alert}>Bạn chưa có đơn pre-order nào.</div>
          )}
          {cards.map((card) => (
            <article key={card.id} className={styles.card} data-testid="my-order-card">
              <img
                className={styles.image}
                src={safeHttpUrlForAttribute(card.cover_image_url)}
                alt={card.title}
              />
              <div className={styles.body}>
                <span className={styles.badge} data-testid="my-order-status">
                  {PREORDER_STATUS_LABELS[card.status]}
                </span>
                <strong>{card.title}</strong>
                <span>Số lượng: {card.quantity}</span>
                <span className={styles.price}>{card.display_price.toLocaleString('vi-VN')} VND</span>
                <button type="button" className={styles.cta}>
                  Theo dõi vận chuyển
                </button>
                <button type="button" className={styles.ctaSecondary}>
                  Chi tiết đơn hàng
                </button>
                <button type="button" className={styles.ctaSecondary}>
                  Quản lý thanh toán
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};


import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrders } from '../../api/preorders';
import { useAuth } from '../../hooks/useAuth';
import { PREORDER_STATUS_LABELS } from '../../constants/preorder';
import { safeHttpUrlForAttribute } from '../../utils/safeHttpUrl';
import { BottomNavigation } from './preorders/BottomNavigation';
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
    <div className={styles.page}>
      <h1 className={styles.heading}>Đơn hàng của tôi</h1>
      {authLoading && <div>Đang kiểm tra đăng nhập...</div>}
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
      {isLoading && <div>Đang tải đơn hàng...</div>}
      {!authLoading && isAuthenticated && isError && (
        <div className={styles.card}>Không thể tải danh sách đơn hàng. Vui lòng thử lại.</div>
      )}
      {!authLoading && isAuthenticated && !isLoading && !isError && cards.length === 0 && (
        <div className={styles.card}>Bạn chưa có đơn pre-order nào.</div>
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
            <button type="button" className={styles.cta}>
              Chi tiết đơn hàng
            </button>
            <button type="button" className={styles.cta}>
              Quản lý thanh toán
            </button>
          </div>
        </article>
      ))}
      <BottomNavigation />
    </div>
  );
};


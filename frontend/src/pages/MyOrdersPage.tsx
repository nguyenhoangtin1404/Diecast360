import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrders } from '../api/preorders';
import { PREORDER_STATUS_LABELS } from './admin/preorders/status';
import { BottomNavigation } from './public/preorders/BottomNavigation';
import styles from './public/preorders/preordersPublic.module.css';

export const MyOrdersPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  });

  const cards = useMemo(() => data?.cards ?? [], [data?.cards]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Don hang cua toi</h1>
      {isLoading && <div>Dang tai don hang...</div>}
      {cards.map((card) => (
        <article key={card.id} className={styles.card} data-testid="my-order-card">
          <img className={styles.image} src={card.cover_image_url ?? ''} alt={card.title} />
          <div className={styles.body}>
            <span className={styles.badge} data-testid="my-order-status">
              {PREORDER_STATUS_LABELS[card.status]}
            </span>
            <strong>{card.title}</strong>
            <span>So luong: {card.quantity}</span>
            <span className={styles.price}>{card.display_price.toLocaleString('vi-VN')} VND</span>
            <button type="button" className={styles.cta}>
              Theo doi van chuyen
            </button>
            <button type="button" className={styles.cta}>
              Chi tiet don hang
            </button>
            <button type="button" className={styles.cta}>
              Quan ly thanh toan
            </button>
          </div>
        </article>
      ))}
      <BottomNavigation />
    </div>
  );
};


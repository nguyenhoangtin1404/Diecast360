import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicPreorders } from '../api/preorders';
import { useAuth } from '../hooks/useAuth';
import { PREORDER_STATUS_LABELS } from './admin/preorders/status';
import { BottomNavigation } from './public/preorders/BottomNavigation';
import styles from './public/preorders/preordersPublic.module.css';

const formatCountdown = (target: string | null) => {
  if (!target) return 'Chua co lich giao';
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return 'San sang giao';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `Con ${days} ngay`;
};

export const PublicPreOrdersPage = () => {
  const { user } = useAuth();
  const shopId = user?.active_shop_id ?? user?.allowed_shop_ids?.[0] ?? '';
  const { data, isLoading } = useQuery({
    queryKey: ['public-preorders', shopId],
    queryFn: async () => fetchPublicPreorders(shopId),
    enabled: Boolean(shopId),
  });

  const cards = useMemo(() => data?.cards ?? [], [data?.cards]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Mo hinh Dat truoc</h1>
      {isLoading && <div>Dang tai danh sach...</div>}
      {cards.map((card) => (
        <article key={card.id} className={styles.card} data-testid="public-preorder-card">
          <img className={styles.image} src={card.cover_image_url ?? ''} alt={card.title} />
          <div className={styles.body}>
            <span className={styles.badge} data-testid="public-preorder-status-badge">
              {PREORDER_STATUS_LABELS[card.status]}
            </span>
            <strong>{card.title}</strong>
            <span>{card.short_specs}</span>
            <span data-testid="public-preorder-countdown">{formatCountdown(card.countdown_target)}</span>
            <span className={styles.price}>{card.display_price.toLocaleString('vi-VN')} VND</span>
            <button className={styles.cta} type="button" data-testid="public-preorder-cta">
              Dat hang ngay
            </button>
          </div>
        </article>
      ))}
      <BottomNavigation />
    </div>
  );
};


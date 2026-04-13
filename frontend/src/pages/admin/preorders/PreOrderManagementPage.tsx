import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminPreorders, fetchCampaignParticipants } from '../../../api/preorders';
import { PREORDER_STATUS_LABELS } from './status';
import styles from './preordersAdmin.module.css';

export const PreOrderManagementPage = () => {
  const { data } = useQuery({
    queryKey: ['admin-preorder-manage'],
    queryFn: async () => fetchAdminPreorders(),
  });

  const firstItemId = data?.preorders?.[0]?.item_id ?? '';
  const participantsQuery = useQuery({
    queryKey: ['admin-preorder-participants', firstItemId],
    queryFn: async () => fetchCampaignParticipants(firstItemId),
    enabled: Boolean(firstItemId),
  });

  const projectedRevenue = useMemo(
    () => (data?.preorders ?? []).reduce((sum, order) => sum + (order.total_amount ?? 0), 0),
    [data?.preorders],
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Quan ly Pre-order</h1>
        <p>Theo doi campaign, doanh thu du kien va danh sach nguoi tham gia.</p>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.card}>
          <h2>Tong quan campaign</h2>
          <p data-testid="admin-campaign-summary">
            So don dang mo: {(data?.preorders ?? []).length}
          </p>
          <p>Doanh thu du kien: {projectedRevenue.toLocaleString('vi-VN')} VND</p>
        </div>
        <div className={styles.card}>
          <h2>Hanh dong nhanh</h2>
          <div className={styles.controls}>
            <button type="button" className={styles.button}>
              Xem chi tiet campaign
            </button>
            <button type="button" className={`${styles.button} ${styles.buttonSecondary}`}>
              Them nguoi tham gia
            </button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2>Danh sach nguoi tham gia</h2>
        {participantsQuery.isLoading && <p>Dang tai danh sach...</p>}
        {(participantsQuery.data?.participants ?? []).map((participant) => (
          <div key={participant.preorder_id} className={styles.row} data-testid="admin-participant-row">
            <strong>{participant.user?.full_name ?? participant.user?.email ?? 'Khach le'}</strong>
            <span>So luong: {participant.quantity}</span>
            <span>Trang thai: {PREORDER_STATUS_LABELS[participant.status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminPreorders,
  fetchCampaignParticipants,
  transitionPreorderStatus,
} from '../../../api/preorders';
import type { PreOrderStatus } from '../../../types/preorder';
import { PREORDER_STATUS_LABELS, PREORDER_TRANSITIONS } from './status';
import styles from './preordersAdmin.module.css';

export const PreOrderManagementPage = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-preorder-manage'],
    queryFn: async () => fetchAdminPreorders(undefined, { page: 1, pageSize: 50 }),
  });

  const campaigns = useMemo(() => {
    const entries = data?.preorders ?? [];
    const map = new Map<string, string>();
    entries.forEach((order) => {
      if (!map.has(order.item_id)) {
        map.set(order.item_id, order.item?.name ?? order.item_id);
      }
    });
    return Array.from(map.entries()).map(([itemId, label]) => ({ itemId, label }));
  }, [data?.preorders]);

  /** User override; when null or stale, first campaign is used. */
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const effectiveCampaignId = useMemo(() => {
    if (!campaigns.length) {
      return '';
    }
    if (selectedCampaignId && campaigns.some((campaign) => campaign.itemId === selectedCampaignId)) {
      return selectedCampaignId;
    }
    return campaigns[0].itemId;
  }, [campaigns, selectedCampaignId]);

  const participantsQuery = useQuery({
    queryKey: ['admin-preorder-participants', effectiveCampaignId],
    queryFn: async () => fetchCampaignParticipants(effectiveCampaignId),
    enabled: Boolean(effectiveCampaignId),
  });

  const campaignPreorders = useMemo(
    () => (data?.preorders ?? []).filter((order) => order.item_id === effectiveCampaignId),
    [data?.preorders, effectiveCampaignId],
  );

  const projectedRevenue = useMemo(
    () => campaignPreorders.reduce((sum, order) => sum + (order.total_amount ?? 0), 0),
    [campaignPreorders],
  );

  const [transitionError, setTransitionError] = useState<string | null>(null);

  const transitionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PreOrderStatus }) =>
      transitionPreorderStatus(id, status),
    onMutate: () => {
      setTransitionError(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-preorder-manage'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-preorder-participants'] });
    },
    onError: () => {
      setTransitionError('Chuyển trạng thái thất bại. Vui lòng thử lại.');
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Quản lý Pre-order</h1>
        <p>Theo dõi campaign, doanh thu dự kiến và danh sách người tham gia.</p>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.card}>
          <h2>Tổng quan campaign</h2>
          <p data-testid="admin-campaign-summary">
            Số đơn đang mở (campaign đã chọn): {campaignPreorders.length}
          </p>
          <p>Doanh thu dự kiến: {projectedRevenue.toLocaleString('vi-VN')} VND</p>
        </div>
        <div className={styles.card}>
          <h2>Hành động nhanh</h2>
          <label>
            Chọn campaign:
            <select
              className={styles.select}
              data-testid="admin-campaign-selector"
              value={effectiveCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
            >
              {campaigns.map((campaign) => (
                <option key={campaign.itemId} value={campaign.itemId}>
                  {campaign.label}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.controls}>
            <Link
              className={styles.button}
              to={effectiveCampaignId ? `/admin/items/${effectiveCampaignId}` : '#'}
              aria-disabled={!effectiveCampaignId}
              onClick={(event) => {
                if (!effectiveCampaignId) {
                  event.preventDefault();
                }
              }}
            >
              Xem chi tiết campaign
            </Link>
            <Link
              className={`${styles.button} ${styles.buttonSecondary}`}
              to={
                effectiveCampaignId
                  ? `/admin/preorders/create?item_id=${encodeURIComponent(effectiveCampaignId)}`
                  : '#'
              }
              aria-disabled={!effectiveCampaignId}
              onClick={(event) => {
                if (!effectiveCampaignId) {
                  event.preventDefault();
                }
              }}
            >
              Thêm người tham gia
            </Link>
          </div>
        </div>
      </div>

      {transitionError && (
        <div className={styles.card} data-testid="admin-manage-transition-error">
          {transitionError}
        </div>
      )}

      <div className={styles.card}>
        <h2>Danh sách người tham gia</h2>
        {!campaigns.length && <p>Chưa có campaign pre-order để quản lý.</p>}
        {participantsQuery.isLoading && <p>Đang tải danh sách...</p>}
        {(participantsQuery.data?.participants ?? []).map((participant) => (
          <div key={participant.preorder_id} className={styles.row} data-testid="admin-participant-row">
            <strong>{participant.user?.full_name ?? participant.user?.email ?? 'Khách lẻ'}</strong>
            <span>Số lượng: {participant.quantity}</span>
            <span>Trạng thái: {PREORDER_STATUS_LABELS[participant.status]}</span>
            <div className={styles.controls}>
              {(PREORDER_TRANSITIONS[participant.status] ?? []).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={styles.button}
                  disabled={transitionMutation.isPending}
                  data-testid="admin-participant-transition"
                  onClick={() =>
                    transitionMutation.mutate({ id: participant.preorder_id, status })
                  }
                >
                  Chuyển sang: {PREORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

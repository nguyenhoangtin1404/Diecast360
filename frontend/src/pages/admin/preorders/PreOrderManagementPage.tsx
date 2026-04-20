import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminPreorders, fetchCampaignParticipants } from '../../../api/preorders';
import { PREORDER_STATUS_LABELS } from '../../../constants/preorder';
import { usePreorderTransition } from '../../../hooks/usePreorderTransition';
import { PREORDER_TRANSITIONS } from './status';
import styles from './preordersAdmin.module.css';

const PAGE_SIZE = 50;

export const PreOrderManagementPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-preorder-manage', page, PAGE_SIZE],
    queryFn: async () => fetchAdminPreorders(undefined, { page, pageSize: PAGE_SIZE }),
  });

  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);
  const totalCount = pagination?.total ?? 0;
  const pageOutOfRange = Boolean(pagination && page > totalPages);

  const campaigns = useMemo(() => {
    const list = data?.preorders ?? [];
    const map = new Map<string, string>();
    list.forEach((order) => {
      if (!map.has(order.item_id)) {
        map.set(order.item_id, order.item?.name ?? order.item_id);
      }
    });
    return Array.from(map.entries()).map(([itemId, label]) => ({ itemId, label }));
  }, [data?.preorders]);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const effectiveCampaignId =
    campaigns.length === 0
      ? ''
      : selectedCampaignId && campaigns.some((campaign) => campaign.itemId === selectedCampaignId)
        ? selectedCampaignId
        : campaigns[0].itemId;

  const participantsQuery = useQuery({
    queryKey: ['admin-preorder-participants', effectiveCampaignId],
    queryFn: async () => fetchCampaignParticipants(effectiveCampaignId),
    enabled: Boolean(effectiveCampaignId),
  });

  const campaignPreorders = (data?.preorders ?? []).filter((order) => order.item_id === effectiveCampaignId);
  const projectedRevenue = campaignPreorders.reduce((sum, order) => sum + (order.total_amount ?? 0), 0);

  const { transitionMutation, transitionError } = usePreorderTransition(() => {
    void queryClient.invalidateQueries({ queryKey: ['admin-preorder-manage'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-preorder-participants'] });
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Quản lý Pre-order</h1>
        <p>Theo dõi campaign, doanh thu dự kiến và danh sách người tham gia.</p>
      </div>

      {isLoading && <div className={styles.card}>Đang tải danh sách pre-order...</div>}

      {!isLoading && pageOutOfRange && (
        <div className={styles.card} data-testid="admin-manage-page-out-of-range">
          <p className={styles.error}>
            Trang {page} vượt quá tổng số trang ({totalPages}). Dữ liệu có thể không đầy đủ.
          </p>
          <button type="button" className={styles.buttonPrimary} onClick={() => setPage(1)}>
            Về trang 1
          </button>
        </div>
      )}

      {!isLoading && pagination && totalPages > 1 && (
        <div className={styles.card} data-testid="admin-manage-pagination">
          <p>
            {`Hiển thị ${(data?.preorders ?? []).length} / ${totalCount} đơn (trang ${Math.min(page, totalPages)}/${totalPages}, ${PAGE_SIZE} đơn/trang).`}
          </p>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.buttonSecondary}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

      {!isLoading && pagination && totalPages === 1 && totalCount > 0 && (
        <p className={styles.card} data-testid="admin-manage-list-meta">
          Tổng {totalCount} đơn pre-order trong shop.
        </p>
      )}

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
              className={styles.buttonPrimary}
              to={effectiveCampaignId ? `/admin/items/${effectiveCampaignId}` : '#'}
              aria-disabled={!effectiveCampaignId}
              tabIndex={effectiveCampaignId ? undefined : -1}
              onClick={(event) => {
                if (!effectiveCampaignId) {
                  event.preventDefault();
                }
              }}
            >
              Xem chi tiết campaign
            </Link>
            <Link
              className={styles.button}
              to={
                effectiveCampaignId
                  ? `/admin/preorders/create?item_id=${encodeURIComponent(effectiveCampaignId)}`
                  : '#'
              }
              aria-disabled={!effectiveCampaignId}
              tabIndex={effectiveCampaignId ? undefined : -1}
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

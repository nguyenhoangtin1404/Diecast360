import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchAdminPreorders, transitionPreorderStatus } from '../../api/preorders';
import type { PreOrderStatus } from '../../types/preorder';
import {
  PREORDER_STATUS_COLORS,
  PREORDER_STATUS_LABELS,
  PREORDER_TRANSITIONS,
} from './preorders/status';
import styles from './preorders/preordersAdmin.module.css';

export const PreOrdersPage = () => {
  const [filterStatus, setFilterStatus] = useState<PreOrderStatus | 'ALL'>('ALL');
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-preorders', filterStatus],
    queryFn: async () => fetchAdminPreorders(filterStatus === 'ALL' ? undefined : filterStatus),
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PreOrderStatus }) =>
      transitionPreorderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-preorders'] });
    },
  });

  const preorders = useMemo(() => data?.preorders ?? [], [data?.preorders]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Quan ly Pre-order</h1>
        <div className={styles.controls}>
          <label>
            Loc trang thai:
            <select
              data-testid="admin-preorder-status-filter"
              className={styles.select}
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as PreOrderStatus | 'ALL')}
            >
              <option value="ALL">Tat ca</option>
              {Object.entries(PREORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Link className={styles.button} to="/admin/preorders/create">
            Tao Pre-Order Moi
          </Link>
          <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/admin/preorders/manage">
            Quan ly theo campaign
          </Link>
        </div>
      </div>

      {isLoading && <div className={styles.card}>Dang tai danh sach pre-order...</div>}
      {error && <div className={styles.card}>Khong the tai danh sach pre-order.</div>}

      {preorders.map((preorder) => (
        <div className={styles.card} key={preorder.id} data-testid="admin-preorder-card">
          <div className={styles.row}>
            <strong>{preorder.item?.name ?? preorder.item_id}</strong>
            <span>{preorder.user?.full_name ?? preorder.user?.email ?? 'Khach le'}</span>
            <span
              className={styles.badge}
              style={{ background: PREORDER_STATUS_COLORS[preorder.status] }}
              data-testid="admin-preorder-status-badge"
            >
              {PREORDER_STATUS_LABELS[preorder.status]}
            </span>
            <span>So luong: {preorder.quantity}</span>
            <span>Tong tien: {(preorder.total_amount ?? preorder.unit_price ?? 0).toLocaleString('vi-VN')} VND</span>
            <div className={styles.controls}>
              {(PREORDER_TRANSITIONS[preorder.status] ?? []).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={styles.button}
                  disabled={transitionMutation.isPending}
                  onClick={() => transitionMutation.mutate({ id: preorder.id, status })}
                >
                  Chuyen sang: {PREORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


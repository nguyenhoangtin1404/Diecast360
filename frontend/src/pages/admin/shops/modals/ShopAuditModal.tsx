import React from 'react';
import { styles } from '../../ShopsPage.styles';
import type { ShopAuditLogRow } from '../types';

type Props = {
  open: boolean;
  shopId: string | null;
  shopName: string;
  logs: ShopAuditLogRow[];
  loading: boolean;
  error: string | null;
  actionFilter: string;
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  totalPages: number;
  onClose: () => void;
  onActionFilterChange: (value: string) => void | Promise<void>;
  onPageSizeChange: (value: 10 | 20 | 50 | 100) => void | Promise<void>;
  onPrevPage: () => void | Promise<void>;
  onNextPage: () => void | Promise<void>;
  actionLabel: (action: ShopAuditLogRow['action']) => string;
};

const ShopAuditModal: React.FC<Props> = ({
  open,
  shopName,
  logs,
  loading,
  error,
  actionFilter,
  page,
  pageSize,
  totalPages,
  onClose,
  onActionFilterChange,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
  actionLabel,
}) => {
  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalTitle}>Lịch sử hoạt động — {shopName}</div>
        <div style={styles.itemsToolbar}>
          <select
            value={actionFilter}
            style={styles.itemsPageSizeSelect}
            onChange={(e) => onActionFilterChange(e.target.value)}
          >
            <option value="">Tất cả hành động</option>
            <option value="add_shop_admin">Thêm quản trị shop</option>
            <option value="reset_member_password">Reset mật khẩu</option>
            <option value="set_member_active">Khóa/Mở khóa tài khoản</option>
            <option value="update_shop">Cập nhật shop</option>
            <option value="deactivate_shop">Tắt shop</option>
            <option value="activate_shop">Mở lại shop</option>
          </select>
          <select
            value={pageSize}
            style={styles.itemsPageSizeSelect}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as 10 | 20 | 50 | 100)}
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>

        {error && <p style={styles.modalError}>{error}</p>}
        {loading ? (
          <p style={styles.modalHint}>Đang tải...</p>
        ) : (
          <div style={styles.shopItemsTableWrap}>
            {logs.length === 0 ? (
              <p style={styles.modalHint}>Chưa có bản ghi hoạt động.</p>
            ) : (
              <table style={styles.shopItemsTable}>
                <thead>
                  <tr>
                    <th style={styles.shopItemsTh}>Thời gian</th>
                    <th style={styles.shopItemsTh}>Hành động</th>
                    <th style={styles.shopItemsTh}>Người thực hiện</th>
                    <th style={styles.shopItemsTh}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={styles.shopItemsTd}>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                      <td style={styles.shopItemsTd}>{actionLabel(log.action)}</td>
                      <td style={styles.shopItemsTd}>
                        {log.actor?.full_name?.trim() || log.actor?.email || 'Hệ thống'}
                      </td>
                      <td style={styles.shopItemsTd}>{log.metadata ? <code>{JSON.stringify(log.metadata)}</code> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div style={styles.itemsPaginationRow}>
          <span style={styles.modalHint}>
            Trang {page}/{totalPages}
          </span>
          <div style={styles.itemsPaginationBtns}>
            <button type="button" style={styles.modalCancelBtn} onClick={onPrevPage} disabled={page <= 1 || loading}>
              Trước
            </button>
            <button
              type="button"
              style={styles.modalCancelBtn}
              onClick={onNextPage}
              disabled={page >= totalPages || loading}
            >
              Sau
            </button>
            <button type="button" style={styles.modalConfirmBtn} onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopAuditModal;

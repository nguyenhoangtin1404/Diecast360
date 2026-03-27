import React from 'react';
import { styles } from '../../ShopsPage.styles';
import type { ShopItemRow } from '../types';

type Props = {
  open: boolean;
  shopName: string;
  draftQuery: string;
  pageSize: 10 | 20 | 50 | 100;
  loading: boolean;
  error: string | null;
  items: ShopItemRow[];
  total: number;
  page: number;
  totalPages: number;
  onClose: () => void;
  onDraftQueryChange: (value: string) => void;
  onSubmitSearch: (e: React.FormEvent) => void;
  onChangePageSize: (value: 10 | 20 | 50 | 100) => void | Promise<void>;
  onChangePage: (nextPage: number) => void | Promise<void>;
};

const ShopItemsModal: React.FC<Props> = ({
  open,
  shopName,
  draftQuery,
  pageSize,
  loading,
  error,
  items,
  total,
  page,
  totalPages,
  onClose,
  onDraftQueryChange,
  onSubmitSearch,
  onChangePageSize,
  onChangePage,
}) => {
  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '860px' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalTitle}>Mặt hàng — {shopName}</div>
        <form style={styles.itemsToolbar} onSubmit={onSubmitSearch}>
          <input
            style={{ ...styles.modalInput, flex: 1 }}
            placeholder="Tìm theo tên sản phẩm..."
            value={draftQuery}
            onChange={(e) => onDraftQueryChange(e.target.value)}
          />
          <select
            value={pageSize}
            style={styles.itemsPageSizeSelect}
            onChange={(e) => onChangePageSize(Number(e.target.value) as 10 | 20 | 50 | 100)}
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
          <button type="submit" style={styles.modalConfirmBtn}>
            Tìm
          </button>
        </form>

        {error && <p style={styles.modalError}>{error}</p>}
        {loading ? (
          <p style={styles.modalHint}>Đang tải...</p>
        ) : (
          <div style={styles.shopItemsTableWrap}>
            {items.length === 0 ? (
              <p style={styles.modalHint}>Không có mặt hàng phù hợp.</p>
            ) : (
              <table style={styles.shopItemsTable}>
                <thead>
                  <tr>
                    <th style={styles.shopItemsTh}>Ảnh</th>
                    <th style={styles.shopItemsTh}>Tên sản phẩm</th>
                    <th style={styles.shopItemsTh}>Giá</th>
                    <th style={styles.shopItemsTh}>Ngày nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.shopItemsTd}>
                        {item.cover_image_url ? (
                          <img src={item.cover_image_url} alt={item.name} style={styles.shopItemThumb} />
                        ) : (
                          <div style={styles.shopItemNoImage}>No image</div>
                        )}
                      </td>
                      <td style={styles.shopItemsTd}>{item.name}</td>
                      <td style={styles.shopItemsTd}>
                        {item.price != null ? `${item.price.toLocaleString('vi-VN')} đ` : '—'}
                      </td>
                      <td style={styles.shopItemsTd}>
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div style={styles.itemsPaginationRow}>
          <span style={styles.modalHint}>
            Tổng {total} mặt hàng · Trang {page}/{totalPages}
          </span>
          <div style={styles.itemsPaginationBtns}>
            <button
              type="button"
              style={styles.modalCancelBtn}
              onClick={() => onChangePage(page - 1)}
              disabled={page <= 1 || loading}
            >
              Trước
            </button>
            <button
              type="button"
              style={styles.modalCancelBtn}
              onClick={() => onChangePage(page + 1)}
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

export default ShopItemsModal;

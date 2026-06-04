import React from 'react';
import { styles } from '../../ShopsPage.styles';
import { ShopContactFields } from '../ShopContactFields';
import { parseShopContactFormDefaults, buildShopContactPatch } from '../shopContactForm';
import type { ShopContactFormState } from '../types/shopContact';
import type { Shop } from '../types';

type Props = {
  shop: Shop;
  editShopName: string;
  editShopContact: ShopContactFormState;
  editShopSaving: boolean;
  editShopError: string | null;
  onClose: () => void;
  onNameChange: (v: string) => void;
  onContactChange: (v: ShopContactFormState) => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
};

const EditShopModal: React.FC<Props> = ({
  shop,
  editShopName,
  editShopContact,
  editShopSaving,
  editShopError,
  onClose,
  onNameChange,
  onContactChange,
  onSubmit,
}) => {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          ...styles.modal,
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalTitle}>Sửa thông tin shop</div>
        {editShopError && <p style={styles.modalError}>{editShopError}</p>}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={styles.formRow}>
            <label style={styles.modalLabel} htmlFor={`edit-shop-name-${shop.id}`}>
              Tên shop
            </label>
            <input
              id={`edit-shop-name-${shop.id}`}
              style={styles.modalInput}
              value={editShopName}
              onChange={(e) => onNameChange(e.target.value)}
              required
              autoComplete="off"
              placeholder="Tên hiển thị của shop"
            />
          </div>
          <p style={styles.modalHint}>
            Shop URL <code style={styles.modalCode}>{shop.slug}</code> — slug không sửa trên form này.
          </p>

          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              marginTop: '4px',
              paddingTop: '12px',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              Trang liên hệ (công khai)
            </div>
            <p style={{ ...styles.modalHint, marginBottom: '10px' }}>
              Nội dung hiển thị tại <code style={styles.modalCode}>/contact?shop_id=</code> (UUID hoặc slug). Để
              trống một ô rồi lưu sẽ xóa giá trị đó.
            </p>
          </div>

          <ShopContactFields
            idPrefix={`edit-shop-${shop.id}`}
            value={editShopContact}
            onChange={onContactChange}
            styles={{
              formRow: styles.formRow,
              modalLabel: styles.modalLabel,
              modalInput: styles.modalInput,
              modalHint: styles.modalHint,
              sectionTitle: { fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '8px' },
            }}
          />

          <div style={styles.modalActions}>
            <button type="button" style={styles.modalCancelBtn} onClick={onClose} disabled={editShopSaving}>
              Hủy
            </button>
            <button type="submit" style={styles.modalConfirmBtn} disabled={editShopSaving}>
              {editShopSaving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditShopModal;

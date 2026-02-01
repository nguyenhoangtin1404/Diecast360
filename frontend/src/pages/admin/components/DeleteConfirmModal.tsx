import { AlertTriangle, Trash2 } from 'lucide-react';
import styles from '../ItemsPage.module.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal = ({
  isOpen,
  itemName,
  isPending,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <AlertTriangle size={24} color="#dc3545" />
          </div>
          <div>
            <h3 className={styles.modalTitle}>Xác nhận xóa</h3>
            <p className={styles.modalSubtitle}>Hành động này không thể hoàn tác</p>
          </div>
        </div>
        <p className={styles.modalText}>
          Bạn có chắc chắn muốn xóa sản phẩm <strong>"{itemName}"</strong>?
        </p>
        <div className={styles.modalActions}>
          <button
            onClick={onCancel}
            disabled={isPending}
            className={styles.modalBtnCancel}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={styles.modalBtnConfirm}
          >
            {isPending ? (
              <span>Đang xóa...</span>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

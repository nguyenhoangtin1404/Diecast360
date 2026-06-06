import { useState } from 'react';
import type { PreorderReceiptPayload } from '../../types/preorderReceipt';
import { buildPreorderReceiptHtml } from '../../utils/preorderReceiptHtml';
import type { PaperWidth } from '../../utils/preorderReceiptHtml';
import { printPreorderReceipt } from '../../utils/printPreorderReceipt';
import styles from './PrintReceiptModal.module.css';

const PAPER_WIDTH_KEY = 'receipt_paper_width';

const readPaperWidth = (): PaperWidth => {
  try {
    const v = localStorage.getItem(PAPER_WIDTH_KEY);
    if (v === 'K57' || v === 'K80') return v;
  } catch { /* ignore */ }
  return 'K57';
};

const PAPER_OPTIONS: { value: PaperWidth; label: string }[] = [
  { value: 'K57', label: '58mm (K57)' },
  { value: 'K80', label: '80mm (K80)' },
];

/** Detect iOS/iPadOS — không hỗ trợ in Bluetooth non-AirPrint qua browser. */
const IS_IOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

interface PrintReceiptModalProps {
  data: PreorderReceiptPayload;
  open: boolean;
  onClose: () => void;
}

export const PrintReceiptModal = ({ data, open, onClose }: PrintReceiptModalProps) => {
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(readPaperWidth);

  if (!open) return null;

  const selectPaper = (pw: PaperWidth) => {
    setPaperWidth(pw);
    try { localStorage.setItem(PAPER_WIDTH_KEY, pw); } catch { /* ignore */ }
  };

  const handlePrint = () => {
    printPreorderReceipt(data, paperWidth);
  };

  const previewHtml = buildPreorderReceiptHtml(data, 'thermal', { paperWidth });

  return (
    <div className={styles.overlay} onClick={onClose} data-testid="print-receipt-modal-overlay">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} data-testid="print-receipt-modal">
        <div className={styles.header}>
          <h2 className={styles.title}>Xem trước và in phiếu</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {IS_IOS && (
          <div className={styles.iosNotice}>
            Thiết bị iOS không hỗ trợ in Bluetooth trực tiếp (MP-210 không có AirPrint).
            Dùng nút <strong>Tạo ảnh</strong> để xuất phiếu rồi in từ ứng dụng ảnh.
          </div>
        )}

        <div className={styles.paperSection}>
          <div className={styles.paperLabel}>Khổ giấy</div>
          <div className={styles.paperOptions}>
            {PAPER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={[
                  styles.paperOption,
                  paperWidth === value ? styles.paperOptionActive : '',
                ].join(' ')}
                onClick={() => selectPaper(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.previewWrap}>
          {/* key={paperWidth} buộc iframe remount khi đổi khổ giấy */}
          <iframe
            key={paperWidth}
            srcdoc={previewHtml}
            className={styles.previewFrame}
            title="Xem trước phiếu"
            data-testid="print-receipt-preview"
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className={styles.btnPrint}
            onClick={handlePrint}
            data-testid="print-receipt-confirm"
          >
            🖨️ In ngay
          </button>
        </div>
      </div>
    </div>
  );
};

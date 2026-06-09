import { useEffect, useRef, useState } from 'react';
import type { PreorderReceiptPayload } from '../../types/preorderReceipt';
import { buildPreorderReceiptHtml } from '../../utils/preorderReceiptHtml';
import type { PaperWidth } from '../../utils/preorderReceiptHtml';
import {
  openReceiptPrintPopup,
  RECEIPT_AFTER_PRINT_MSG,
  RECEIPT_PRINT_MSG,
  shouldUsePreviewIframePrint,
} from '../../utils/printPreorderReceipt';
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
  const [printing, setPrinting] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [printBlocked, setPrintBlocked] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPreviewAfterPrint = (e: MessageEvent) => {
      if (e.source === previewRef.current?.contentWindow && e.data === RECEIPT_AFTER_PRINT_MSG) {
        setPrinting(false);
        onClose();
      }
    };
    window.addEventListener('message', onPreviewAfterPrint);
    return () => window.removeEventListener('message', onPreviewAfterPrint);
  }, [open, onClose]);

  if (!open) return null;

  const selectPaper = (pw: PaperWidth) => {
    setPaperWidth(pw);
    setIframeReady(false);
    try { localStorage.setItem(PAPER_WIDTH_KEY, pw); } catch { /* ignore */ }
  };

  const handlePrint = () => {
    if (printing || !iframeReady) return;
    setPrintBlocked(false);

    // Android: in từ preview iframe đã load — popup/hidden iframe hay báo lỗi in.
    if (shouldUsePreviewIframePrint()) {
      const win = previewRef.current?.contentWindow;
      if (!win) return;
      setPrinting(true);
      win.postMessage(RECEIPT_PRINT_MSG, '*');
      setTimeout(() => setPrinting(false), 60_000);
      return;
    }

    const result = openReceiptPrintPopup(previewHtml);
    if (!result.ok) {
      setPrintBlocked(true);
      return;
    }
    const { popup } = result;
    setPrinting(true);
    const onMsg = (e: MessageEvent) => {
      if (e.source === popup && e.data === RECEIPT_AFTER_PRINT_MSG) {
        window.removeEventListener('message', onMsg);
        setPrinting(false);
        onClose();
      }
    };
    window.addEventListener('message', onMsg);
    // Fallback nếu afterprint/postMessage không fire (một số mobile browser)
    setTimeout(() => {
      window.removeEventListener('message', onMsg);
      if (!popup.closed) popup.close();
      setPrinting(false);
    }, 60_000);
  };

  const previewHtml = buildPreorderReceiptHtml(data, 'thermal', { paperWidth });

  return (
    <div className={styles.overlay} onClick={onClose} data-testid="print-receipt-modal-overlay">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Xem trước và in phiếu"
        tabIndex={-1}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        data-testid="print-receipt-modal"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Xem trước và in phiếu</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng modal">
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
            ref={previewRef}
            srcDoc={previewHtml}
            onLoad={() => setIframeReady(true)}
            className={styles.previewFrame}
            title="Xem trước phiếu"
            data-testid="print-receipt-preview"
          />
        </div>

        {printBlocked && (
          <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: '0 0 8px', textAlign: 'center' }} role="alert">
            Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup và thử lại.
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className={styles.btnPrint}
            onClick={handlePrint}
            disabled={IS_IOS || printing || !iframeReady}
            title={IS_IOS ? 'iOS không hỗ trợ in Bluetooth non-AirPrint' : undefined}
            data-testid="print-receipt-confirm"
          >
            🖨️ In ngay
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { fetchPreorderReceipt } from '../../api/preorders';
import {
  downloadPreorderReceiptPng,
  exportPreorderReceiptImage,
  sharePreorderReceiptPng,
} from '../../utils/exportPreorderReceiptImage';
import {
  fillReceiptPrintWindow,
  openReceiptPrintWindow,
} from '../../utils/printPreorderReceipt';

type PreorderReceiptActionsProps = {
  preorderId: string;
  className?: string;
  buttonClassName?: string;
  compact?: boolean;
};

export const PreorderReceiptActions = ({
  preorderId,
  className = '',
  buttonClassName = '',
  compact = false,
}: PreorderReceiptActionsProps) => {
  const [busy, setBusy] = useState<'print' | 'image' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReceipt = async () => {
    setError(null);
    return fetchPreorderReceipt(preorderId);
  };

  const handlePrint = async () => {
    const printWindow = openReceiptPrintWindow();
    if (!printWindow) {
      return;
    }
    setBusy('print');
    try {
      const data = await loadReceipt();
      fillReceiptPrintWindow(printWindow, data);
    } catch {
      printWindow.close();
      setError('Không thể tải hoặc in phiếu. Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  };

  const handleShareImage = async () => {
    setBusy('image');
    try {
      const data = await loadReceipt();
      const blob = await exportPreorderReceiptImage(data);
      const shared = await sharePreorderReceiptPng(blob, preorderId);
      if (!shared) {
        downloadPreorderReceiptPng(blob, preorderId);
      }
    } catch {
      setError('Không thể tạo ảnh phiếu. Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  };

  const btnClass = [buttonClassName, compact ? '' : ''].filter(Boolean).join(' ');

  return (
    <div className={className} data-testid="preorder-receipt-actions">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          className={btnClass || undefined}
          disabled={busy !== null}
          onClick={() => void handlePrint()}
          data-testid="preorder-receipt-print"
        >
          {busy === 'print' ? 'Đang in...' : 'In phiếu'}
        </button>
        <button
          type="button"
          className={btnClass}
          disabled={busy !== null}
          onClick={() => void handleShareImage()}
          data-testid="preorder-receipt-share-image"
        >
          {busy === 'image' ? 'Đang tạo ảnh...' : 'Tạo ảnh / Chia sẻ'}
        </button>
      </div>
      {error && (
        <p style={{ color: '#b91c1c', fontSize: '0.875rem', marginTop: '6px' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

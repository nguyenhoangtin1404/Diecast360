import { useState } from 'react';
import { fetchPreorderReceipt } from '../../api/preorders';
import type { PreorderReceiptPayload } from '../../types/preorderReceipt';
import {
  downloadPreorderReceiptPng,
  exportPreorderReceiptImage,
  sharePreorderReceiptPng,
} from '../../utils/exportPreorderReceiptImage';
import { PrintReceiptModal } from './PrintReceiptModal';

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
}: PreorderReceiptActionsProps) => {
  const [busy, setBusy] = useState<'print' | 'image' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<PreorderReceiptPayload | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadReceipt = async () => {
    setError(null);
    return fetchPreorderReceipt(preorderId);
  };

  const handleOpenPrint = async () => {
    setBusy('print');
    try {
      const data = await loadReceipt();
      setReceiptData(data);
      setModalOpen(true);
    } catch {
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

  return (
    <div className={className} data-testid="preorder-receipt-actions">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          className={buttonClassName || undefined}
          disabled={busy !== null}
          onClick={() => void handleOpenPrint()}
          data-testid="preorder-receipt-print"
        >
          {busy === 'print' ? 'Đang tải...' : 'In phiếu'}
        </button>
        <button
          type="button"
          className={buttonClassName}
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
      {receiptData && (
        <PrintReceiptModal
          data={receiptData}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setReceiptData(null);
          }}
        />
      )}
    </div>
  );
};

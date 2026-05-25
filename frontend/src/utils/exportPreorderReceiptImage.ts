import type { PreorderReceiptPayload } from '../types/preorderReceipt';
import { buildPreorderReceiptHtml } from './preorderReceiptHtml';

const shortId = (id: string): string => (id.length > 8 ? id.slice(-8) : id);

const mountOffscreenReceipt = (html: string): HTMLIFrameElement => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '420px';
  iframe.style.height = '1200px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    throw new Error('Không thể render phiếu.');
  }
  doc.open();
  doc.write(html);
  doc.close();
  return iframe;
};

const rasterizeBody = async (body: HTMLElement): Promise<Blob> => {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(body, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });
  const response = await fetch(dataUrl);
  return response.blob();
};

export const downloadPreorderReceiptPng = (blob: Blob, preorderId: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `phieu-dat-hang-${shortId(preorderId)}.png`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const sharePreorderReceiptPng = async (blob: Blob, preorderId: string): Promise<boolean> => {
  const file = new File([blob], `phieu-dat-hang-${shortId(preorderId)}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Phiếu đặt hàng',
    });
    return true;
  }
  return false;
};

export const exportPreorderReceiptImage = async (
  data: PreorderReceiptPayload,
): Promise<Blob> => {
  const html = buildPreorderReceiptHtml(data, 'share');
  const iframe = mountOffscreenReceipt(html);
  try {
    const body = iframe.contentDocument?.body;
    if (!body) {
      throw new Error('Không thể render phiếu.');
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    return await rasterizeBody(body);
  } finally {
    iframe.remove();
  }
};

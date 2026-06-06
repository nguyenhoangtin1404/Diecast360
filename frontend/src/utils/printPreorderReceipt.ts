import type { PreorderReceiptPayload } from '../types/preorderReceipt';
import { buildPreorderReceiptHtml } from './preorderReceiptHtml';
import type { PaperWidth } from './preorderReceiptHtml';

export type { PaperWidth };

/**
 * In phiếu bằng iframe ẩn — không cần popup permission, hoạt động trên
 * cả desktop lẫn Android tablet (Chrome). iOS không hỗ trợ non-AirPrint.
 */
export const printPreorderReceipt = (
  data: PreorderReceiptPayload,
  paperWidth: PaperWidth = 'K57',
): void => {
  const html = buildPreorderReceiptHtml(data, 'thermal', { paperWidth });

  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;visibility:hidden;';

  let cleaned = false;
  const cleanup = () => {
    if (!cleaned && document.body.contains(iframe)) {
      cleaned = true;
      document.body.removeChild(iframe);
    }
  };

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) { cleanup(); return; }
    win.addEventListener('afterprint', cleanup);
    // Fallback: dọn iframe sau 60s nếu afterprint không fire (một số mobile browser)
    setTimeout(cleanup, 60_000);
    win.focus();
    win.print();
  };

  // Đặt srcdoc TRƯỚC appendChild để tránh race condition:
  // một số browser fire onload cho about:blank ngay khi iframe được attach,
  // dẫn đến in trang trắng trước khi content được load.
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
};

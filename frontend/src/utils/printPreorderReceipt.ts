import type { PreorderReceiptPayload } from '../types/preorderReceipt';
import { buildPreorderReceiptHtml } from './preorderReceiptHtml';

const writeReceiptContent = (printWindow: Window, html: string): void => {
  printWindow.document.write(html.replace(
    '</body>',
    `<script>
      window.onload = function () {
        window.onafterprint = function () { window.close(); };
        window.print();
      };
    </script></body>`,
  ));
  printWindow.document.close();
};

export const openReceiptPrintWindow = (): Window | null => {
  const win = window.open('', '_blank', 'width=320,height=640');
  if (!win) {
    alert('Vui lòng cho phép cửa sổ pop-up để in phiếu.');
  }
  return win;
};

export const fillReceiptPrintWindow = (printWindow: Window, data: PreorderReceiptPayload): void => {
  const html = buildPreorderReceiptHtml(data, 'thermal');
  writeReceiptContent(printWindow, html);
};

export const printPreorderReceipt = (data: PreorderReceiptPayload): void => {
  const printWindow = openReceiptPrintWindow();
  if (!printWindow) {
    return;
  }
  fillReceiptPrintWindow(printWindow, data);
};

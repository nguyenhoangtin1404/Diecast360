function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeQrContent(
  printWindow: Window,
  imageDataUrl: string,
  productName: string,
  resolveUrl?: string,
): void {
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>QR - ${escapeHtml(productName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      font-family: Arial, sans-serif;
      width: 100%;
    }
    .name {
      font-size: 11pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 6pt;
      max-width: 100%;
      word-break: break-word;
      line-height: 1.3;
    }
    img {
      width: 160px;
      height: 160px;
      max-width: 90%;
      display: block;
    }
    .url {
      margin-top: 6pt;
      font-size: 6pt;
      color: #555;
      word-break: break-all;
      text-align: center;
      max-width: 100%;
    }
    @page {
      /* Minimal margins so content is not clipped on narrow thermal/POS paper */
      margin: 3mm;
    }
    @media print {
      body { padding: 0; }
      img {
        /* Physical mm size: fits 58mm roll (52mm printable) and larger */
        width: 44mm;
        height: 44mm;
        max-width: 90%;
      }
      .name { font-size: 8pt; margin-bottom: 3mm; }
      .url  { font-size: 5pt; margin-top: 2mm; }
    }
  </style>
</head>
<body>
  <div class="name">${escapeHtml(productName)}</div>
  <img src="${imageDataUrl}" alt="QR Code" />
  ${resolveUrl ? `<div class="url">${escapeHtml(resolveUrl)}</div>` : ''}
  <script>
    window.onload = function () {
      window.onafterprint = function () { window.close(); };
      window.print();
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}

// For synchronous use (QR data already cached, e.g. Step 5)
export function printQrCode(imageDataUrl: string, productName: string, resolveUrl?: string): void {
  const printWindow = window.open('', '_blank', 'width=320,height=480');
  if (!printWindow) {
    alert('Vui lòng cho phép cửa sổ pop-up để in QR.');
    return;
  }
  writeQrContent(printWindow, imageDataUrl, productName, resolveUrl);
}

// Open the print window synchronously (must be called within a click handler, before any await)
export function openPrintWindow(): Window | null {
  return window.open('', '_blank', 'width=320,height=480');
}

// Write QR content into a pre-opened window (use after async data fetch)
export function fillPrintWindow(
  printWindow: Window,
  imageDataUrl: string,
  productName: string,
  resolveUrl?: string,
): void {
  writeQrContent(printWindow, imageDataUrl, productName, resolveUrl);
}

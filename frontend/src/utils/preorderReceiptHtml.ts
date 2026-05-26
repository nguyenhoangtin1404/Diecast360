import { PREORDER_STATUS_LABELS } from '../constants/preorder';
import type { PreorderReceiptPayload } from '../types/preorderReceipt';
import { formatVndAmountInWords } from './numberToVietnameseWords';
import { formatVndLine } from './formatVnd';

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Whitelist logo_url: chỉ cho phép https: hoặc relative path (bắt đầu bằng /). */
const sanitizeLogoUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed, window.location.href);
    if (parsed.protocol === 'https:') return trimmed;
  } catch {
    // relative URL hoặc URL không hợp lệ
  }
  // Cho phép relative path nội bộ
  if (trimmed.startsWith('/')) return trimmed;
  return null;
};

const formatReceiptDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const lineItem = (label: string, value: string): string =>
  `<div class="line"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`;

const optionalBlock = (html: string): string => (html.trim() ? html : '');

/** Hiển thị số tiền hoặc "—" nếu giá trị chưa xác định (null). */
const formatNullableVnd = (n: number | null | undefined): string =>
  n != null ? formatVndLine(n) : '—';

export type ReceiptRenderMode = 'thermal' | 'share';

export interface BuildReceiptOptions {
  /**
   * Data URL (base64) của logo đã fetch sẵn — dùng cho share/export mode để
   * tránh canvas bị taint do CORS. Nếu không truyền, dùng `shop.logo_url` trực tiếp.
   */
  logoDataUrl?: string;
}

export const buildPreorderReceiptHtml = (
  data: PreorderReceiptPayload,
  mode: ReceiptRenderMode,
  options: BuildReceiptOptions = {},
): string => {
  const { shop, preorder } = data;
  // Giữ nguyên null khi cả total_amount lẫn unit_price đều chưa có — không ép về 0
  const subtotal: number | null =
    preorder.total_amount ??
    (preorder.unit_price != null ? preorder.unit_price * preorder.quantity : null);
  const totalAmount: number | null = subtotal;
  const remaining: number | null =
    preorder.remaining_amount ??
    (totalAmount != null ? Math.max(0, totalAmount - preorder.paid_amount) : null);

  const customerName =
    preorder.member?.full_name?.trim() ||
    preorder.user?.full_name?.trim() ||
    preorder.user?.email?.trim() ||
    '';

  const headerParts: string[] = [];
  // Ưu tiên dùng logoDataUrl (data URL đã fetch — không bị CORS taint khi rasterize);
  // fallback về logo_url gốc kèm crossorigin cho thermal print.
  const resolvedLogoSrc: string | null =
    options.logoDataUrl ?? (shop.logo_url ? sanitizeLogoUrl(shop.logo_url) : null);
  if (resolvedLogoSrc) {
    const corsAttr = options.logoDataUrl ? '' : ' crossorigin="anonymous"';
    headerParts.push(
      `<img class="logo" src="${escapeHtml(resolvedLogoSrc)}" alt=""${corsAttr} />`,
    );
  }
  if (shop.name) {
    headerParts.push(`<div class="shop-name">${escapeHtml(shop.name)}</div>`);
  }
  if (shop.address) {
    headerParts.push(`<div class="shop-meta">${escapeHtml(shop.address)}</div>`);
  }
  const phoneDisplay = shop.phone_label?.trim() || shop.phone_tel?.trim();
  if (phoneDisplay) {
    headerParts.push(`<div class="shop-meta">ĐT: ${escapeHtml(phoneDisplay)}</div>`);
  }

  const customerLines: string[] = [];
  if (customerName) {
    customerLines.push(lineItem('Khách hàng', customerName));
  }
  if (preorder.member?.phone?.trim()) {
    customerLines.push(lineItem('SĐT', preorder.member.phone.trim()));
  }
  if (preorder.member?.address?.trim()) {
    customerLines.push(lineItem('Địa chỉ', preorder.member.address.trim()));
  }

  const cancelledBanner =
    preorder.status === 'CANCELLED'
      ? '<div class="cancelled">ĐÃ HỦY</div>'
      : '';

  const unitPrice: number | null =
    preorder.unit_price ?? (subtotal != null && preorder.quantity > 0 ? subtotal / preorder.quantity : null);
  const lineTotal: number | null = unitPrice != null ? unitPrice * preorder.quantity : null;

  const widthStyle =
    mode === 'thermal'
      ? 'width: 58mm; max-width: 58mm;'
      : 'width: 420px; max-width: 420px;';

  const baseFont = mode === 'thermal' ? '9pt' : '11pt';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>PHIẾU ĐẶT HÀNG</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${baseFont};
      color: #111;
      background: #fff;
      ${widthStyle}
      margin: 0 auto;
      padding: 8px 6px;
    }
    .logo { display: block; max-width: 48mm; max-height: 16mm; margin: 0 auto 4px; object-fit: contain; }
    .shop-name { font-weight: 700; text-align: center; font-size: 1.05em; margin-bottom: 2px; }
    .shop-meta { text-align: center; font-size: 0.9em; line-height: 1.35; }
    .divider { border-top: 1px solid #000; margin: 6px 0; }
    .title { text-align: center; font-weight: 700; font-size: 1.15em; margin: 4px 0; }
    .meta { font-size: 0.9em; margin-bottom: 4px; }
    .meta div { margin: 2px 0; }
    .cancelled {
      text-align: center;
      font-weight: 700;
      color: #b91c1c;
      border: 2px solid #b91c1c;
      padding: 4px;
      margin: 6px 0;
      letter-spacing: 0.05em;
    }
    .line { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; font-size: 0.92em; }
    .label { flex-shrink: 0; }
    .value { text-align: right; word-break: break-word; }
    table.items { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 0.92em; }
    table.items th, table.items td { border: 1px solid #333; padding: 3px 4px; vertical-align: top; }
    table.items th { font-weight: 600; text-align: center; }
    table.items .name { text-align: left; word-break: break-word; }
    table.items .num { text-align: right; white-space: nowrap; }
    .totals { margin-top: 4px; font-size: 0.92em; }
    .totals .line { margin: 3px 0; }
    .totals .strong .value { font-weight: 700; }
    .words { margin-top: 8px; font-size: 0.88em; font-style: italic; text-align: center; line-height: 1.4; }
    @page { margin: 3mm; }
    @media print {
      body { padding: 0; ${mode === 'thermal' ? 'width: 58mm;' : ''} }
      .logo { max-width: 44mm; max-height: 14mm; }
    }
  </style>
</head>
<body>
  ${optionalBlock(headerParts.join(''))}
  <div class="divider"></div>
  <div class="title">PHIẾU ĐẶT HÀNG</div>
  <div class="meta">
    <div>Số: ${escapeHtml(preorder.id)}</div>
    <div>Ngày: ${escapeHtml(formatReceiptDate(preorder.created_at))}</div>
    <div>Trạng thái: ${escapeHtml(PREORDER_STATUS_LABELS[preorder.status])}</div>
  </div>
  ${cancelledBanner}
  ${optionalBlock(customerLines.join(''))}
  <table class="items">
    <thead>
      <tr>
        <th class="name">Sản phẩm</th>
        <th>Đơn giá</th>
        <th>SL</th>
        <th>Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="name">${escapeHtml(preorder.item.name)}</td>
        <td class="num">${escapeHtml(formatNullableVnd(unitPrice))}</td>
        <td class="num">${preorder.quantity}</td>
        <td class="num">${escapeHtml(formatNullableVnd(lineTotal))}</td>
      </tr>
    </tbody>
  </table>
  <div class="totals">
    ${lineItem('Cộng tiền hàng', formatNullableVnd(subtotal))}
    ${preorder.discount_amount != null ? lineItem('Chiết khấu', formatVndLine(preorder.discount_amount)) : ''}
    <div class="line strong"><span class="label">Tổng cộng</span><span class="value">${escapeHtml(formatNullableVnd(totalAmount))}</span></div>
    ${lineItem('Đặt cọc', formatVndLine(preorder.deposit_amount))}
    ${lineItem('Đã thu', formatVndLine(preorder.paid_amount))}
    ${lineItem('Còn lại', formatNullableVnd(remaining))}
  </div>
  <div class="words">${escapeHtml(totalAmount != null ? formatVndAmountInWords(totalAmount) : '')}</div>
</body>
</html>`;
};

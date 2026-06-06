// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPreorderReceiptHtml } from '../../src/utils/preorderReceiptHtml';
import {
  openReceiptPrintPopup,
  printPreorderReceipt,
  RECEIPT_AFTER_PRINT_MSG,
  wrapReceiptHtmlForPopupPrint,
} from '../../src/utils/printPreorderReceipt';
import type { PreorderReceiptPayload } from '../../src/types/preorderReceipt';

const mockData: PreorderReceiptPayload = {
  shop: {
    name: 'Test Shop',
    phone_label: '0901234567',
    address: '123 Đường Test',
  },
  preorder: {
    id: 'po-test-1',
    status: 'WAITING_FOR_GOODS',
    quantity: 1,
    unit_price: 850_000,
    total_amount: 850_000,
    deposit_amount: 200_000,
    paid_amount: 200_000,
    remaining_amount: 650_000,
    discount_amount: null,
    note: null,
    created_at: '2026-06-06T08:00:00.000Z',
    item: { name: 'Mini GT BMW' },
    member: null,
    user: null,
  },
};

describe('buildPreorderReceiptHtml', () => {
  it('sinh @page { size: 58mm 9999mm } cho K57', () => {
    const html = buildPreorderReceiptHtml(mockData, 'thermal', { paperWidth: 'K57' });
    expect(html).toContain('size: 58mm 9999mm');
    expect(html).toContain('width: 58mm');
  });

  it('sinh @page { size: 80mm 9999mm } cho K80', () => {
    const html = buildPreorderReceiptHtml(mockData, 'thermal', { paperWidth: 'K80' });
    expect(html).toContain('size: 80mm 9999mm');
    expect(html).toContain('width: 80mm');
  });

  it('mặc định là 58mm khi không truyền paperWidth', () => {
    const html = buildPreorderReceiptHtml(mockData, 'thermal');
    expect(html).toContain('size: 58mm 9999mm');
  });

  it('share mode không sinh @page size', () => {
    const html = buildPreorderReceiptHtml(mockData, 'share');
    expect(html).not.toContain('@page { size:');
    expect(html).toContain('margin: 3mm');
  });

  it('chứa tên shop và tên sản phẩm', () => {
    const html = buildPreorderReceiptHtml(mockData, 'thermal');
    expect(html).toContain('Test Shop');
    expect(html).toContain('Mini GT BMW');
  });

  it('không hiển thị section khách hàng khi member = null', () => {
    const html = buildPreorderReceiptHtml(mockData, 'thermal');
    expect(html).not.toContain('Khách hàng');
  });

  it('hiển thị thông tin khách khi có member', () => {
    const dataWithMember: PreorderReceiptPayload = {
      ...mockData,
      preorder: {
        ...mockData.preorder,
        member: { id: 'm1', full_name: 'Nguyễn Văn A', phone: '0911111111', address: null },
      },
    };
    const html = buildPreorderReceiptHtml(dataWithMember, 'thermal');
    expect(html).toContain('Khách hàng');
    expect(html).toContain('Nguyễn Văn A');
  });
});

describe('wrapReceiptHtmlForPopupPrint', () => {
  it('gắn script onload + window.print() trước </body>', () => {
    const html = buildPreorderReceiptHtml(mockData, 'thermal');
    const wrapped = wrapReceiptHtmlForPopupPrint(html);
    expect(wrapped).toContain('window.onload = function ()');
    expect(wrapped).toContain('window.print();');
    expect(wrapped).toContain(RECEIPT_AFTER_PRINT_MSG);
    expect(wrapped).not.toEqual(html);
  });

  it('không làm mất nội dung phiếu', () => {
    const html = buildPreorderReceiptHtml(mockData, 'thermal');
    const wrapped = wrapReceiptHtmlForPopupPrint(html);
    expect(wrapped).toContain('PHIẾU ĐẶT HÀNG');
    expect(wrapped).toContain('Mini GT BMW');
  });
});

describe('openReceiptPrintPopup', () => {
  let openMock: ReturnType<typeof vi.fn>;
  let writeMock: ReturnType<typeof vi.fn>;
  let closeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeMock = vi.fn();
    closeMock = vi.fn();
    openMock = vi.fn(() => ({
      document: { write: writeMock, close: closeMock },
      closed: false,
    }));
    vi.stubGlobal('open', openMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ghi HTML có script in vào popup', () => {
    const html = buildPreorderReceiptHtml(mockData, 'thermal');
    const result = openReceiptPrintPopup(html);
    expect(result.ok).toBe(true);
    expect(writeMock).toHaveBeenCalledOnce();
    const written = writeMock.mock.calls[0]?.[0] as string;
    expect(written).toContain('window.print();');
    expect(written).toContain('PHIẾU ĐẶT HÀNG');
    expect(closeMock).toHaveBeenCalledOnce();
  });

  it('trả blocked khi window.open null', () => {
    openMock.mockReturnValue(null);
    const result = openReceiptPrintPopup('<html></html>');
    expect(result).toEqual({ ok: false, reason: 'blocked' });
    expect(writeMock).not.toHaveBeenCalled();
  });
});

describe('printPreorderReceipt', () => {
  let appendSpy: ReturnType<typeof vi.spyOn>;
  let printMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    appendSpy = vi.spyOn(document.body, 'appendChild');
    printMock = vi.fn();
    // jsdom không có contentWindow.print — stub qua prototype
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get() {
        return {
          print: printMock,
          focus: vi.fn(),
          addEventListener: vi.fn(),
          navigator: { webdriver: false },
        };
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('tạo iframe và gắn vào document.body', () => {
    printPreorderReceipt(mockData, 'K57');
    const iframe = appendSpy.mock.calls[0]?.[0] as HTMLIFrameElement;
    expect(iframe).toBeDefined();
    expect(iframe.tagName).toBe('IFRAME');
  });

  it('set srcdoc với HTML chứa @page size 58mm cho K57', () => {
    printPreorderReceipt(mockData, 'K57');
    const iframe = appendSpy.mock.calls[0]?.[0] as HTMLIFrameElement;
    expect(iframe.srcdoc).toContain('size: 58mm 9999mm');
    expect(iframe.srcdoc).toContain('PHIẾU ĐẶT HÀNG');
  });

  it('set srcdoc với HTML chứa @page size 80mm cho K80', () => {
    printPreorderReceipt(mockData, 'K80');
    const iframe = appendSpy.mock.calls[0]?.[0] as HTMLIFrameElement;
    expect(iframe.srcdoc).toContain('size: 80mm 9999mm');
  });

  it('iframe style ẩn khỏi viewport', () => {
    printPreorderReceipt(mockData, 'K57');
    const iframe = appendSpy.mock.calls[0]?.[0] as HTMLIFrameElement;
    expect(iframe.style.position).toBe('fixed');
    expect(iframe.style.visibility).toBe('hidden');
  });
});

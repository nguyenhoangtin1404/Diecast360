# Hướng dẫn tích hợp myPOS Online Payments vào Diecast360

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Cơ chế hoạt động](#2-cơ-chế-hoạt-động)
3. [Đăng ký & lấy credentials](#3-đăng-ký--lấy-credentials)
4. [Môi trường sandbox & test](#4-môi-trường-sandbox--test)
5. [Cài đặt SDK](#5-cài-đặt-sdk)
6. [Cấu trúc module thanh toán (NestJS)](#6-cấu-trúc-module-thanh-toán-nestjs)
7. [Khởi tạo SDK](#7-khởi-tạo-sdk)
8. [Endpoint 1 — Khởi tạo thanh toán](#8-endpoint-1--khởi-tạo-thanh-toán)
9. [Endpoint 2 — Webhook thông báo (notifyUrl)](#9-endpoint-2--webhook-thông-báo-notifyurl)
10. [Endpoint 3 — Redirect sau thanh toán](#10-endpoint-3--redirect-sau-thanh-toán)
11. [Tích hợp với PreOrder state machine](#11-tích-hợp-với-preorder-state-machine)
12. [Biến môi trường](#12-biến-môi-trường)
13. [Bảo mật](#13-bảo-mật)
14. [Các thao tác bổ sung (Refund, Reversal, Status)](#15-các-thao-tác-bổ-sung-refund-reversal-status)
15. [Kế hoạch triển khai từng bước](#16-kế-hoạch-triển-khai-từng-bước)

---

## 1. Tổng quan

**myPOS Web Checkout** là cổng thanh toán theo mô hình **hosted redirect** — khách hàng được chuyển hướng sang trang thanh toán bảo mật do myPOS quản lý, nhập thông tin thẻ tại đó, rồi được chuyển trở lại site của bạn.

Ưu điểm:
- Bạn **không bao giờ chạm vào dữ liệu thẻ** → không cần tuân thủ PCI DSS phức tạp.
- Hỗ trợ VISA, MasterCard, American Express, JCB, UnionPay, Bancontact.
- Có SDK Node.js chính thức (`@mypos-ltd/mypos`).
- Sandbox đầy đủ, không cần thẻ thật để test.

---

## 2. Cơ chế hoạt động

```
[Khách nhấn "Thanh toán"]
        │
        ▼
Backend tạo signed POST form  (dùng RSA private key)
        │
        ▼
Browser redirect → trang hosted payment của myPOS
        │
        ├─[Thanh toán thành công]─────────────────────────────────┐
        │                                                          │
        ▼                                                          ▼
myPOS POST đến notifyUrl (server-side, silent)       Browser redirect → okUrl
        │
        ▼
Backend xác minh chữ ký X-myPOS-Signature
        │
        ▼
Cập nhật trạng thái PreOrder → PAID
Ghi MemberPointsLedger (loyalty points)
Trả về HTTP 200

        ├─[Khách hủy]────────────────────────────────────────────▶ cancelUrl
```

> **Quy tắc quan trọng:** Chỉ tin vào `notifyUrl` (server-to-server) để xác nhận thanh toán.
> Không bao giờ tin vào redirect về `okUrl` vì người dùng có thể giả mạo.

---

## 3. Đăng ký & lấy credentials

### 3.1 Tạo tài khoản merchant

1. Truy cập [https://www.mypos.com](https://www.mypos.com) → đăng ký tài khoản merchant.
2. Vào **Merchant Portal → Online Payments → Create Store**.
3. Điền tên store, URL website, currency.

### 3.2 Tạo RSA key pair

myPOS yêu cầu bạn tự tạo cặp key RSA 2048-bit:

```bash
# Tạo private key
openssl genrsa -out store_private_key.pem 2048

# Tạo public key tương ứng
openssl rsa -in store_private_key.pem -pubout -out store_public_key.pem
```

- **Upload `store_public_key.pem`** lên Merchant Portal (myPOS dùng để verify chữ ký của bạn).
- **Giữ `store_private_key.pem` bí mật** — dùng để ký request từ backend.

### 3.3 Download API public key của myPOS

Sau khi upload public key, tải về **`api_public_key.pem`** từ Merchant Portal.
myPOS dùng key này để ký response, bạn dùng để verify.

### 3.4 Thông tin credentials cần lưu

| Biến | Mô tả |
|---|---|
| `SID` | Store ID — định danh online store của bạn |
| `wallet` | Số tài khoản/wallet myPOS |
| `keyIndex` | Index của private key (thường là `1`) |
| `privateKey` | Nội dung file `store_private_key.pem` |
| `apiPublicKey` | Nội dung file `api_public_key.pem` (của myPOS) |

---

## 4. Môi trường sandbox & test

### 4.1 URL

| Môi trường | Checkout URL |
|---|---|
| **Sandbox** | `https://www.mypos.com/vmp/checkout-test` |
| **Production** | `https://www.mypos.com/vmp/checkout` |

SDK tự động chọn URL dựa theo `isSandbox: true/false`.

### 4.2 Test credentials (sandbox)

Khi test, myPOS cung cấp sẵn credentials mẫu — bạn không cần tài khoản merchant thật.
Lấy tại: [https://developers.mypos.com/online-payments/initial-setup-and-testing/testing-in-sandbox/test-data](https://developers.mypos.com/online-payments/initial-setup-and-testing/testing-in-sandbox/test-data)

### 4.3 Test cards (sandbox)

| Loại thẻ | Số thẻ | CVC | Hạn |
|---|---|---|---|
| VISA | `4010 0000 0000 0018` | Bất kỳ 3 chữ số | Bất kỳ ngày tương lai |
| MasterCard | `5100 0000 0000 0022` | Bất kỳ 3 chữ số | Bất kỳ ngày tương lai |
| VISA Electron | `4917 3000 0000 0008` | Bất kỳ 3 chữ số | Bất kỳ ngày tương lai |
| VPay | `4010 0000 0000 0018` | Bất kỳ 3 chữ số | Bất kỳ ngày tương lai |

### 4.4 Các kịch bản cần test

- Thanh toán thành công (happy path)
- Khách hủy thanh toán giữa chừng
- Thẻ bị từ chối (dùng số thẻ invalid)
- Gửi request thiếu tham số (kiểm tra validation)
- Webhook `notifyUrl` nhận đúng và sai chữ ký

---

## 5. Cài đặt SDK

```bash
# Từ thư mục backend/
pnpm add @mypos-ltd/mypos
```

Package: [@mypos-ltd/mypos](https://www.npmjs.com/package/@mypos-ltd/mypos)
GitHub: [developermypos/mypos-js](https://github.com/developermypos/mypos-js)

---

## 6. Cấu trúc module thanh toán (NestJS)

Tạo module mới tại `backend/src/payments/`:

```
backend/src/payments/
├── payments.module.ts
├── payments.controller.ts
├── payments.service.ts
└── dto/
    └── initiate-payment.dto.ts
```

---

## 7. Khởi tạo SDK

Tạo provider singleton trong `payments.service.ts`:

```typescript
// backend/src/payments/payments.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private readonly mypos: any;

  constructor(private readonly config: ConfigService) {
    this.mypos = require('@mypos-ltd/mypos')({
      isSandbox: this.config.get<string>('MYPOS_SANDBOX') === 'true',
      checkout: {
        sid:                    this.config.getOrThrow('MYPOS_SID'),
        lang:                   'EN',
        currency:               this.config.get('MYPOS_CURRENCY') ?? 'EUR',
        clientNumber:           this.config.getOrThrow('MYPOS_WALLET'),
        okUrl:                  `${this.config.getOrThrow('FRONTEND_URL')}/payment/success`,
        cancelUrl:              `${this.config.getOrThrow('FRONTEND_URL')}/payment/cancel`,
        notifyUrl:              `${this.config.getOrThrow('BACKEND_URL')}/api/v1/payments/notify`,
        cardTokenRequest:       0,
        paymentMethod:          1,
        paymentParametersRequired: 3,
        keyIndex:               Number(this.config.get('MYPOS_KEY_INDEX') ?? 1),
        privateKey:             this.config.getOrThrow('MYPOS_PRIVATE_KEY'),
      },
    });
  }
  // ... methods below
}
```

---

## 8. Endpoint 1 — Khởi tạo thanh toán

**Route:** `POST /api/v1/payments/initiate`

**Mô tả:** Nhận `preorderId`, build signed form, redirect trình duyệt khách đến myPOS.

```typescript
// payments.controller.ts
@Post('initiate')
@UseGuards(JwtAuthGuard)
async initiate(
  @Body() dto: InitiatePaymentDto,
  @Res() res: Response,
  @ActiveShop() shopId: string,
) {
  await this.paymentsService.initiateCheckout(dto.preorderId, shopId, res);
}
```

```typescript
// payments.service.ts
async initiateCheckout(preorderId: string, shopId: string, res: Response) {
  const preorder = await this.prisma.preOrder.findFirst({
    where: { id: preorderId, shop_id: shopId },
    include: { item: true, member: true },
  });

  if (!preorder) throw new AppException(ErrorCode.NOT_FOUND, 'PreOrder not found');
  if (preorder.status !== 'ARRIVED') {
    throw new AppException(ErrorCode.VALIDATION_ERROR, 'Only ARRIVED orders can be paid');
  }

  const purchaseParams = {
    orderId:   preorder.id,
    amount:    Number(preorder.total_amount),
    cartItems: [{
      name:     preorder.item?.name ?? 'Diecast item',
      quantity: preorder.quantity,
      price:    Number(preorder.unit_price),
    }],
    customer: {
      email:       preorder.member?.email ?? '',
      firstNames:  preorder.member?.full_name?.split(' ')[0] ?? '',
      familyName:  preorder.member?.full_name?.split(' ').slice(1).join(' ') ?? '',
    },
    note: `PreOrder #${preorder.id}`,
  };

  // SDK tự render và ghi response redirect vào res
  this.mypos.checkout.purchase(purchaseParams, res);
}
```

---

## 9. Endpoint 2 — Webhook thông báo (notifyUrl)

**Route:** `POST /api/v1/payments/notify`

**Mô tả:** myPOS gọi endpoint này (server-to-server) sau khi thanh toán hoàn tất.
Phải trả về HTTP 200. myPOS sẽ retry nếu nhận được response ngoài 2xx.

> **Lưu ý CSRF:** Endpoint này được gọi bởi server của myPOS (không phải browser), nên phải
> **loại trừ khỏi CSRF guard**. Thêm vào danh sách `csrfExcludedRoutes` trong cấu hình bảo mật.

```typescript
// payments.controller.ts
@Post('notify')
// KHÔNG dùng CsrfGuard ở đây
async handleNotify(@Req() req: Request, @Res() res: Response) {
  try {
    await this.paymentsService.handlePaymentNotification(req.body);
    res.status(200).send('OK');
  } catch (err) {
    // Vẫn trả 200 để myPOS không retry, nhưng log lỗi
    this.logger.error('Payment notify error', err);
    res.status(200).send('OK');
  }
}
```

```typescript
// payments.service.ts
async handlePaymentNotification(payload: Record<string, any>) {
  // 1. Xác minh chữ ký (SDK cung cấp helper, hoặc verify thủ công bằng apiPublicKey)
  const isValid = this.verifySignature(payload);
  if (!isValid) {
    this.logger.warn('Invalid myPOS signature', payload);
    return; // không xử lý
  }

  // 2. Lấy orderId từ payload
  const orderId = payload['IPCorderID'] ?? payload['orderId'];
  if (!orderId) return;

  // 3. Kiểm tra trạng thái thanh toán từ payload
  const ipcStatus = Number(payload['IPCStatus']);
  // ipcStatus === 2 → thành công; khác → thất bại/pending
  if (ipcStatus !== 2) return;

  // 4. Transition PreOrder sang PAID qua service hiện có
  await this.preordersService.transitionStatus(orderId, 'PAID', /* actorUserId = system */ null);
}

private verifySignature(payload: Record<string, any>): boolean {
  // Dùng apiPublicKey để verify SHA-256 hash của các tham số
  // Chi tiết tham khảo: https://developers.mypos.com/en/doc/online_payments/v1_4/182-ipcpurchasenotify
  const crypto = require('crypto');
  const signature = payload['Signature'];
  if (!signature) return false;

  const params = { ...payload };
  delete params['Signature'];

  const dataToVerify = Object.values(params).join('-');
  const verify = crypto.createVerify('SHA256');
  verify.update(dataToVerify);
  return verify.verify(this.config.getOrThrow('MYPOS_API_PUBLIC_KEY'), signature, 'base64');
}
```

### Các tham số quan trọng trong payload notify

| Tham số | Mô tả |
|---|---|
| `IPCorderID` | OrderID bạn đã gửi khi tạo checkout |
| `IPCStatus` | `2` = thành công, khác = thất bại |
| `IPCAmount` | Số tiền đã thanh toán |
| `IPCCurrency` | Currency |
| `TrnRef` | Transaction reference của myPOS (dùng cho refund) |
| `Signature` | Chữ ký RSA, luôn là tham số cuối cùng |

---

## 10. Endpoint 3 — Redirect sau thanh toán

Đây là trang người dùng thấy sau khi quay về từ myPOS.
**Không dùng để xác nhận thanh toán** — chỉ để hiển thị UI.

```typescript
// Frontend routes (React)
// /payment/success → hiển thị "Thanh toán thành công, chờ xác nhận"
// /payment/cancel  → hiển thị "Thanh toán bị hủy"
```

Frontend nên gọi API kiểm tra trạng thái PreOrder để hiển thị trạng thái chính xác,
thay vì tin hoàn toàn vào URL redirect.

---

## 11. Tích hợp với PreOrder state machine

### Luồng hiện tại (manual)

```
ARRIVED → [admin nhấn "Đã thanh toán"] → PAID
```

### Luồng mới (online payment)

```
ARRIVED → [khách/admin nhấn "Thanh toán Online"]
        → myPOS hosted checkout
        → [thành công] → notifyUrl webhook → PAID + MemberPointsLedger
        → [hủy]        → quay về, giữ nguyên ARRIVED
```

Hai luồng **cùng tồn tại**: admin vẫn có thể chuyển PAID thủ công (thanh toán tiền mặt),
hoặc dùng online payment cho khách tự thanh toán.

### Nơi thêm nút "Thanh toán Online"

- `frontend/src/pages/admin/preorders/PreOrderManagementPage.tsx` — nút trên bảng quản lý
- `frontend/src/pages/public/MyOrdersPage.tsx` — nút cho khách hàng tự thanh toán (nếu có tài khoản)

Nút chỉ hiển thị khi `status === 'ARRIVED'`.

---

## 12. Biến môi trường

Thêm vào `backend/.env` và cập nhật `docs/ENV.md`:

```bash
# myPOS Online Payments
MYPOS_SID=                     # Store ID từ merchant portal
MYPOS_WALLET=                  # Số wallet/account myPOS
MYPOS_PRIVATE_KEY=             # Nội dung store_private_key.pem (newline dùng \n)
MYPOS_API_PUBLIC_KEY=          # Nội dung api_public_key.pem của myPOS (newline dùng \n)
MYPOS_KEY_INDEX=1              # Index của private key (mặc định 1)
MYPOS_CURRENCY=EUR             # Currency code (3 chữ cái)
MYPOS_SANDBOX=true             # true = sandbox, false = production

# URL (đã có sẵn, đảm bảo đúng)
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Lưu ý về định dạng PEM key trong .env

Nội dung key nhiều dòng cần escape newline:

```bash
# Cách 1: escape \n
MYPOS_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----

# Cách 2: dùng file path (an toàn hơn)
MYPOS_PRIVATE_KEY_PATH=/run/secrets/store_private_key.pem
```

---

## 13. Bảo mật

### 13.1 Xác minh chữ ký webhook

Luôn verify `X-myPOS-Signature` (hoặc `Signature` trong body) trước khi xử lý bất kỳ thứ gì.
Dùng `apiPublicKey` của myPOS để verify SHA-256 RSA signature.

### 13.2 CSRF exception

Endpoint `POST /api/v1/payments/notify` được gọi bởi server myPOS, không có CSRF cookie.
Phải loại trừ route này khỏi `CsrfGuard` trong `main.ts` hoặc `app.module.ts`.

### 13.3 Không tin vào okUrl

Sau khi browser redirect về `/payment/success`, **gọi API** `GET /api/v1/preorders/:id`
để lấy trạng thái thật từ DB. Đừng hiển thị "Thanh toán thành công" chỉ dựa vào URL.

### 13.4 HTTPS bắt buộc

- `notifyUrl` phải là HTTPS — myPOS sẽ từ chối gọi nếu SSL không hợp lệ.
- `okUrl` và `cancelUrl` cũng nên HTTPS.
- Trong môi trường development/local, dùng `ngrok` hoặc `localtunnel` để expose HTTPS.

### 13.5 Idempotency trên notify

myPOS có thể gọi `notifyUrl` nhiều lần cho cùng một giao dịch (retry).
Service phải xử lý idempotent — kiểm tra trạng thái PreOrder trước khi transition:

```typescript
if (preorder.status === 'PAID') return; // đã xử lý rồi, bỏ qua
```

---

## 14. Lưu `TrnRef` để refund sau này

Khi nhận được notify thành công, lưu `TrnRef` từ payload vào DB (thêm cột `payment_trnref` vào bảng `PreOrder`).
Cần thiết cho các thao tác refund/reversal sau này.

```sql
-- Migration mới
ALTER TABLE "PreOrder" ADD COLUMN "payment_trnref" TEXT;
```

---

## 15. Các thao tác bổ sung (Refund, Reversal, Status)

### Refund (hoàn tiền một phần hoặc toàn bộ)

```typescript
mypos.checkout.refund({
  orderId: uuidv4(),          // orderId MỚI cho giao dịch refund
  amount:  9.99,              // số tiền hoàn
  trnRef:  preorder.payment_trnref, // TrnRef lưu từ notify
}, (result) => {
  console.log(result);
});
```

### Reversal (hủy giao dịch — chỉ được trong cùng ngày)

```typescript
mypos.checkout.reversal({
  trnRef: preorder.payment_trnref,
}, (result) => {
  console.log(result);
});
```

### Kiểm tra trạng thái thanh toán

```typescript
mypos.checkout.getPaymentStatus({
  orderId: preorder.id,
}, (result) => {
  console.log(result);
});
```

---

## 16. Kế hoạch triển khai từng bước

### Bước 1 — Môi trường

- [ ] Lấy sandbox credentials từ myPOS developer portal
- [ ] Tạo RSA key pair, upload public key lên merchant portal, download `api_public_key.pem`
- [ ] Thêm env vars vào `.env` (giá trị sandbox)

### Bước 2 — Backend

- [ ] `pnpm add @mypos-ltd/mypos` trong `backend/`
- [ ] Tạo `backend/src/payments/` module (module, controller, service)
- [ ] Implement `POST /api/v1/payments/initiate` — redirect to myPOS
- [ ] Implement `POST /api/v1/payments/notify` — webhook handler + transition PAID
- [ ] Loại trừ `/payments/notify` khỏi CSRF guard
- [ ] Thêm migration `payment_trnref` vào bảng `PreOrder`
- [ ] Xử lý idempotency trong notify handler

### Bước 3 — Frontend

- [ ] Thêm nút "Thanh toán Online" trên PreOrderManagementPage (hiện khi status = ARRIVED)
- [ ] Tạo `/payment/success` và `/payment/cancel` pages
- [ ] Sau redirect về `success`, gọi API lấy trạng thái PreOrder thật

### Bước 4 — Test

- [ ] Test sandbox với test cards (VISA, MasterCard)
- [ ] Test hủy giữa chừng
- [ ] Test webhook notify với ngrok (vì cần HTTPS)
- [ ] Test idempotency (gọi notify 2 lần cùng orderId)
- [ ] Test chữ ký sai → phải bị reject

### Bước 5 — Production

- [ ] Đổi sang production credentials
- [ ] Set `MYPOS_SANDBOX=false`
- [ ] Đảm bảo `notifyUrl` là HTTPS với cert hợp lệ
- [ ] Verify với giao dịch thật (số tiền nhỏ)

---

## Tài liệu tham khảo

- [myPOS Initial Setup & Testing](https://developers.mypos.com/online-payments/initial-setup-and-testing)
- [myPOS Sandbox Testing](https://developers.mypos.com/online-payments/initial-setup-and-testing/testing-in-sandbox)
- [Test Cards](https://developers.mypos.com/online-payments/initial-setup-and-testing/testing-in-sandbox/test-cards)
- [Test Scenarios](https://developers.mypos.com/online-payments/initial-setup-and-testing/testing-in-sandbox/test-scenarios)
- [IPCPurchase API](https://developers.mypos.com/en/doc/online_payments/v1_4/147-ipcpurchase)
- [IPCPurchaseNotify](https://developers.mypos.com/en/doc/online_payments/v1_4/182-ipcpurchasenotify)
- [myPOS JS SDK (GitHub)](https://github.com/developermypos/mypos-js)
- [@mypos-ltd/mypos (npm)](https://www.npmjs.com/package/@mypos-ltd/mypos)

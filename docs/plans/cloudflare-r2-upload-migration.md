# Kế hoạch: chuyển upload backend từ local disk sang Cloudflare R2

Tài liệu này mô tả kiến trúc hiện tại, đề xuất **GitHub Issues** (copy-paste), và **lộ trình triển khai** để thay `UPLOAD_DIR` + `GET /api/v1/media` bằng lưu trữ tương thích S3 trên [Cloudflare R2](https://developers.cloudflare.com/r2/).

## Kiến trúc hiện tại (tóm tắt)

| Thành phần | Vai trò |
|------------|---------|
| [`IStorageService`](../../backend/src/storage/storage.interface.ts) | Hợp đồng: `saveFile`, `deleteFile`, `moveFile`, `getFileUrl`. |
| [`LocalStorageService`](../../backend/src/storage/local-storage.service.ts) | Ghi buffer vào `UPLOAD_DIR`; `getFileUrl` trả URL đã ký tới API. |
| [`MediaController`](../../backend/src/common/media/media.controller.ts) | `GET /api/v1/media?d=&s=` — xác thực chữ ký, đọc file từ disk, stream ra client. |
| [`signed-media.util`](../../backend/src/common/media/signed-media.util.ts) | HMAC + payload `{ p, exp }` — `p` là đường dẫn tương đối dưới thư mục upload. |

**Nơi gọi storage:** branding shop (`shop-branding/`), spinner (`spinner/`), item images + draft (`images/`, `drafts/`), AI draft controller, v.v. — tất cả đều qua `IStorageService`, nên triển khai provider thứ hai (R2) là điểm mở rộng tự nhiên.

**Lưu ý deploy Pi:** [`BACKEND_PI_CLOUDFLARE.md`](../BACKEND_PI_CLOUDFLARE.md) đề cập tạo `uploads` trên Pi; sau khi chuyển R2, thư mục đó có thể không cần (hoặc chỉ dùng khi `STORAGE_DRIVER=local`).

---

## Chiến lược URL sau khi lên R2 (cần quyết định trong Issue #2)

1. **Presigned GET trực tiếp R2** (khuyến nghị cho băng thông): `getFileUrl` trả URL `https://<account>.r2.cloudflarestorage.com/...` hoặc custom domain, TTL tương đương `MEDIA_URL_TTL_MS`. Client tải thẳng từ R2, không qua Nest.
2. **Giữ `/api/v1/media` làm proxy**: backend stream object từ R2 sau khi verify chữ ký — giữ nguyên hợp đồng URL hiện tại, tăng tải CPU/network Pi/API.
3. **Hybrid**: ảnh public catalog dùng domain public + cache; ảnh nhạy cảm vẫn presigned.

Nên ghi rõ lựa chọn trong Issue và ADR ngắn nếu team có nhiều option.

---

## GitHub Issues (copy-paste)

Dưới đây là các issue độc lập có thể tạo trên GitHub; sắp xếp theo thứ tự phụ thuộc hợp lý.

### Issue 1 — Hạ tầng R2 và biến môi trường

**Title:** `infra: Cloudflare R2 bucket + credentials cho backend upload`

**Body:**

```markdown
## Mục tiêu
Tạo bucket R2, API token (S3-compatible Access Key / Secret), và quyết định public hostname (custom domain hoặc r2.dev).

## Việc cần làm
- [ ] Tạo bucket (vd `diecast360-media`), chọn region gần user nếu có.
- [ ] Bật S3 API, tạo R2 API token với quyền Object Read & Write trên bucket đó.
- [ ] (Tuỳ chọn) Custom domain + SSL trên Cloudflare; cấu hình CORS nếu browser gọi thẳng presigned URL cross-origin.
- [ ] Liệt kê biến env cần thêm (draft): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` (hoặc build từ account id), `R2_PUBLIC_BASE_URL` nếu dùng public URL.

## Acceptance
Có tài liệu ngắn trong repo (ENV hoặc DEPLOYMENT) mô tả cách tạo token và ví dụ `.env` (không commit secret thật).

## Phụ thuộc
Không — issue đầu tiên trong epic.
```

---

### Issue 2 — Triển khai `R2StorageService` + chọn driver

**Title:** `backend: R2StorageService implement IStorageService + STORAGE_DRIVER`

**Body:**

```markdown
## Mục tiêu
Thêm implementation lưu object lên R2 qua AWS SDK v3 (`@aws-sdk/client-s3`), đăng ký qua `STORAGE_DRIVER=local|r2` trong `StorageModule`.

## Việc cần làm
- [ ] Thêm dependency `@aws-sdk/client-s3` (R2 tương thích S3).
- [ ] `R2StorageService`: `PutObject` (saveFile), `DeleteObject` (deleteFile), `CopyObject` + `DeleteObject` (moveFile), `getFileUrl` theo chiến lược đã chọn (presigned GetObject hoặc public base URL + path).
- [ ] `StorageModule`: `useFactory` hoặc dynamic provider theo env.
- [ ] Unit test với client S3 mock (giống pattern `LocalStorageService` spec).

## Acceptance
- `STORAGE_DRIVER=local` không đổi hành vi hiện tại.
- `STORAGE_DRIVER=r2` + env hợp lệ: integration test hoặc script nhỏ xác nhận upload/list/delete (có thể skip trên CI nếu không có secret).

## Phụ thuộc
Issue 1 (credentials và tên bucket rõ ràng).

## Gợi ý code
- `saveFile`: key = `{subfolder}/{filename}` (giữ convention path DB hiện tại).
- Content-Type: set theo extension hoặc từ caller nếu sau này mở rộng interface.
```

---

### Issue 3 — `MediaController` và URL đã lưu trong DB

**Title:** `backend: Điều chỉnh GET /api/v1/media khi dùng R2 (proxy, redirect, hoặc deprecate)`

**Body:**

```markdown
## Bối cảnh
Hôm nay mọi `getFileUrl` trỏ về signed URL của Nest. Với presigned R2, client có thể không cần hit `/media` nữa.

## Việc cần làm
- [ ] Nếu **presigned R2**: cập nhật `getFileUrl` trong `R2StorageService`; quyết định có giữ `/media` cho backward compatibility (URL cũ trong email/cache) hay không.
- [ ] Nếu **proxy**: `MediaController` dùng S3 `GetObject` stream sau `verifySignedMediaParams` (path `p` = object key).
- [ ] TTL / rotate: đồng bộ `MEDIA_URL_TTL_MS` với presigned expiry.

## Acceptance
Tài liệu rõ: URL nào được lưu trong DB (chỉ key tương đối — hiện tại đã vậy) vs URL đầy đủ trả cho client; không gãy `<img src>` trên frontend sau deploy.

## Phụ thuộc
Issue 2.
```

---

### Issue 4 — Migration dữ liệu: sync file local → R2

**Title:** `ops: Script một lần đồng bộ UPLOAD_DIR lên R2 + verify`

**Body:**

```markdown
## Mục tiêu
Shop đang production có disk đầy ảnh; cần copy lên R2 theo đúng key (`images/...`, `spinner/...`, v.v.) khớp cột `file_path` trong DB.

## Việc cần làm
- [ ] Script (Node hoặc `rclone`/`aws s3 sync` trỏ endpoint R2) đọy recursive từ `UPLOAD_DIR`, upload với key = relative path.
- [ ] Dry-run + báo cáo số file / tổng dung lượng.
- [ ] Checklist: backup disk, chạy sync, bật `STORAGE_DRIVER=r2`, smoke test upload mới + đọc ảnh cũ.

## Acceptance
Runbook ngắn trong `docs/DEPLOYMENT.md` hoặc file riêng `docs/plans/r2-cutover-runbook.md`.

## Phụ thuộc
Issue 1, 2.
```

---

### Issue 5 — CI, dev local, và Pi deploy

**Title:** `ci+deploy: R2 trong dev/CI; cập nhật playbook Pi (không cần uploads persistent)`

**Body:**

```markdown
## Mục tiêu
- Dev: có thể dùng local hoặc bucket dev riêng.
- CI: không leak secret; test unit dùng mock.

## Việc cần làm
- [ ] `.env.example` / `ENV.md`: mô tả `STORAGE_DRIVER`, biến R2.
- [ ] GitHub Actions: không bắt buộc R2 cho unit test; optional workflow secret cho integration.
- [ ] Cập nhật `BACKEND_PI_CLOUDFLARE.md`: bỏ hoặc làm tuỳ chọn bước `mkdir uploads` khi chỉ dùng R2.

## Phụ thuộc
Issue 2, 4 (sau cutover).
```

---

### Issue 6 — Bảo mật và chi phí

**Title:** `security: R2 bucket policy, lifecycle, và giới hạn presigned`

**Body:**

```markdown
## Mục tiêu
Bucket không public write; token chỉ dùng cho app; có lifecycle rule nếu cần (vd xoá draft cũ — có thể giai đoạn sau).

## Việc cần làm
- [ ] Bucket policy: deny public list; chỉ presigned hoặc Cloudflare Access nếu dùng custom domain nội bộ.
- [ ] Rotate R2 keys trong runbook.
- [ ] Ước lượng egress (R2 không tính egress tới Internet qua CF nhưng vẫn nên hiểu pricing).

## Phụ thuộc
Issue 1.
```

---

## Lộ trình tổng thể (plan)

| Giai đoạn | Nội dung | Issues |
|-----------|----------|--------|
| **0 — Discovery** | Chốt chiến lược URL (presigned vs proxy), TTL, custom domain. | #1, #6 |
| **1 — Core** | `R2StorageService` + `STORAGE_DRIVER`, test mock S3. | #2 |
| **2 — Serving** | `getFileUrl` + `MediaController` / backward compat. | #3 |
| **3 — Cutover** | Sync disk → R2, verify DB paths, đổi env production, monitor. | #4 |
| **4 — Hardening** | Docs deploy, Pi playbook, CI/env. | #5 |

## Rủi ro cần theo dõi

- **URL trong cache/CDN:** Presigned hết hạn → client cần refetch từ API (đã có pattern TTL với media signing).
- **moveFile trên R2:** Không có rename atomic giống `fs.rename`; dùng copy+delete và xử lý lỗi giữa hai bước (tương tự fallback copy+unlink hiện tại).
- **Đường dẫn DB:** Giữ nguyên relative path làm object key để không cần migration schema.

## Kiểm thử tối thiểu trước khi coi là xong

- Upload branding, upload frame spinner, publish item từ draft (đường `moveFile`), xoá/replace asset.
- `GET` ảnh từ URL trả về API (browser và curl).
- Rollback: tắt R2, bật lại local (chỉ khi còn bản copy disk).

---

*Tài liệu kế hoạch; triển khai code theo các issue trên.*

# Backend scripts

Các script TypeScript trong thư mục này chạy bằng `ts-node` hoặc qua `package.json` của `backend/`. Không commit secret.

## Đồng bộ upload local → Cloudflare R2 (cutover)

Khi chuyển `STORAGE_DRIVER=r2`, object trên R2 phải dùng **cùng key** với đường dẫn tương đối trong DB (`images/...`, `spinner/...`, …).

**Khuyến nghị:** dùng [rclone](https://rclone.org/) `sync` từ thư mục `UPLOAD_DIR` lên bucket — xem phần **Cutover runbook** trong [`docs/plans/cloudflare-r2-upload-migration.md`](../../docs/plans/cloudflare-r2-upload-migration.md).

**Gợi ý Node (outline, không bắt buộc):** có thể thêm script sau này dùng `@aws-sdk/client-s3` `ListObjectsV2` + đọc file local + `PutObject` theo từng key; trên dataset lớn ưu tiên `rclone` vì resume/checksum tích hợp.

Các script khác (`create-admin`, `index-items`, …) xem từng file hoặc `package.json` scripts.

# Runbook — Suspected production data loss

**Use this runbook when:** files dưới `UPLOAD_DIR` (hoặc data dir khác) trên production server bị nghi xoá nhầm. Áp dụng cho Pi self-hosted + ext4. Cloud storage (R2) có path recovery riêng — xem section *Cloud storage recovery* phía cuối.

> **Quy tắc số 1:** Dừng mọi process ghi đĩa **TRƯỚC KHI** điều tra. Mỗi giây app tiếp tục chạy là tăng xác suất ghi đè inode đã giải phóng → giảm khả năng recover của `extundelete`/`testdisk`.

## Step 1 — STOP everything that writes

```bash
sudo systemctl stop diecast360-api          # ngừng backend
sudo systemctl stop diecast360-deploy.timer 2>/dev/null || true  # nếu có cron deploy
# Tạm tắt cron user nếu có job ghi /opt hoặc /var/lib:
sudo systemctl stop cron                    # cân nhắc — chỉ khi cần
```

Đảm bảo không có job CI nào đang/sắp chạy:

```bash
# Trên máy dev:
gh run list --workflow=deploy-backend.yml --limit 5
# Nếu có run đang queue: cancel
gh run cancel <run-id>
```

Tạm thời disable workflow để không tự deploy lại trong lúc điều tra:

```bash
gh workflow disable "Deploy backend (Pi)"
```

## Step 2 — Đánh giá phạm vi

Trên Pi:

```bash
# UPLOAD_DIR đang là gì?
grep -E '^UPLOAD_DIR=' /opt/diecast360-backend/.env

# Còn lại gì trong UPLOAD_DIR?
UD=$(grep -E '^UPLOAD_DIR=' /opt/diecast360-backend/.env | sed 's/^UPLOAD_DIR=//; s/^"//; s/"$//')
ls -la "$UD" 2>/dev/null
find "$UD" -type f | wc -l

# Disk usage thay đổi đột ngột?
df -h /opt /var/lib
```

Từ DB (chạy trên máy dev với `DIRECT_URL`):

```sql
-- Tổng số file kỳ vọng:
SELECT
  (SELECT COUNT(*) FROM item_images)                AS item_images_expected,
  (SELECT COUNT(*) FROM spin_frames)                AS spin_frames_expected,
  (SELECT COUNT(*) FILTER (WHERE logo_url    IS NOT NULL) FROM shops) AS shop_logos,
  (SELECT COUNT(*) FILTER (WHERE favicon_url IS NOT NULL) FROM shops) AS shop_favicons;

-- File paths để verify từng cái:
SELECT file_path FROM item_images WHERE created_at > NOW() - INTERVAL '7 days';
```

Đối chiếu số file thực tế trên đĩa với số kỳ vọng.

## Step 3 — Kiểm tra backup trước khi cố ext4 recovery

Backup là cách phục hồi rẻ nhất + chắc chắn nhất. Xem [`backup.md`](backup.md) cho chiến lược chuẩn.

```bash
# Restic (nếu đã setup theo backup.md):
restic -r <repo> snapshots
restic -r <repo> ls latest | head -20
# Thử restore vào /tmp trước, KHÔNG ghi đè production trực tiếp:
restic -r <repo> restore latest --target /tmp/restore-test --include /var/lib/diecast360/uploads
```

```bash
# Rclone (nếu sync R2):
rclone ls r2remote:diecast360-uploads/ | head
rclone sync r2remote:diecast360-uploads /tmp/restore-test --dry-run
```

```bash
# USB backup:
sudo mount /dev/sda1 /mnt/usb
ls /mnt/usb/diecast360-backup/
```

Nếu **có backup khả dụng** → bỏ qua Step 4, đi thẳng Step 5 (restore).

## Step 4 — ext4 recovery (last resort)

Dùng khi không có backup. Hiệu quả giảm theo thời gian và lượng ghi đĩa kể từ lúc xoá.

### Chuẩn bị

```bash
sudo apt-get update
sudo apt-get install -y extundelete testdisk

# Xác định device chứa UPLOAD_DIR:
df "$UD"
# Giả sử trả ra /dev/mmcblk0p2

# CẢNH BÁO: nếu UPLOAD_DIR cùng partition với /opt artifact + log + cache,
# mỗi runtime activity đè inode. Càng dừng nhanh ở Step 1 càng tốt.
```

### Phương án A: `extundelete` (target restore)

```bash
DEV=/dev/mmcblk0p2          # điều chỉnh
WORK=/tmp/recover           # KHÔNG đặt cùng partition đang recover
mkdir -p "$WORK" && cd "$WORK"

# Thử restore theo path tương đối từ mount point của partition:
sudo extundelete --restore-directory /var/lib/diecast360/uploads "$DEV"
# Hoặc cho legacy layout:
sudo extundelete --restore-directory /opt/diecast360-backend/uploads "$DEV"

ls -la RECOVERED_FILES/
```

### Phương án B: `testdisk` (interactive)

```bash
sudo testdisk "$DEV"
# Menu: [No Log] -> chọn partition -> [Advanced] -> [Undelete]
# Đánh dấu file (a = all) -> [c] copy ra ngoài partition này.
```

### Phương án C: imaging trước khi recover (paranoid)

Nếu data quan trọng, image partition ra ổ ngoài trước khi cào:

```bash
# Mount USB hoặc network share:
sudo dd if="$DEV" of=/mnt/external/pi-image.img bs=4M status=progress
# Sau đó chạy extundelete/testdisk trên file image, không phải device thật.
```

## Step 5 — Verify + đặt file về đúng vị trí

```bash
# Đối chiếu file recover được vs DB:
psql "$DATABASE_URL" -t -c "SELECT file_path FROM item_images" > /tmp/db-paths.txt
cd /tmp/recover/RECOVERED_FILES
ls -1 > /tmp/disk-paths.txt
# So sánh:
comm -23 <(sort /tmp/db-paths.txt) <(sort /tmp/disk-paths.txt) > /tmp/still-missing.txt
wc -l /tmp/still-missing.txt
```

Đặt lại file dưới `UPLOAD_DIR` đúng cấu trúc key (tham chiếu `file_path` trong DB):

```bash
sudo rsync -a --owner --group /tmp/recover/RECOVERED_FILES/ "$UD/"
sudo chown -R pi:pi "$UD"           # hoặc user systemd đang dùng
sudo find "$UD" -type d -exec chmod 755 {} \;
sudo find "$UD" -type f -exec chmod 644 {} \;
```

## Step 6 — Restart + smoke test

```bash
gh workflow enable "Deploy backend (Pi)"    # bật lại workflow
sudo systemctl start diecast360-api
sudo systemctl status diecast360-api
curl -sfS http://127.0.0.1:3000/api/v1/health

# Lấy 1 signed media URL từ public API (qua frontend hoặc tự sign):
# Kỳ vọng 200 + Content-Type: image/...
curl -sI 'https://api.nhtin.name.vn/api/v1/media?d=...&s=...'
```

Mở browser → trang public → check ảnh hiển thị bình thường.

## Step 7 — Files vẫn không có sau recovery

Với file không recover được, chấp nhận và tái upload:

1. Query DB lấy `file_path` còn thiếu.
2. Ưu tiên theo doanh thu: item bán chạy, pre-order đang mở (status `PENDING_CONFIRMATION` / `WAITING_FOR_GOODS` / `ARRIVED`) → tái chụp trước.
3. Khi upload, **dùng cùng key** (`file_path` cũ) nếu admin UI có cơ chế "upload to specific path" — nếu không, set new path + update DB. Coordinate với schema để không phá unique constraints (`(spin_set_id, frame_index)`).
4. Spinner sets: ưu tiên set có nhiều view (nếu có analytics) — vì 24–48 frame/spinner rất tốn công.

## Cloud storage recovery (R2)

Nếu production dùng `STORAGE_DRIVER=r2`:

```bash
# R2 có bucket-level versioning nếu enabled trước đó:
aws s3api list-object-versions \
  --bucket "$R2_BUCKET" \
  --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
  --query 'Versions[?IsLatest!=`true`].[Key,VersionId,LastModified]'

# Restore object version cụ thể:
aws s3api copy-object \
  --copy-source "$R2_BUCKET/<key>?versionId=<ver>" \
  --bucket "$R2_BUCKET" \
  --key "<key>" \
  --endpoint-url "..."
```

Nếu versioning chưa bật từ trước → tương đương "đã xoá vĩnh viễn" trên R2. Chỉ còn cách phục hồi từ backup ngoài (xem [`backup.md`](backup.md)).

## Post-incident

1. Viết postmortem trong `docs/POSTMORTEMS/YYYY-MM-DD-<slug>.md` (template: copy file `2026-05-26-uploads-wiped.md`).
2. Cập nhật action items vào tracking issue.
3. Verify rằng action item "backup tự động + test restore" đã chạy thành công.
4. Cập nhật invariants trong `CLAUDE.md` / `AGENTS.md` nếu rút được pattern mới.

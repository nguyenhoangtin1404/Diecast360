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

Lưu ý: tránh ghi đĩa đáng kể vào partition đang điều tra ở bước này. Các lệnh dưới đây là **read-only** đối với `UPLOAD_DIR` (ls/find/df) — an toàn.

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

Từ DB (chạy **trên máy dev** với `DIRECT_URL`, không trên Pi):

```sql
-- Tổng số file kỳ vọng. Shop branding (logo/favicon) lưu trong
-- shops.appearance_json (Json), không phải column riêng — xem schema.prisma.
SELECT
  (SELECT COUNT(*) FROM item_images)                                          AS item_images_expected,
  (SELECT COUNT(*) FROM spin_frames)                                          AS spin_frames_expected,
  (SELECT COUNT(*) FROM shops
     WHERE appearance_json ? 'logo_url'    AND appearance_json ->> 'logo_url'    <> '') AS shop_logos,
  (SELECT COUNT(*) FROM shops
     WHERE appearance_json ? 'favicon_url' AND appearance_json ->> 'favicon_url' <> '') AS shop_favicons;

-- File paths để verify từng cái:
SELECT file_path FROM item_images;
SELECT file_path FROM spin_frames;
-- Branding paths (URL signed — extract relative key bằng app code hoặc parse thủ công):
SELECT id, appearance_json ->> 'logo_url'    AS logo_url,
           appearance_json ->> 'favicon_url' AS favicon_url
FROM shops
WHERE appearance_json ? 'logo_url' OR appearance_json ? 'favicon_url';
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

> **Hai ràng buộc bắt buộc trước khi recover:**
> 1. **Không ghi vào partition chứa `UPLOAD_DIR`.** `apt-get install`, tạo `WORK=/tmp/...` trên cùng partition, hoặc bất kỳ ghi nào (kể cả pacman / npm cache / log) đều có thể overwrite inode chưa bị reclaim → phá cơ hội recover.
> 2. **`extundelete` chỉ hoạt động đúng trên partition đã `umount`.** Chạy trên partition còn mounted (đặc biệt root) sẽ làm metadata thay đổi giữa chừng → recovery dở dang.
>
> Vì root filesystem của Pi gần như luôn mounted khi đang chạy, **không recover in-place**. Dùng một trong hai cách dưới đây:

### Cách A — Image partition ra ổ ngoài, recover trên máy khác (khuyến nghị)

An toàn nhất cho Pi: tắt Pi, rút SD/SSD, làm trên máy desktop/laptop có ổ trống.

**Trên máy desktop/laptop có tooling sẵn:**

```bash
# 1. Cài tooling TRƯỚC khi đụng tới SD/SSD của Pi (ghi đĩa local của desktop, không phải Pi):
sudo apt-get update
sudo apt-get install -y extundelete testdisk e2fsprogs

# 2. Cắm SD/SSD của Pi vào reader. Xác định device (ví dụ /dev/sdb):
lsblk
# Giả sử partition cần là /dev/sdb2 (root) — KHÔNG mount.

DEV=/dev/sdb2
EXT_DISK=/mnt/external        # ổ ngoài KHÁC SD/SSD của Pi, đủ chỗ chứa image
mkdir -p "$EXT_DISK"

# 3. Image partition ra ổ ngoài (chỉ đọc từ Pi disk, ghi vào ổ ngoài):
sudo dd if="$DEV" of="$EXT_DISK/pi-image.img" bs=4M status=progress conv=noerror,sync

# 4. (Tuỳ chọn) Mount image read-only để inspect:
sudo mkdir -p /mnt/pi-ro
sudo mount -o loop,ro "$EXT_DISK/pi-image.img" /mnt/pi-ro
sudo umount /mnt/pi-ro

# 5. Recover từ image (KHÔNG đụng tới SD/SSD gốc nữa — image là "snapshot"):
WORK="$EXT_DISK/recover"
mkdir -p "$WORK" && cd "$WORK"
sudo extundelete --restore-directory var/lib/diecast360/uploads "$EXT_DISK/pi-image.img"
# Hoặc legacy layout (path tương đối từ root partition):
sudo extundelete --restore-directory opt/diecast360-backend/uploads "$EXT_DISK/pi-image.img"

ls -la RECOVERED_FILES/
```

Nếu lần đầu thất bại, có thể chạy lại với option khác hoặc `testdisk` mà không sợ làm hỏng image — image là bản copy.

### Cách B — Boot Pi bằng rescue media, recover device chưa mount

Nếu không có máy desktop tiện hoặc ổ Pi gắn trong (không tháo được):

1. Chuẩn bị 1 SD/USB live chứa Raspberry Pi OS hoặc Debian ARM rescue, có sẵn `extundelete` + `testdisk` (cài trước khi boot vào Pi).
2. Tắt Pi, swap sang SD/USB rescue.
3. Boot Pi từ rescue media. KHÔNG mount root partition của ổ gốc.
4. Cắm thêm ổ ngoài (USB) đủ chỗ cho `RECOVERED_FILES`.
5. Chạy:
   ```bash
   DEV=/dev/mmcblk0p2          # partition gốc của Pi (chưa mount)
   EXT_DISK=/media/usb-recover
   mkdir -p "$EXT_DISK/recover" && cd "$EXT_DISK/recover"

   # Verify DEV chưa mount:
   mount | grep "$DEV" && { echo "DEV đang mount — abort"; exit 1; }

   sudo extundelete --restore-directory var/lib/diecast360/uploads "$DEV"
   ```
6. Copy `RECOVERED_FILES/` ra ổ ngoài rồi shutdown rescue.

### Phương án phụ — `testdisk` (interactive)

`testdisk` hoạt động tốt cả trên image lẫn device unmounted, có UI menu dễ dùng cho operator chưa quen CLI `extundelete`:

```bash
# Trên máy desktop với image:
sudo testdisk "$EXT_DISK/pi-image.img"
# Hoặc rescue mode với device chưa mount:
sudo testdisk "$DEV"
# Menu: [No Log] -> chọn partition -> [Advanced] -> [Undelete]
# Đánh dấu file (a = all) -> [c] copy ra ngoài (chọn đường dẫn trên $EXT_DISK).
```

**Cấm tuyệt đối:**
- Chạy `extundelete`/`testdisk` trực tiếp trên Pi đang chạy với root partition còn mount.
- Ghi `RECOVERED_FILES/` xuống chính ổ đang recover (lặp lại lỗi gây mất data).
- `apt-get install` / `npm install` / tạo thư mục mới trên root partition của Pi sau khi phát hiện data loss.

## Step 5 — Verify + đặt file về đúng vị trí

```bash
# Đối chiếu file recover được vs DB.
# Chạy verify trên MÁY DESKTOP (nơi đang giữ RECOVERED_FILES/), không trên Pi.
RECDIR="$EXT_DISK/recover/RECOVERED_FILES"

# 1. Lấy danh sách file_path từ DB:
psql "$DATABASE_URL" -At -c \
  "SELECT file_path FROM item_images UNION ALL SELECT file_path FROM spin_frames" \
  | sort -u > /tmp/db-paths.txt

# 2. Liệt kê file recover được — DÙNG `find`, không `ls -1`, vì file nằm dưới subfolder
#    (images/, spinner/, shop-branding/, drafts/). `ls -1` chỉ hiện top-level → false miss.
( cd "$RECDIR" && find . -type f -printf '%P\n' | sort -u ) > /tmp/disk-paths.txt

# 3. So sánh — path trong DB nhưng KHÔNG có trên đĩa = vẫn mất:
comm -23 /tmp/db-paths.txt /tmp/disk-paths.txt > /tmp/still-missing.txt
echo "Vẫn mất: $(wc -l < /tmp/still-missing.txt) file"
head /tmp/still-missing.txt
```

Đặt lại file dưới `UPLOAD_DIR` đúng cấu trúc key (tham chiếu `file_path` trong DB). Có 2 ngữ cảnh:

```bash
# A. Nếu bạn đã rebuild Pi và mount lại SD/SSD bình thường:
#    Copy từ ổ desktop trở lại Pi qua scp/rsync over SSH:
rsync -av --owner --group "$RECDIR"/ "pi@<pi-host>:$UD/"
ssh "pi@<pi-host>" "sudo chown -R pi:pi $UD && \
  sudo find $UD -type d -exec chmod 755 {} \\; && \
  sudo find $UD -type f -exec chmod 644 {} \\;"

# B. Nếu bạn đã gắn lại SD/SSD vào Pi và boot lên rồi (`UPLOAD_DIR` mount sẵn),
#    có thể copy local từ ổ ngoài USB cắm trên Pi:
sudo rsync -a --owner --group /media/usb-recover/recover/RECOVERED_FILES/ "$UD/"
sudo chown -R pi:pi "$UD"
sudo find "$UD" -type d -exec chmod 755 {} \;
sudo find "$UD" -type f -exec chmod 644 {} \;
```

## Step 6 — Restart + smoke test

> **Đừng quên** bật lại các service đã tắt ở Step 1, đặc biệt `cron` (nếu tắt) — nếu không bật lại thì backup nightly sẽ im lặng không chạy → mở ra window cho data loss kế tiếp.

```bash
# Bật lại các service đã tắt ở Step 1:
sudo systemctl start cron                          # nếu Step 1 đã stop
sudo systemctl status cron                         # verify active
sudo systemctl start diecast360-deploy.timer 2>/dev/null || true
gh workflow enable "Deploy backend (Pi)"           # nếu Step 1 đã disable workflow

# Khởi động app:
sudo systemctl start diecast360-api
sudo systemctl status diecast360-api
curl -sfS http://127.0.0.1:3000/api/v1/health

# Verify backup cron sẽ chạy đúng lịch (kiểm trước khi rời tay):
sudo crontab -l -u pi | grep restic
sudo systemctl list-timers --all | grep -E 'cron|diecast'

# Lấy 1 signed media URL từ public API (qua frontend hoặc tự sign):
# Kỳ vọng 200 + Content-Type: image/...
curl -sI 'https://api.nhtin.name.vn/api/v1/media?d=...&s=...'
```

Mở browser → trang public → check ảnh hiển thị bình thường.

Trước khi đóng incident, theo dõi 1 chu kỳ backup (24h) → confirm snapshot mới xuất hiện (`restic snapshots`).

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

# Runbook — Backup strategy & setup

**Mục tiêu:** không bao giờ mất quá 24h dữ liệu user-uploaded; có thể restore trong 4h.

## RPO / RTO

| Loại data | Nguồn | RPO | RTO | Backup destination |
|---|---|---|---|---|
| User uploads (`UPLOAD_DIR`) | Pi local disk hoặc R2 | 24h | 4h | USB external + offsite (R2 hoặc Backblaze B2) |
| Postgres (Neon) | Managed by Neon | Per Neon plan | Per Neon plan | Neon snapshots + optional `pg_dump` offsite |
| `.env` production | Pi `/opt/diecast360-backend/.env` | Mỗi lần thay đổi | <1h | 1Password / Bitwarden (encrypted) |
| Git repo | GitHub | Real-time | Real-time | GitHub clone |

Tài liệu này tập trung vào **`UPLOAD_DIR`** — phần lớn nhất, dễ mất nhất, và mất rồi không tái tạo được từ code.

## Strategy: 3-2-1

- **3 bản sao**: bản gốc trên Pi + USB external trên Pi + offsite (R2/B2).
- **2 phương tiện khác nhau**: ổ Pi (SD/SSD) + USB drive.
- **1 offsite**: object storage cloud.

## Tool choice

| Tool | Khi dùng | Pros | Cons |
|---|---|---|---|
| `restic` | **Khuyến nghị** | Encrypted, dedup, incremental, snapshot rollback, hỗ trợ S3/B2/SFTP | Cần học cú pháp |
| `rclone sync` | Mirror đơn giản tới R2/B2 | Quen thuộc, không state | Không versioning, nếu source bị xoá thì destination cũng |
| `borgbackup` | Tương đương `restic`, mạnh | Encrypted, dedup, snapshot | Local-first; remote qua SSH |
| `rsync --link-dest` | Hardlink-based snapshots local | Đơn giản, không cần install | Phức tạp khi nhiều snapshot |

→ Doc này dùng **`restic`** làm reference. Adapt cho tool khác tương tự.

## Setup (Pi + R2 + USB)

### 1. Cài restic

```bash
sudo apt-get update
sudo apt-get install -y restic
restic version
```

### 2. Chuẩn bị credentials cho R2

Tạo file `~/.restic.env` (chỉ user pi đọc được):

```bash
sudo -u pi tee /home/pi/.restic.env > /dev/null <<'EOF'
# R2 access (tạo trong Cloudflare R2 console — Object Read & Write)
export AWS_ACCESS_KEY_ID="<R2_ACCESS_KEY_ID>"
export AWS_SECRET_ACCESS_KEY="<R2_SECRET_ACCESS_KEY>"
export RESTIC_REPOSITORY="s3:https://<account-id>.r2.cloudflarestorage.com/<bucket-backup>"
# Password >= 32 char, sinh random + lưu vào password manager
export RESTIC_PASSWORD="<long-random-passphrase>"
EOF
sudo chown pi:pi /home/pi/.restic.env
sudo chmod 600 /home/pi/.restic.env
```

> ⚠️ Bucket backup phải **khác** bucket media production (`R2_BUCKET`). Nếu chung bucket, một bug xoá media có thể đi qua restic và mất luôn snapshot.

### 3. Init repository

```bash
source /home/pi/.restic.env
restic init
```

### 4. First backup

```bash
restic backup /var/lib/diecast360/uploads --tag uploads --tag pi
# Hoặc nếu UPLOAD_DIR vẫn ở legacy path:
restic backup /opt/diecast360-backend/uploads --tag uploads --tag pi
```

Kiểm tra:

```bash
restic snapshots
restic stats latest
```

### 5. USB backup (offline copy)

Mount USB tại `/mnt/usb-backup`, init repo riêng:

```bash
sudo mkdir -p /mnt/usb-backup
sudo mount /dev/sda1 /mnt/usb-backup
sudo chown pi:pi /mnt/usb-backup

# Repo USB:
RESTIC_REPOSITORY=/mnt/usb-backup/diecast360-restic \
RESTIC_PASSWORD="<password>" \
restic init

# Backup vào USB (giữ env riêng):
RESTIC_REPOSITORY=/mnt/usb-backup/diecast360-restic \
RESTIC_PASSWORD="<password>" \
restic backup /var/lib/diecast360/uploads --tag uploads --tag usb
```

### 6. Cron job (nightly)

`/etc/cron.d/diecast360-backup`:

```cron
# Backup uploads tới R2 mỗi 03:00, USB mỗi 04:00.
# Pi user. STDOUT/STDERR đi vào journal.

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

0 3 * * * pi source /home/pi/.restic.env && restic backup /var/lib/diecast360/uploads --tag uploads --tag pi --quiet && restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune --quiet | logger -t restic-r2

0 4 * * * pi RESTIC_REPOSITORY=/mnt/usb-backup/diecast360-restic RESTIC_PASSWORD_FILE=/home/pi/.restic-usb-password restic backup /var/lib/diecast360/uploads --tag uploads --tag usb --quiet && RESTIC_REPOSITORY=/mnt/usb-backup/diecast360-restic RESTIC_PASSWORD_FILE=/home/pi/.restic-usb-password restic forget --keep-daily 14 --prune --quiet | logger -t restic-usb
```

Retention example: 7 ngày + 4 tuần + 12 tháng trên R2; 14 ngày trên USB.

### 7. Alert nếu backup không chạy >24h

Đơn giản nhất: cron health-check + send Telegram khi snapshot cuối >24h.

`/usr/local/bin/check-backup.sh`:

```bash
#!/bin/bash
set -euo pipefail
source /home/pi/.restic.env

LAST=$(restic snapshots --tag uploads --tag pi --json | jq -r 'max_by(.time).time' | xargs -I{} date -d {} +%s)
NOW=$(date +%s)
AGE=$(( (NOW - LAST) / 3600 ))

if [ "$AGE" -gt 26 ]; then
  curl -sfS -X POST "https://api.telegram.org/bot$TG_TOKEN/sendMessage" \
    -d "chat_id=$TG_CHAT_ID" \
    -d "text=⚠️ Diecast360 backup STALE — last snapshot ${AGE}h ago"
fi
```

Cron: `0 8 * * * pi /usr/local/bin/check-backup.sh`. Alert vào Telegram/email.

Alternative: dùng [`healthchecks.io`](https://healthchecks.io) — backup cron `&&` curl ping URL, nếu URL không được ping trong N giờ thì service tự alert.

## Test restore (quarterly checklist)

> **Backup chưa restore thành công không phải backup.** Cài calendar reminder hằng quý (3 tháng/lần).

```bash
# 1. Restore vào /tmp (KHÔNG đụng production):
source /home/pi/.restic.env
restic restore latest --target /tmp/restore-test --include /var/lib/diecast360/uploads

# 2. Verify file count + size:
SRC_COUNT=$(find /var/lib/diecast360/uploads -type f | wc -l)
DST_COUNT=$(find /tmp/restore-test/var/lib/diecast360/uploads -type f | wc -l)
echo "Source: $SRC_COUNT, Restored: $DST_COUNT"

# 3. Random sample diff:
for f in $(find /var/lib/diecast360/uploads -type f | shuf -n 5); do
  rel="${f#/var/lib/diecast360/uploads/}"
  diff "$f" "/tmp/restore-test/var/lib/diecast360/uploads/$rel" && echo "OK: $rel" || echo "FAIL: $rel"
done

# 4. Cleanup test dir:
rm -rf /tmp/restore-test
```

Cũng test restore từ **USB** ít nhất 1 lần/quý — đảm bảo ổ chưa hỏng.

Log kết quả vào `docs/RUNBOOKS/backup-test-log.md` (append-only).

## Recovery — point-in-time

Trong sự cố:

```bash
source /home/pi/.restic.env
restic snapshots --tag uploads          # list snapshots
restic restore <snapshot-id> --target / # restore in-place

# Hoặc restore subset:
restic restore <snapshot-id> --target /tmp/recover \
  --include "/var/lib/diecast360/uploads/shop-branding"
sudo rsync -a /tmp/recover/var/lib/diecast360/uploads/ /var/lib/diecast360/uploads/
```

Xem `data-loss-incident.md` cho full incident workflow.

## What NOT to back up

- `node_modules/` — regenerate được, tốn dung lượng.
- `dist/` — build từ source.
- `*.log` files — quay lại qua journalctl/observability.
- `.env` — backup riêng vào password manager (chứa secrets, mã hoá bằng OS-level keychain hoặc Bitwarden file attachment).
- DB Postgres — Neon đã có managed snapshots. Nếu cần offsite, schedule `pg_dump` riêng vào restic repo khác.

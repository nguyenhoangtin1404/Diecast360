# Triển khai production (tóm tắt kiến trúc)

Tài liệu mô tả phương án: **frontend tĩnh** (Vercel hoặc host miễn phí tương đương), **backend NestJS** trên **Raspberry Pi 4 (2 GB)** không có IP tĩnh, **PostgreSQL trên Neon** (free tier). Checklist chi tiết và thảo luận: GitHub issue **[#111](https://github.com/nguyenhoangtin1404/Diecast360/issues/111)**.

Biến môi trường đầy đủ: [`ENV.md`](ENV.md). Cookie / CORS khi frontend và API khác domain: [`COOKIE_AUTH.md`](COOKIE_AUTH.md).

---

## Sơ đồ luồng

```text
Trình duyệt
    → CDN (Vercel / Cloudflare Pages / …) — static Vite build
    → HTTPS API (hostname public, ví dụ api.example.com)
    → Cloudflare Tunnel (cloudflared trên Pi) → http://127.0.0.1:3000
    → Neon PostgreSQL (pooler cho runtime)
```

---

## 1. Neon (database)

1. Tạo project trên [Neon](https://neon.tech), tạo database (thường có sẵn `neondb`).
2. Lấy hai URL:
   - **Pooled** (host có `-pooler`) → `DATABASE_URL` trên Pi (runtime ứng dụng).
   - **Direct** (host không pooler) → `DIRECT_URL` trên Pi (Prisma `migrate`, introspect).
3. Áp migration lên Neon (một lần hoặc mỗi khi có migration mới), từ máy dev có env trỏ Neon (workspace gốc, lockfile **`pnpm-lock.yaml`**):

   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter ./backend exec prisma migrate deploy
   ```

4. Không commit URL có mật khẩu; chỉ đặt trong env trên Pi hoặc secret CI.

**Preview DB theo PR (Neon ↔ GitHub):** Sau khi kết nối repo trong Neon Console, GitHub có biến `NEON_PROJECT_ID` và secret `NEON_API_KEY`. Workflow [`.github/workflows/neon-preview-branches.yml`](../.github/workflows/neon-preview-branches.yml) (tên hiển thị Actions: **Create/Delete Branch for Pull Request**) tạo branch Neon `preview/pr-<số>-<git-branch>` (hết hạn sau ~14 ngày), chạy `prisma migrate deploy` trên branch đó, và xóa branch khi đóng PR. Fork PR không chạy (không có secret).

---

## 2. Frontend (Vercel hoặc thay thế)

### Vercel (mặc định dễ với Vite)

- Import repository GitHub → **Root Directory**: `frontend`.
- **Build command** / **Output**: theo `frontend/package.json` (thường build ra `dist`).
- Biến build (Production): `VITE_API_BASE_URL=https://<hostname-api-cua-ban>/api/v1` (HTTPS, khớp prefix `/api/v1`).

### Cloudflare Pages (thường được xem là lựa chọn free/CDN mạnh)

- Kết nối repo, build từ `frontend`, output `dist`.
- Cấu hình SPA / rewrite nếu React Router cần fallback về `index.html` (theo tài liệu Pages).

### Netlify

- Tương tự: root `frontend`, publish `dist`, env build giống Vercel.

Giới hạn free tier và điều khoản sử dụng thương mại — kiểm tra trang pricing của từng nhà cung cấp tại thời điểm triển khai.

---

## 3. Raspberry Pi — backend, không static IP

### Khuyến nghị: Cloudflare Tunnel

1. Tài khoản Cloudflare (miễn phí), có hostname (subdomain hoặc domain riêng).
2. Cài [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) trên Pi (ARM64).
3. Tạo tunnel, ánh xạ public hostname (ví dụ `api.example.com`) → service nội bộ `http://127.0.0.1:3000`.
4. Nest chỉ cần lắng nghe `127.0.0.1:3000` (hoặc `0.0.0.0` nếu tunnel trỏ đúng interface); HTTPS do Cloudflare xử lý phía edge.

Lợi ích: không cần mở cổng inbound trên router, không phụ thuộc IP tĩnh nhà mạng.

### Pi 4 (2 GB): gợi ý vận hành

- Dùng OS 64-bit; Node 20 (khớp workflow deploy hiện tại).
- **pnpm**: `corepack enable` và version khớp trường `packageManager` ở `package.json` gốc (xem `.github/workflows/deploy-backend.yml` hoặc `AGENTS.md`).
- **Chỉ chạy backend trên Pi**; database để trên Neon để tránh Postgres + Nest tranh RAM.
- **`UPLOAD_DIR` / thư mục uploads:** Cần khi `STORAGE_DRIVER=local` (đủ dung lượng, có thể USB). Khi `STORAGE_DRIVER=r2`, có thể **không** cần volume lớn trên Pi cho media; vẫn cần bucket R2 + biến `R2_*` — xem [`ENV.md`](ENV.md) mục Object storage và mục cutover trong tài liệu này.
  - **⚠️ `UPLOAD_DIR` phải nằm ngoài `DEPLOY_REMOTE_PATH`** (mặc định `/opt/diecast360-backend`). Workflow Pi dùng `rsync --delete` để đồng bộ bundle: bất kỳ thứ gì trong deploy root mà không nằm trong bundle (trừ `.env` và `uploads` đã được exclude) sẽ bị xoá ở mỗi deploy. Khuyến nghị `/var/lib/diecast360/uploads` (`sudo mkdir -p` + `sudo chown` cho user chạy systemd).
- Giới hạn `MAX_UPLOAD_MB` hợp lý — xử lý ảnh (Sharp) có thể tốn RAM khi upload đồng thời.
- Nếu deploy thủ công, cài dependency, build, migrate rồi restart:

  ```bash
  cd /path/to/Diecast360
  corepack enable
  corepack prepare pnpm@10.33.4 --activate
  # Backend build cần devDependencies (@nestjs/cli) — không force npm omit dev trong bước build.
  pnpm install --frozen-lockfile
  pnpm --filter ./backend run build
  pnpm --filter ./backend deploy --prod --legacy /path/to/prod-bundle
  # Hoặc cài deps backend trực tiếp (dev) và build trong backend/ như trong CI self-hosted.
  sudo systemctl restart diecast360-api
  ```

  Trên máy chủ, systemd thường trỏ `WorkingDirectory` tới **`/opt/diecast360-backend`** (deploy bundle sau `pnpm deploy`: `dist/`, `node_modules`, `prisma/`, `package.json`); file **`.env` nằm cạnh** các thư mục đó.

- Chạy production: `node dist/main.js` dưới **systemd** để tự khởi động lại và ghi log (`journalctl`).

Ví dụ unit systemd (chỉnh `User`, `WorkingDirectory`, `EnvironmentFile`):

```ini
[Unit]
Description=Diecast360 Backend API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/diecast360-backend
EnvironmentFile=/opt/diecast360-backend/.env
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 3.b. Production data layout rules

**Invariant rút ra từ sự cố 2026-05-26** ([`POSTMORTEMS/2026-05-26-uploads-wiped.md`](POSTMORTEMS/2026-05-26-uploads-wiped.md)): state directory (uploads, backups, local caches) **phải nằm ngoài** `DEPLOY_REMOTE_PATH`. Workflow Pi dùng `rsync --delete` ở mức gốc của `DEPLOY_REMOTE_PATH`; mọi thứ trong đó không thuộc deploy bundle và không có trong exclude list sẽ bị xoá.

**Bảng path chuẩn (FHS-aligned):**

| Loại | Đường dẫn khuyến nghị | Owner | Lý do |
|---|---|---|---|
| Artifact deploy | `/opt/diecast360-backend/` | pi:pi | Bị `rsync --delete` đồng bộ mỗi deploy |
| Config (secrets) | `/opt/diecast360-backend/.env` | pi:pi 600 | Excluded khỏi rsync (`--exclude=/.env`) |
| **User state — uploads** | `/var/lib/diecast360/uploads/` | pi:pi 755 | **Phải ngoài artifact root.** Default mới. |
| Backup local | `/mnt/usb-backup/diecast360-restic/` | pi:pi | USB external, ngoài Pi disk |
| Log | journalctl (systemd) | system | Không ghi file trực tiếp |
| Tmp / cache runtime | `/tmp/diecast360/` | pi:pi | Ephemeral, không cần backup |

**Setup `/var/lib/diecast360/uploads` (1 lần per Pi):**

```bash
sudo mkdir -p /var/lib/diecast360/uploads
sudo chown pi:pi /var/lib/diecast360/uploads
sudo chmod 755 /var/lib/diecast360/uploads
# Cập nhật /opt/diecast360-backend/.env: UPLOAD_DIR=/var/lib/diecast360/uploads
sudo systemctl restart diecast360-api
```

**Khi nào hợp lệ để đặt state trong `DEPLOY_REMOTE_PATH`?** Chỉ khi state đó được **liệt kê tường minh** trong `--exclude` của rsync **và** được commit vào workflow review. Hiện tại workflow exclude `.env` + `/uploads`. Mọi state mới (ví dụ sqlite cache, vector store local) **phải đi qua quy trình:** thêm exclude → thêm bảng path → thêm gotcha vào AGENTS/CLAUDE.

**Backup strategy** cho `UPLOAD_DIR`: xem [`RUNBOOKS/backup.md`](RUNBOOKS/backup.md). Tóm tắt: restic → R2 (offsite, encrypted, dedup, retention 7d/4w/12m) + USB external (offline, retention 14d) chạy nightly, alert nếu snapshot >26h.

**Recovery** khi nghi mất data: xem [`RUNBOOKS/data-loss-incident.md`](RUNBOOKS/data-loss-incident.md). Quy tắc số 1: `systemctl stop` trước khi điều tra (bảo toàn ext4 inode).

---

## 4. Biến môi trường tối thiểu (tóm tắt)

| Nơi | Biến | Ghi chú |
|-----|------|---------|
| **Pi / `backend/.env`** | `DATABASE_URL`, `DIRECT_URL` | Neon pooled + direct — xem [`ENV.md`](ENV.md) |
| **Pi** | `JWT_SECRET`, `COOKIE_SECRET` | Đủ entropy, không tái sử dụng từ dev |
| **Pi** | `FRONTEND_URL` | Origin chính xác của frontend (ví dụ `https://xxx.vercel.app`) — CORS |
| **Pi** | `BACKEND_URL` | URL public của API (HTTPS), dùng làm base cho signed media URL `/api/v1/media` |
| **Pi** | `MEDIA_SIGNING_SECRET`, `MEDIA_URL_TTL_MS` | Tùy chọn cho signed media URL; nếu không set secret riêng, backend fallback sang `JWT_SECRET` |
| **Pi** | `COOKIE_SECURE=true`, `COOKIE_SAME_SITE` | Production HTTPS — xem [`ENV.md`](ENV.md) |
| **Pi** | `UPLOAD_DIR` | Bắt buộc khi `STORAGE_DRIVER=local` — đường dẫn ghi được, **phải nằm ngoài `DEPLOY_REMOTE_PATH`** (xem mục 3.b). Default mới: `/var/lib/diecast360/uploads`. Với `STORAGE_DRIVER=r2` có thể bỏ qua nhu cầu volume lớn cho media |
| **Pi** | `STORAGE_DRIVER`, `R2_*` | Khi dùng Cloudflare R2 — xem [`ENV.md`](ENV.md) |
| **Vercel / Pages** (build) | `VITE_API_BASE_URL` | `https://<api-host>/api/v1` |

Chi tiết Facebook, OpenAI, Pinecone: tùy tính năng bật — vẫn trong [`ENV.md`](ENV.md).

---

## 5. Thứ tự triển khai đề xuất

1. Neon: tạo project, gán `DATABASE_URL` / `DIRECT_URL`, chạy `prisma migrate deploy` (lần đầu có thể từ máy dev).
2. Pi: cài Node, clone repo, tạo `backend/.env`, build, chạy thử local trên `127.0.0.1:3000`.
3. GitHub Environment **production**: thêm secret `PRODUCTION_DATABASE_URL` và `PRODUCTION_DIRECT_URL` (cùng giá trị như trên Pi — xem mục 6).
4. Cloudflare Tunnel: public HTTPS → port 3000 trên Pi.
5. Cập nhật `VITE_API_BASE_URL` trên host frontend, deploy lại frontend.
6. Kiểm tra đăng nhập, upload nhỏ, catalog; đọc [`COOKIE_AUTH.md`](COOKIE_AUTH.md) nếu cookie cross-site lỗi.

Tự động deploy backend khi **`CI` workflow** trên `main` hoàn thành (sự kiện **push**) với conclusion **success** (đã thay trigger `paths:` bằng `workflow_run` — không deploy nếu CI đỏ). Runner Pi: checkout + **`pnpm install` / `pnpm --filter ./backend run build`** + **`pnpm --filter ./backend deploy --prod --legacy`** (bundle production), **`rsync --exclude .env`** vào `DEPLOY_REMOTE_PATH` (thường `/opt/diecast360-backend`), **`npx prisma generate`**, restart `diecast360-api`, probe `GET /api/v1/health`. Vẫn có **`workflow_dispatch`** (tùy chọn skip migrate).

---

## 6. CI và migration

Workflow CI mặc định: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Deploy backend: [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml) và [`BACKEND_SELF_HOSTED_RUNNER.md`](BACKEND_SELF_HOSTED_RUNNER.md).

**Migration production** chạy **trước** bước Pi, trên runner `ubuntu-latest`, biến lấy từ GitHub Environment **production**:

| Secret | Ý nghĩa |
|--------|---------|
| `PRODUCTION_DATABASE_URL` | Neon pooled — giống `DATABASE_URL` trong `.env` Pi |
| `PRODUCTION_DIRECT_URL` | Neon direct — giống `DIRECT_URL` trong `.env` Pi |

Nếu bạn chỉ áp migration qua **Neon GitHub integration**, có thể chạy deploy thủ công với tùy chọn **Skip prisma migrate** (`workflow_dispatch`), hoặc vẫn đặt hai secret ở trên: `prisma migrate deploy` là lệnh idempotent (đã apply thì bỏ qua).

Pi không cần mở outbound tới Neon chỉ để migrate trong CD (runtime API vẫn cần `DATABASE_URL` trong `.env` Pi).

---

## 7. Bảo mật và vận hành

- Xoay mật khẩu Neon nếu từng lộ URL trong chat / log công khai.
- Sao lưu định kỳ thư mục upload trên Pi; Neon có backup theo gói dịch vụ.
- Sau deploy: kiểm tra `sudo systemctl status diecast360-api`, `journalctl -u diecast360-api -n 100 --no-pager`, và `curl -sfS http://127.0.0.1:$PORT/api/v1/health`.
- Cập nhật code: merge `main` (workflow self-hosted trên Pi) hoặc tay: build theo mục Pi ở trên rồi `systemctl restart …`.

---

## 8. Cutover: local disk → Cloudflare R2

Thứ tự gợi ý (staging trước production):

1. Tạo bucket R2 + API token (S3-compatible: Object Read & Write); ghi `STORAGE_DRIVER=r2` và đủ `R2_*` trên **staging** (xem [`ENV.md`](ENV.md) mục Object storage).

2. **Đồng bộ object** từ `UPLOAD_DIR` lên bucket, **giữ nguyên key** (trùng `file_path` trong DB, ví dụ `images/...`, `spinner/...`).

   Khuyến nghị dùng **rclone** (resume + checksum):

   ```bash
   # 1. Cấu hình remote một lần
   rclone config create r2remote s3 \
     provider Cloudflare \
     access_key_id $R2_ACCESS_KEY_ID \
     secret_access_key $R2_SECRET_ACCESS_KEY \
     endpoint https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com \
     region auto

   # 2. Dry-run — kiểm tra key trước khi copy thật
   rclone sync /path/to/UPLOAD_DIR r2remote:$R2_BUCKET --dry-run --progress

   # 3. Sync thật (không thêm prefix; cấu trúc key phải khớp DB)
   rclone sync /path/to/UPLOAD_DIR r2remote:$R2_BUCKET --progress
   ```

   Sau sync, so sánh số file: `rclone size /path/to/UPLOAD_DIR` vs `rclone size r2remote:$R2_BUCKET`.

3. Khởi động lại backend với `STORAGE_DRIVER=r2`; spot-check: upload mới, mở ảnh catalog, `GET /api/v1/media?...` với link đã ký cũ (proxy R2).

4. **Production:** backup `UPLOAD_DIR` trước → lặp lại sync → đổi env → restart; theo dõi log và egress.

5. **Rollback:** đặt lại `STORAGE_DRIVER=local`, khôi phục tree file dưới `UPLOAD_DIR` từ backup; hoặc trỏ lại disk snapshot.

Chi tiết biến môi trường R2: [`ENV.md`](ENV.md) mục Object storage.

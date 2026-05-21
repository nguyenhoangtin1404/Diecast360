# Backend trên Raspberry Pi + Cloudflare Tunnel + GitHub Actions

Luồng hiện tại: job **migrate** trên **GitHub-hosted** (`prisma migrate deploy` với secret Neon) → job trên **Pi**: `checkout` → build NestJS trên ARM → `rsync` `dist/`, `package.json`, `package-lock.json`, `prisma/` vào `DEPLOY_REMOTE_PATH` → `npm ci --omit=dev` → `prisma generate` → `systemctl restart` → probe `GET /api/v1/health`.

API ra ngoài qua **Cloudflare Tunnel** trỏ tới `http://127.0.0.1:3000` (hoặc cổng `PORT` trong `.env`).

## 1. Chuẩn bị Pi (một lần)

- Pi cần **Node 20**, `git`, `rsync`, quyền ghi vào `DEPLOY_REMOTE_PATH`, và quyền `sudo systemctl restart diecast360-api` không mật khẩu cho user chạy runner.
- Thư mục deploy (mặc định): `/opt/diecast360-backend`. Clone repo hoặc tạo thư mục và `git init` + remote — workflow **không** tự clone lần đầu; rsync tạo/tệp tin trong thư mục đó.

```bash
# Chỉ cần khi STORAGE_DRIVER=local — volume ghi ảnh trên Pi
sudo mkdir -p /opt/diecast360-backend/uploads
sudo chown -R "$USER:$USER" /opt/diecast360-backend
```

Khi `STORAGE_DRIVER=r2`, bước `mkdir uploads` **không bắt buộc** cho media (object nằm trên R2). Vẫn cần `backend/.env` đầy đủ `R2_*` và bucket đã đồng bộ nếu đang cutover từ disk — xem [`ENV.md`](ENV.md) mục Object storage và [`backend/scripts/README.md`](../backend/scripts/README.md).

- Copy **`.env`** production trên Pi (Neon `DATABASE_URL` / `DIRECT_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `FRONTEND_URL` = origin frontend hosting, v.v.). Xem [`ENV.md`](ENV.md).
- **`BACKEND_URL`**: đặt URL public của API (vd `https://api.example.com`) để ký và trả link ảnh qua `GET /api/v1/media`.

### systemd

`/etc/systemd/system/diecast360-api.service` (chỉnh `User`, `WorkingDirectory`):

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

```bash
sudo systemctl daemon-reload
sudo systemctl enable diecast360-api
```

### sudo restart không hỏi mật khẩu (user deploy)

```bash
echo 'pi ALL=(ALL) NOPASSWD: /bin/systemctl restart diecast360-api' | sudo tee /etc/sudoers.d/diecast360-api
sudo chmod 440 /etc/sudoers.d/diecast360-api
```

## 2. GitHub Actions — deploy backend (self-hosted runner trên Pi)

Workflow [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml) chạy trên runner **đặt trên Pi** (`runs-on: [self-hosted, diecast360-pi]`), **không** SSH từ internet vào nhà.

**Hướng dẫn từng bước cài runner + nhãn:** [`BACKEND_SELF_HOSTED_RUNNER.md`](BACKEND_SELF_HOSTED_RUNNER.md).

| Secret / biến | Mô tả |
|----------------|--------|
| `DEPLOY_REMOTE_PATH` | (Tuỳ chọn) Đường dẫn deploy; mặc định `/opt/diecast360-backend`. Ví dụ `/opt/diecast360-api` → set secret = `/opt/diecast360-api`. Có thể đặt trong Environment `production` thay vì secret. |

Không cần `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` khi dùng self-hosted trên Pi như hiện tại.

## 3. Cloudflare Tunnel (public API, không cần mở 443 trên router)

1. Domain dùng DNS Cloudflare.
2. Trên Pi cài `cloudflared` ([Cloudflare docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)).
3. `cloudflared tunnel login` → tạo tunnel → chỉ public hostname (vd `api.example.com`) → service **`http://127.0.0.1:3000`** (hoặc đúng `PORT`).
4. Chạy tunnel bằng systemd để khởi động lại cùng OS.

HTTPS và certificate do Cloudflare lo; trên backend production nên:

- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE`: nếu UI (Vercel/domain shop) và API **khác site** → `none` + `COOKIE_SECURE=true`; cùng site → `lax` hoặc `strict`

## 4. Frontend (hosting khác)

Trong `.env` build frontend (vd `VITE_API_BASE_URL`):

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Origin frontend phải nằm trong `FRONTEND_URL` / `FRONTEND_URLS` của backend.

## 5. Workflow

File: [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml)

- Trigger: push `main` khi đổi `backend/**`, hoặc **Run workflow** thủ công.
- Job deploy chạy trên **self-hosted runner trên Pi** (label `diecast360-pi`): checkout → build ARM → `rsync` vào `DEPLOY_REMOTE_PATH` → `npm ci --omit=dev` → `prisma generate` → restart. Migration production chạy ở job `migrate` trước đó trên GitHub-hosted runner.
- Không copy `node_modules` giữa máy khác và Pi: luôn `npm ci --omit=dev` tại thư mục deploy.
- **`rsync --delete`** cho `dist/` và `prisma/`: thư mục deploy **khớp repo** — không giữ file chỉ có local (tránh drift). Migration chỉ nên có trong Git.
- Job dùng GitHub **Environment** tên `production` (tự tạo lần đầu). Vào **Settings → Environments → production** để bật **Required reviewers** nếu muốn chặn migrate/restart cho đến khi duyệt (khuyến nghị cho DB production). Có thể bật **Restrict deployments** (chỉ `main`) để tránh deploy nhầm nhánh.

### Branch protection (khuyến nghị)

Vì **merge vào `main`** (sau khi CI xanh) sẽ trigger deploy khi có thay đổi `backend/**`, nên cấu hình **Settings → Rules → Rulesets** (hoặc branch protection cũ):

- Bắt buộc **pull request** trước khi merge.
- Bắt buộc **status check** (job CI Success / backend / frontend tùy repo).
- (Tuỳ chọn) **Require review from Code Owners** — file [`.github/CODEOWNERS`](../.github/CODEOWNERS) gán owner cho `backend/` và workflow deploy (chỉnh `@username` cho đúng team).
- Sau deploy: **`systemctl is-active`** và **`curl`** tới `http://127.0.0.1:$PORT/api/v1/health` (endpoint **`GET /api/v1/health`**) — kiểm tra **DB** (`SELECT 1`); trả **503** nếu Neon không kết nối được. **`PORT`** lấy từ `.env` trước migrate/restart.
- **Rollback:** redeploy commit cũ trên `main` hoặc chạy workflow trên commit/tag trước; migration đã apply lên Neon cần xử lý tay hoặc migration down (Prisma không auto rollback).

### Tunnel — systemd (tham khảo Cloudflare)

```bash
sudo cloudflared service install
```

Chi tiết và template service: [Cloudflare Tunnel · Run as a service](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/as-a-service/).

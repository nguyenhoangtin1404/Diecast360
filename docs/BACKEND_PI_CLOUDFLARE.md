# Backend trên Raspberry Pi + Cloudflare Tunnel + GitHub Actions

Luồng: **build trên GitHub (`ubuntu-latest`)** → **rsync `dist/`, `package.json`, `package-lock.json`, `prisma/`** lên Pi → trên Pi **`npm ci --omit=dev`** (native modules build đúng ARM) → **`prisma migrate deploy`** → **`systemctl restart`**.  
API ra ngoài qua **Cloudflare Tunnel** trỏ tới `http://127.0.0.1:3000` (hoặc cổng `PORT` trong `.env`).

## 1. Chuẩn bị Pi (một lần)

- Node **không bắt buộc** trên Pi cho bước build (build xong trên GitHub); vẫn cần **Node 20** để chạy `node dist/main.js` và `npm ci`.
- Thư mục deploy (mặc định): `/opt/diecast360-backend`. Clone repo hoặc tạo thư mục và `git init` + remote — workflow **không** tự clone lần đầu; rsync tạo/tệp tin trong thư mục đó.

```bash
sudo mkdir -p /opt/diecast360-backend/uploads
sudo chown -R "$USER:$USER" /opt/diecast360-backend
```

- Copy **`.env`** production trên Pi (Neon `DATABASE_URL` / `DIRECT_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `FRONTEND_URL` = origin frontend hosting, v.v.). Xem [`ENV.md`](ENV.md).
- **`PUBLIC_BASE_URL`**: nên là URL public của API (vd `https://api.example.com`) để ghép link ảnh đúng.

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

## 2. GitHub Actions — Secrets

| Secret | Mô tả |
|--------|--------|
| `DEPLOY_HOST` | Hostname hoặc IP Pi (**phải SSH được từ internet** tới Pi: port forward 22 hoặc SSH qua Cloudflare / Tailscale tùy bạn). |
| `DEPLOY_USER` | User SSH (vd `pi`). |
| `DEPLOY_SSH_KEY` | Private key (toàn bộ PEM), khớp `authorized_keys` trên Pi. |
| `DEPLOY_REMOTE_PATH` | (Tuỳ chọn) Đường dẫn deploy; mặc định `/opt/diecast360-backend`. |

### SSH key cho GitHub → Pi

Trên máy dev (không commit private key):

```bash
ssh-keygen -t ed25519 -f ./diecast360-deploy -N ""
```

- Public key (`diecast360-deploy.pub`): thêm vào Pi — `~/.ssh/authorized_keys` của user deploy (một dòng).
- Private key (`diecast360-deploy`): nội dung file → GitHub Secret **`DEPLOY_SSH_KEY`**.

Luân phiên key định kỳ: tạo cặp mới, cập nhật secret + `authorized_keys`, xoá key cũ.

## 3. Cloudflare Tunnel (public API, không cần mở 443 trên router)

1. Domain dùng DNS Cloudflare.
2. Trên Pi cài `cloudflared` ([Cloudflare docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)).
3. `cloudflared tunnel login` → tạo tunnel → chỉ public hostname (vd `api.example.com`) → service **`http://127.0.0.1:3000`** (hoặc đúng `PORT`).
4. Chạy tunnel bằng systemd để khởi động lại cùng OS.

HTTPS và certificate do Cloudflare lo; trên backend production nên:

- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE` phù hợp (thường `lax` hoặc `strict` tùy subdomain/cookie cross-site)

## 4. Frontend (hosting khác)

Trong `.env` build frontend (vd `VITE_API_BASE_URL`):

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Origin frontend phải nằm trong `FRONTEND_URL` / `FRONTEND_URLS` của backend.

## 5. Workflow

File: [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml)

- Trigger: push `main` khi đổi `backend/**`, hoặc **Run workflow** thủ công.
- Không copy `node_modules` từ runner → Pi luôn `npm ci --omit=dev` đúng kiến trúc ARM.
- **`rsync --delete`** cho `dist/` và `prisma/`: Pi được **đồng bộ đúng repo** — không giữ file chỉ có trên Pi (tránh drift). Migration chỉ nên có trong Git.
- Job dùng GitHub **Environment** tên `production` (tự tạo lần đầu). Vào **Settings → Environments → production** để bật **Required reviewers** nếu muốn chặn migrate/restart cho đến khi duyệt (khuyến nghị cho DB production). Có thể bật **Restrict deployments** (chỉ `main`) để tránh deploy nhầm nhánh.
- Sau deploy: **`systemctl is-active`** và **`curl`** tới `http://127.0.0.1:$PORT/api/v1/health` (endpoint **`GET /api/v1/health`**) — kiểm tra **DB** (`SELECT 1`); trả **503** nếu Neon không kết nối được. **`PORT`** lấy từ `.env` trước migrate/restart.
- **Rollback:** redeploy commit cũ trên `main` hoặc chạy workflow trên commit/tag trước; migration đã apply lên Neon cần xử lý tay hoặc migration down (Prisma không auto rollback).

### Tunnel — systemd (tham khảo Cloudflare)

```bash
sudo cloudflared service install
```

Chi tiết và template service: [Cloudflare Tunnel · Run as a service](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/as-a-service/).

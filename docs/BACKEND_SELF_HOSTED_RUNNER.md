# GitHub Actions self-hosted runner trên Raspberry Pi (deploy backend)

Khi runner chạy **trực tiếp trên Pi**, workflow **không** SSH từ internet vào nhà: job **`migrate`** chạy trước trên **GitHub-hosted** (`pnpm install --frozen-lockfile` + `pnpm --filter ./backend exec prisma migrate deploy`); job deploy trên Pi chỉ `checkout` → **`pnpm` install + build + `pnpm deploy --prod --legacy`** → `rsync` bundle (giữ `.env`) → `npx prisma generate` → `systemctl restart`.

**Nhãn runner bắt buộc:** workflow dùng `runs-on: [self-hosted, diecast360-pi]`. Khi đăng ký runner, thêm nhãn tùy chọn **`diecast360-pi`** (Settings → Actions → Runners → runner của bạn → labels), hoặc thêm lúc cấu hình lần đầu.

---

## Yêu cầu trước

- Pi **64-bit** (khuyến nghị), **Node 20** (`node -v`).
- **`git`** đã cài (`sudo apt install git`) — `actions/checkout` cần.
- Thư mục deploy (mặc định `/opt/diecast360-backend`) có `.env`, `uploads/`, và service `diecast360-api` như [`BACKEND_PI_CLOUDFLARE.md`](BACKEND_PI_CLOUDFLARE.md).
- User chạy runner (thường `pi`) có quyền:
  - **Ghi** vào `DEPLOY_REMOTE_PATH` (sở hữu thư mục hoặc ACL phù hợp).
  - **`sudo systemctl restart diecast360-api`** không mật khẩu (sudoers một lệnh như trong doc Pi).

---

## Bước 1 — Tạo runner trên GitHub

1. Repo → **Settings** → **Actions** → **Runners** → **New self-hosted runner**.
2. Chọn **Linux** và **ARM64** (Pi 4 OS 64-bit).
3. GitHub hiển thị lệnh tải `actions-runner-*.tar.gz` và `./config.sh ...` — **chưa chạy**; làm bước 2 trên Pi.

---

## Bước 2 — Cài runner trên Pi (SSH vào Pi)

Tạo thư mục (ví dụ home của user `pi`):

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
```

Tải và giải nén **đúng** gói **linux-arm64** mà trang GitHub hiển thị (phiên bản thay đổi — luôn copy lệnh từ **New self-hosted runner**), ví dụ:

```bash
# Thay URL/tên file bằng lệnh copy từ GitHub (ARM64)
curl -o actions-runner-linux-arm64.tar.gz -L 'https://github.com/actions/runner/releases/download/vX.Y.Z/actions-runner-linux-arm64-X.Y.Z.tar.gz'
tar xzf ./actions-runner-linux-arm64.tar.gz
```

Cấu hình (dán token từ trang GitHub — token **hết hạn nhanh**, chỉ dùng một lần):

```bash
./config.sh --url https://github.com/OWNER/REPO --token RUNNER_TOKEN_TU_GITHUB
```

Trong wizard:

- **Runner group:** mặc định `Default` (hoặc nhóm bạn dùng).
- **Tên runner:** ví dụ `pi-diecast360`.
- **Labels:** thêm **`diecast360-pi`** (bắt buộc khớp workflow; có thể thêm `self-hosted`, `linux`, `arm64` nếu muốn).
- **Work folder:** Enter (mặc định `_work`).

Cài service để runner tự chạy khi boot:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

Kiểm tra trên GitHub: runner hiện **Idle** (màu xanh).

---

## Bước 3 — Quyền deploy (trên Pi)

User runner phải ghi được `dist/`, `prisma/`, `package.json` trong `DEPLOY_REMOTE_PATH` và restart service:

```bash
sudo chown -R pi:pi /opt/diecast360-backend
```

(Thay bằng đường dẫn thật của bạn, ví dụ `/opt/diecast360-api`, nếu dùng `DEPLOY_REMOTE_PATH` khác mặc định.)

Sudoers (một dòng, đã có trong doc Pi — chỉnh user nếu khác):

```bash
echo 'pi ALL=(ALL) NOPASSWD: /bin/systemctl restart diecast360-api' | sudo tee /etc/sudoers.d/diecast360-api
sudo chmod 440 /etc/sudoers.d/diecast360-api
```

---

## Bước 4 — GitHub Secrets / Environment **production**

| Secret | Mô tả |
|--------|--------|
| `PRODUCTION_DATABASE_URL` | **Bắt buộc cho CD** (trừ khi luôn deploy với *Skip prisma migrate*): Neon pooled — cùng giá trị `DATABASE_URL` trong `.env` Pi. |
| `PRODUCTION_DIRECT_URL` | **Bắt buộc** cùng điều kiện trên: Neon direct — cùng giá trị `DIRECT_URL` trong `.env` Pi. |
| `DEPLOY_REMOTE_PATH` | (Tuỳ chọn) Đường dẫn deploy; nếu **không** set → mặc định `/opt/diecast360-backend`. Ví dụ bạn dùng `/opt/diecast360-api` → đặt secret này thành **`/opt/diecast360-api`** (đúng dấu `/` đầu). |

Đặt các secret trên trong **Settings → Environments → production** (workflow deploy gắn `environment: production`).

### Thư mục deploy là `/opt/diecast360-api` (không phải `-backend`)

1. GitHub → **Settings → Secrets and variables → Actions** (hoặc Environment **production**): tạo secret **`DEPLOY_REMOTE_PATH`** = `/opt/diecast360-api`.
2. Trên Pi: tạo thư mục, `.env`, `uploads/`, quyền sở hữu — thay mọi chỗ doc viết `/opt/diecast360-backend` bằng **`/opt/diecast360-api`**.
3. **systemd** (`diecast360-api.service`): `WorkingDirectory` và `EnvironmentFile` phải trỏ tới **`/opt/diecast360-api`** (và `ExecStart` vẫn `node dist/main.js` trong thư mục đó).

Workflow chỉ đọc biến này; **không** bắt buộc đổi tên service `diecast360-api`.

**Không cần** `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` khi chỉ dùng self-hosted như workflow mới.

Environment **production** (nếu workflow gắn `environment: production`): có thể thêm biến `DEPLOY_REMOTE_PATH` ở đó thay vì secret.

---

## Bước 5 — Kích hoạt deploy

- **Push `main` (CD)**: sau **CI Success**, job **Deploy backend (Pi)** chỉ chạy nếu **Backend deploy gate** = true (`backend/**`, `pnpm-lock.yaml`, hoặc workflow `ci.yml` / `deploy-backend*.yml`).
- **Thủ công**: Actions → **Deploy backend (Pi) — manual** (workflow riêng, không hiện trên popup check của commit).

Job chỉ chạy khi có runner **online** với label **`diecast360-pi`**. Nếu không có runner, job sẽ **treo chờ** — cần bật Pi + `sudo ./svc.sh start`.

---

## Gỡ runner (khi cần)

Trên Pi, trong thư mục runner:

```bash
cd ~/actions-runner
sudo ./svc.sh stop
sudo ./svc.sh uninstall
./config.sh remove --token TOKEN_GITHUB_REMOVE
```

(Token remove lấy tại GitHub: Runner → … → Remove.)

---

## So với deploy qua SSH (runner trên GitHub)

| | Self-hosted trên Pi | SSH từ `ubuntu-latest` |
|--|---------------------|-------------------------|
| Mở port 22 / tunnel | Không cần cho GitHub | Cần host public hoặc tunnel |
| Build backend | Trên ARM Pi (đúng kiến trúc) | Trên AMD64 rồi rsync `dist` (đã hỗ trợ) |
| Tải repo mỗi lần | Có (`checkout` full clone shallow) | Chỉ rsync artifact nhỏ |

Nếu Pi hoặc mạng nhà chậm, có thể cân nhắc giữ build trên GitHub + chỉ self-hosted cho bước copy (workflow tách job) — hiện tại workflow **build toàn bộ trên Pi** để đơn giản một job.

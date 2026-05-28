# CI/CD — luồng thực tế và cách đọc trạng thái

Tài liệu này khớp workflow trong `.github/workflows/` (cập nhật 2026-05). Chi tiết triển khai Pi/Neon/Vercel: [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## Sơ đồ

### PR (fail-fast trong CI)

```text
                    ┌── Backend ──────────────┐
                    │   lint → build → jest   │
                    │         │               │
                    │         ▼ (needs)       │
                    │   Health Check (smoke)  │
                    └───┬─────────────────────┘
                        │
    Frontend ───────────┼── Security (audit)
    (lint,tsc,build,    │
     e2e)               ▼
                  CI Success  ←── bất kỳ job fail → đỏ, không merge
```

Song song: Gitleaks, Commitlint, PR title, Neon preview (PR), Vercel preview.

### Production CD sau merge `main` (fail-fast)

```text
CI Success (main push)
        │
        ▼
Check backend changed?
        │
   No ──┴── Yes
   │         │
   │         ▼
   │    Build gate (ubuntu) ──fail──► dừng (không migrate Neon)
   │         │
   │         ▼
   │    Prisma migrate (Neon) ──fail──► dừng (không deploy Pi)
   │         │
   │         ▼
   │    Build & deploy on Pi + health JSON ──fail──► CD Success đỏ
   │         │
   │         ▼
   │    CD Success xanh
   │
   └──► CD Success (skipped — chỉ frontend/docs đổi)

Vercel production: check riêng; nên bật “Wait for Checks” = CI Success.
```

Thứ tự job trong `deploy-backend.yml`: `check-changes` → `build` → `migrate` → `deploy` → `cd-success` (mỗi bước `needs` bước trước).

---

## Bảng: check trên PR/commit vs deploy thật

| Thành phần | Job / check nhìn thấy trên commit | Có deploy production? | Làm sao biết xong |
|------------|-----------------------------------|------------------------|-------------------|
| **Chất lượng code** | `CI / CI Success` | Không | Job xanh trên PR |
| **Backend smoke (giả lập)** | `CI / Backend Health Check` | Không — Postgres trong container CI, không phải Neon/Pi | JSON health + DB `SELECT 1` trên runner Ubuntu |
| **Frontend** | `CI / Frontend` + **Vercel** | Vercel: có (static) khi merge/push branch được hook | Vercel check + dashboard Deployments |
| **DB production** | *Không hiện trên PR* | Có — sau **Build gate** CD | **Prisma migrate (production)** |
| **Backend Pi** | *Không hiện trên PR* | Có — khi backend-relevant | **Build & deploy on Pi** → **CD Success** |

---

## Khi nào CD production chạy / bỏ qua

Workflow **`Deploy backend (Pi)`** chạy khi:

1. Workflow **CI** kết thúc **success** trên **`main`**, event **push** (sau merge), **hoặc**
2. **`workflow_dispatch`** (luôn deploy, bỏ qua path filter).

Job **`Check if backend changed`** bỏ qua **build, migrate, deploy** nếu **không** có file trong:

- `backend/**`
- `pnpm-lock.yaml`
- `.github/workflows/deploy-backend.yml`

**Path filter:** với push thường, CI upload artifact `push-changed-files-<sha>` (diff `before`…`after` của push). CD đọc artifact đó — tránh miss thay đổi khi một lần `git push` gồm nhiều commit (chỉ so `HEAD^` là không đủ). Không có artifact → fallback `git diff HEAD^ HEAD`.

**Squash-merge nhiều commit trên PR:** thường một commit trên `main` — OK. Edge case hiếm: dùng **workflow_dispatch**.

---

## Staging (`staging` branch)

| Workflow | Trigger | DB | Backend |
|----------|---------|-----|---------|
| `deploy-staging.yml` | push `staging` + paths backend | Neon staging secrets | Pi instance `diecast360-api-staging` :3001 |

Frontend staging: Vercel preview (không job trong repo).

---

## Neon preview (PR)

`neon-preview-branches.yml`: branch Neon `preview/pr-<n>-<branch>`, `prisma migrate deploy` trên preview — **không** thay production.

---

## Smoke / gap đã biết (không coi là “đã deploy prod”)

| Kiểm tra | Phạm vi | Gap |
|----------|---------|-----|
| Backend unit tests | Jest, Prisma mock | Không nối DB thật (health-check job bù phần boot+migrate) |
| Backend Health Check (CI) | Boot `dist`, migrate, `/api/v1/health` | Không phải Pi, không Neon prod, **không** đọc `UPLOAD_DIR` / R2 |
| Playwright E2E | `VITE_API_BASE_URL=auto`, mock API | Không test stack prod (Vercel → Tunnel → Pi → Neon) |
| Pi health sau deploy | `curl` + assert JSON envelope | Giống CI về DB; **không** probe media/storage (postmortem 2026-05-26) |
| Vercel | Build + deploy static | Không verify API prod; `VITE_*` phải đúng trên Vercel dashboard |

**Build gate (CD):** compile trên GitHub **trước** `prisma migrate deploy` — tránh migrate Neon khi code không build được (CI trên PR đã build một lần; gate CD bắt lại đúng SHA merge).

**Migrate thành công, deploy Pi fail:** schema Neon có thể đã lên trước binary trên Pi — xử lý theo [`RUNBOOKS/data-loss-incident.md`](RUNBOOKS/data-loss-incident.md) / rollback runbook, không auto-down migration.

---

## Branch protection (khuyến nghị)

**Bắt buộc trên PR:**

- `CI Success`
- `Scan for secrets` (Gitleaks)
- `Lint commit messages`, `Validate PR title` (nếu dùng)

**Sau merge `main` (tùy chọn, không block PR):**

- Theo dõi workflow **Deploy backend (Pi)** và job **CD Success**
- Không đặt **CD Success** là required check trên PR (job CD không chạy trên PR)

---

## Fail dễ gặp

| Triệu chứng | Nguyên nhân thường gặp |
|-------------|-------------------------|
| CI xanh, prod backend cũ | Chỉ đổi `frontend/**` → CD skip (đúng thiết kế) |
| CD xanh nhưng không deploy | `backend=false` — xem log **Check if backend changed** |
| Build gate (CD) fail | TypeScript/Nest build lỗi — migrate/deploy không chạy |
| Migrate fail | Secret Neon / `DIRECT_URL`, migration conflict — deploy Pi không chạy |
| Deploy fail trên Pi | Runner offline, `sudo systemctl`, thiếu `.env`, build ARM OOM |
| Health fail Pi | Neon down, `PORT` sai, app crash — xem `journalctl -u diecast360-api` |
| Vercel xanh, API lỗi | `VITE_API_BASE_URL` sai hoặc Pi/tunnel down (CD không chạy) |
| `pnpm audit` fail | CVE high trong lockfile |

---

## Tham chiếu file

| File | Vai trò |
|------|---------|
| `.github/workflows/ci.yml` | CI + artifact changed-files (main push) |
| `.github/workflows/deploy-backend.yml` | Production CD |
| `.github/workflows/deploy-staging.yml` | Staging CD |
| `.github/workflows/neon-preview-branches.yml` | DB preview PR |
| `scripts/ci/assert-health-json.sh` | Probe health JSON (CI + Pi) |

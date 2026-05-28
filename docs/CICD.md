# CI/CD — luồng thực tế và cách đọc trạng thái

Tài liệu này khớp workflow trong `.github/workflows/` (cập nhật 2026-05). Chi tiết triển khai Pi/Neon/Vercel: [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## Sơ đồ

```text
PR / push → develop|main
    │
    ├─ CI (ci.yml) ─────────────────────────────────────────────┐
    │    Backend: lint, build, jest (mock DB)                     │
    │    Backend Health Check: Postgres 16 + migrate + boot API   │
    │    Frontend: lint, tsc, build, Vitest, Playwright E2E       │
    │    Security: pnpm audit --audit-level=high                  │
    │    CI Success (gate branch protection)                      │
    │    [push main only] Record push changed-files artifact      │
    ├─ Gitleaks, Commitlint (PR), PR title, Labeler, Neon PR…     │
    │
push main + CI success
    │
    └─ Deploy backend (Pi) (deploy-backend.yml)
         check-changes (path filter, xem artifact push)
         → Prisma migrate (production / Neon)
         → Build & deploy on Pi (rsync, restart, health probe)
         → CD Success (fail nếu backend đổi mà migrate/deploy fail)

Frontend production: Vercel GitHub App (check riêng trên commit, không nằm trong ci.yml).
```

---

## Bảng: check trên PR/commit vs deploy thật

| Thành phần | Job / check nhìn thấy trên commit | Có deploy production? | Làm sao biết xong |
|------------|-----------------------------------|------------------------|-------------------|
| **Chất lượng code** | `CI / CI Success` | Không | Job xanh trên PR |
| **Backend smoke (giả lập)** | `CI / Backend Health Check` | Không — Postgres trong container CI, không phải Neon/Pi | JSON health + DB `SELECT 1` trên runner Ubuntu |
| **Frontend** | `CI / Frontend` + **Vercel** | Vercel: có (static) khi merge/push branch được hook | Vercel check + dashboard Deployments |
| **DB production** | *Không hiện trên PR* | Có — khi CD chạy | Actions → **Deploy backend (Pi)** → **Prisma migrate (production)** |
| **Backend Pi** | *Không hiện trên PR* | Có — khi có thay đổi backend-relevant | Cùng workflow → **Build & deploy on Pi** → **CD Success** |

---

## Khi nào CD production chạy / bỏ qua

Workflow **`Deploy backend (Pi)`** chạy khi:

1. Workflow **CI** kết thúc **success** trên **`main`**, event **push** (sau merge), **hoặc**
2. **`workflow_dispatch`** (luôn deploy, bỏ qua path filter).

Job **`Check if backend changed`** bỏ qua migrate + deploy nếu **không** có file trong:

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

**Migrate thành công, deploy fail:** schema Neon có thể đã lên trước code — xử lý theo [`RUNBOOKS/data-loss-incident.md`](RUNBOOKS/data-loss-incident.md) / rollback runbook, không auto-down migration.

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
| Migrate fail | Secret Neon / `DIRECT_URL`, migration conflict |
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

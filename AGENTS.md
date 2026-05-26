# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Diecast360 is a pnpm monorepo (`backend/` + `frontend/`) for a diecast model car inventory app with 360° image viewer, public catalog, and social-selling tools.

Pinned tooling: **`packageManager`** và **`engines`** trong `package.json` gốc (Node + pnpm).

### Services

| Service | Port | How to start |
|---------|------|--------------|
| PostgreSQL 16 | 5432 | `pg_ctlcluster 16 main start` (already running after setup) |
| Backend (NestJS) | 3000 | `pnpm run dev:backend` |
| Frontend (Vite) | 5173 | `pnpm run dev:frontend` |
| Both together | — | `pnpm dev` (uses `concurrently`) |

### Key gotchas

- **COOKIE_SECRET** must be at least 32 characters in `backend/.env` or the app will throw at startup.
- **Production data layout:** `UPLOAD_DIR` (và mọi state khác như backup, log riêng, sqlite) **phải nằm ngoài** `DEPLOY_REMOTE_PATH` (mặc định `/opt/diecast360-backend`). Workflow Pi dùng `rsync --delete` để đồng bộ bundle: mọi thứ trong deploy root không thuộc bundle (trừ exclude) sẽ bị xoá khi deploy. Default đã chuyển sang `/var/lib/diecast360/uploads`. Postmortem chi tiết: [`docs/POSTMORTEMS/2026-05-26-uploads-wiped.md`](docs/POSTMORTEMS/2026-05-26-uploads-wiped.md).
- **Object storage (Cloudflare R2):** optional `STORAGE_DRIVER=r2` and `R2_*` variables — see [`docs/ENV.md`](docs/ENV.md) section **Object storage (Cloudflare R2)** and cutover notes in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
- **`onlyBuiltDependencies`** cho native deps (`sharp`, `bcrypt`, `prisma`, …) được khai báo trong [`pnpm-workspace.yaml`](pnpm-workspace.yaml).
- After `pnpm install`, the backend `postinstall` runs `prisma generate` automatically.
- `prisma migrate dev` prompts interactively for a migration name if the schema drifts; use `prisma migrate deploy` (non-interactive) when only applying existing migrations.
- Frontend lint (`pnpm --filter ./frontend lint`) currently has pre-existing lint errors in the codebase — these are not regressions.
- Node.js version must satisfy `>=20.19.0 <21 || >=22.12.0` (env ships v22.22.2 via nvm at `/home/ubuntu/.nvm`).
- Repo dùng **một lockfile**: `pnpm-lock.yaml` — không maintain `backend/package-lock.json` / `frontend/package-lock.json`.

### Continuous Integration (GitHub Actions)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **`CI`** (`ci.yml`) | `push` / `pull_request` → `main`, `develop` | `pnpm install --frozen-lockfile`; backend lint/build/Jest; **upload `backend/dist` artifact**; frontend lint/tsc/Vitest/Playwright; Postgres **health-check** (`GET /api/v1/health`, production env vars + artifact reuse); **`pnpm audit --audit-level=high`** block; **`CI Success`** gate gộp backend, frontend, security, health-check. |
| **`Gitleaks`** | Same branches | Quét secret (full git history). |
| **`Commitlint`** | Pull requests | Conventional commits cho từng commit trong PR (`.commitlintrc.json`). |
| **`PR Title Lint`** | PR opened/edited/… | Title semantic (squash-merge). Types giống commitlint (`feat`, `fix`, …). |
| **`Labeler`** (`pull_request_target`) | Pull requests → `main`, `develop` | Label theo path (`.github/labeler.yml`); cần tạo sẵn labels `area:*`, `deps` trong repo. |
| **`Deploy backend (Pi)`** | **`workflow_run` sau khi CI trên `main` success** (push event), hoặc `workflow_dispatch` | Migrate trên GitHub-hosted, build + **`pnpm deploy --prod --legacy`** trên runner Pi → rsync vào `/opt/diecast360-backend` (preserve `.env` + exclude `/uploads`), `prisma generate`, restart service. Trước khi sửa workflow phần `rsync`/`--delete`: review kèm `--dry-run` output trong PR description; nếu có thể, thử trên staging Pi/VM trước. Health check `/api/v1/health` hiện **không** touch storage — không tự phát hiện được "file mất nhưng app sống" (xem postmortem 2026-05-26). |

**Pi (một lần):** bật pnpm khớp [`package.json`](package.json) `packageManager`, ví dụ:

```bash
corepack enable
corepack prepare pnpm@10.33.4 --activate
```

**Branch protection:** bật required checks: **`CI Success`**, **`Scan for secrets`** (Gitleaks), **`Lint commit messages`**, **`Validate PR title`**. Labeler không bắt buộc.

**Squash-merge:** chỉnh **PR title** đúng Conventional Commit trước khi squash (ảnh hưởng message commit trên `main`).

Dependabot weekly: [`.github/dependabot.yml`](.github/dependabot.yml).

### Lint / Test / Build commands

See `docs/DEV.md` for full reference. Quick summary:

| Task | Command |
|------|---------|
| Backend lint | `pnpm --filter ./backend lint` |
| Frontend lint | `pnpm --filter ./frontend lint` |
| Backend tests (Jest) | `pnpm --filter ./backend test` |
| Frontend unit tests (Vitest) | `pnpm --filter ./frontend test:unit` |
| Frontend E2E (Playwright) | `pnpm --filter ./frontend test:e2e` |
| Backend build | `pnpm --filter ./backend build` |
| Frontend build | `pnpm --filter ./frontend build` |
| TypeScript check (frontend) | `pnpm --filter ./frontend exec tsc --noEmit` |

### Admin credentials (dev only)

Created by `pnpm --filter ./backend create:admin:quick -- <email> <password>`. Default dev account: `admin@diecast360.dev` / `admin123456`. Login URL: `http://localhost:5173/admin/login`.

### Database

PostgreSQL 16 at `localhost:5432`, database `diecast360`, user/password `postgres`/`postgres`. Start with `pg_ctlcluster 16 main start`. Run migrations with `pnpm --filter ./backend exec prisma migrate deploy`.

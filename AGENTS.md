# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Diecast360 is a pnpm monorepo (`backend/` + `frontend/`) for a diecast model car inventory app with 360° image viewer, public catalog, and social-selling tools.

### Services

| Service | Port | How to start |
|---------|------|--------------|
| PostgreSQL 16 | 5432 | `pg_ctlcluster 16 main start` (already running after setup) |
| Backend (NestJS) | 3000 | `pnpm run dev:backend` |
| Frontend (Vite) | 5173 | `pnpm run dev:frontend` |
| Both together | — | `pnpm dev` (uses `concurrently`) |

### Key gotchas

- **COOKIE_SECRET** must be at least 32 characters in `backend/.env` or the app will throw at startup.
- **Object storage (Cloudflare R2):** optional `STORAGE_DRIVER=r2` and `R2_*` variables — see [`docs/ENV.md`](docs/ENV.md) section **Object storage (Cloudflare R2)** and cutover notes in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
- **pnpm.onlyBuiltDependencies** in root `package.json` is required so that native modules (`sharp`, `bcrypt`, `prisma`, `esbuild`) build during `pnpm install`. Without it, pnpm v10+ silently skips their build scripts.
- After `pnpm install`, the backend `postinstall` runs `prisma generate` automatically.
- `prisma migrate dev` prompts interactively for a migration name if the schema drifts; use `prisma migrate deploy` (non-interactive) when only applying existing migrations.
- Frontend lint (`pnpm --filter ./frontend lint`) currently has pre-existing lint errors in the codebase — these are not regressions.
- Node.js version must satisfy `>=20.19.0 <21 || >=22.12.0` (env ships v22.22.2 via nvm at `/home/ubuntu/.nvm`).

### Continuous Integration (GitHub Actions)

Workflows under `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | `push` / `pull_request` to `main`, `develop` | Backend (lint, build, Jest), frontend (lint, typecheck, build, Vitest, Playwright), **backend health-check** (Postgres service, migrate, boot API, `GET /api/v1/health`), optional high-severity `npm audit`, and an aggregate **`CI Success`** job for branch protection. |
| `gitleaks.yml` | same branches | Secret scanning on full git history (`fetch-depth: 0`). |
| `commitlint.yml` | `pull_request` only | Enforces [Conventional Commits](https://www.conventionalcommits.org/) using root `.commitlintrc.json` (types include `feat`, `fix`, `docs`, `ci`, …). |
| `deploy-backend.yml` | deploy | Production deploy plus systemd health retry (separate from CI smoke). |

**Branch protection:** require the **`CI Success`** check (and any other required jobs your repo policy lists). Commitlint and Gitleaks are separate workflow names in the GitHub checks list—add them as required checks if you want PRs blocked on commit message format and leak scans.

**Local commit messages:** match the same types as in `.commitlintrc.json` (e.g. `feat:`, `fix:`, `ci:`) so PRs pass Commitlint.

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
| TypeScript check (frontend) | `cd frontend && npx tsc -b --noEmit` |

### Admin credentials (dev only)

Created by `pnpm --filter ./backend create:admin:quick -- <email> <password>`. Default dev account: `admin@diecast360.dev` / `admin123456`. Login URL: `http://localhost:5173/admin/login`.

### Database

PostgreSQL 16 at `localhost:5432`, database `diecast360`, user/password `postgres`/`postgres`. Start with `pg_ctlcluster 16 main start`. Run migrations with `pnpm --filter ./backend exec prisma migrate deploy`.

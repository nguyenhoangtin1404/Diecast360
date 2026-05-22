---
title: "CI/CD Pipeline Document"
version: "1.0"
date: "2026-05-22"
author: "DevOps Team"
---

# File 28 — CI/CD Pipeline

## Mục lục

1. [Tổng quan pipeline](#1-tổng-quan-pipeline)
2. [CI Workflow — Kiểm tra chất lượng](#2-ci-workflow--kiểm-tra-chất-lượng)
3. [CD Workflow — Deploy lên production](#3-cd-workflow--deploy-lên-production)
4. [Neon Preview Branches cho PR](#4-neon-preview-branches-cho-pr)
5. [Environment-specific pipelines](#5-environment-specific-pipelines)
6. [Secrets management trong GitHub Actions](#6-secrets-management-trong-github-actions)
7. [Rollback procedure](#7-rollback-procedure)
8. [YAML examples đầy đủ](#8-yaml-examples-đầy-đủ)
9. [Deployment notifications](#9-deployment-notifications)

---

## 1. Tổng quan pipeline

```
Developer push/PR
       │
       ▼
┌─────────────────────────────┐
│     CI Workflow              │  on: push (any branch) + PR to develop/main
│  ┌─────────┐ ┌───────────┐  │
│  │ Backend │ │ Frontend  │  │  Parallel jobs
│  │ checks  │ │ checks    │  │
│  └─────────┘ └───────────┘  │
│  ┌──────────────────────┐   │
│  │ Security audit       │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
       │ CI pass + PR approved
       ▼
  Merge vào main
       │
       ▼
┌─────────────────────────────────────────┐
│        CD Workflow                       │  on: push to main
│                                          │
│  1. Prisma migrate deploy (Neon)         │  GitHub-hosted runner
│  2. Build & deploy backend (Pi)          │  Self-hosted runner (Pi)
│  3. Deploy frontend (Cloudflare Pages)   │  Via GitHub integration / wrangler
│  4. Post-deploy health check             │
└─────────────────────────────────────────┘
```

**GitHub Actions Workflows hiện có:**

| File | Trigger | Mục đích |
|------|---------|---------|
| `.github/workflows/ci.yml` | push + PR | Backend lint/build/test, Frontend lint/type/build/E2E |
| `.github/workflows/deploy-backend.yml` | push to main (backend/**) | Migrate Neon + deploy lên Pi |
| `.github/workflows/neon-preview-branches.yml` | PR opened/closed | Tạo/xóa Neon preview branch |
| `.github/workflows/ai-code-review.yml` | PR | AI code review tự động |

---

## 2. CI Workflow — Kiểm tra chất lượng

**Trigger:**
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

**Concurrency** — hủy run cũ khi có push mới cùng branch:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Job 1: Backend checks

**Runner:** `ubuntu-latest`  
**Working directory:** `./backend`

| Bước | Lệnh | Mục đích |
|------|------|---------|
| Checkout | `actions/checkout@v4` | Lấy code |
| Setup Node 20 | `actions/setup-node@v4` | Cache npm |
| Install | `npm ci` | Clean install từ lockfile |
| Prisma generate | `npx prisma generate` | Sinh Prisma client |
| Lint | `npm run lint` | ESLint kiểm tra code style |
| Build | `npm run build` | TypeScript compile |
| Unit tests | `npx jest --runInBand` | Chạy test tuần tự (tránh race condition) |
| Upload artifact | `actions/upload-artifact@v4` | Lưu `dist/` (chỉ khi merge main) |

> **Lưu ý:** `DATABASE_URL` và `DIRECT_URL` được set với giá trị localhost giả — unit tests không cần DB thật (mock Prisma).

### Job 2: Frontend checks

**Runner:** `ubuntu-latest`  
**Working directory:** `./frontend`

| Bước | Lệnh | Mục đích |
|------|------|---------|
| Checkout | `actions/checkout@v4` | Lấy code |
| Setup Node 20 | `actions/setup-node@v4` | Cache npm |
| Install | `npm ci` | Clean install |
| Lint | `npm run lint` | ESLint |
| Type check | `npx tsc --noEmit` | TypeScript type checking |
| Build | `npm run build` | Vite production build |
| Unit tests | `npm run test:unit` | Vitest unit tests |
| Cache Playwright | `actions/cache@v4` | Cache browser binaries |
| Install Playwright Chromium | `npx playwright install chromium --with-deps` | Đảm bảo browser version khớp |
| E2E tests | `npm run test:e2e` | **53 Playwright tests — CI quality gate** |
| Upload Playwright report | `actions/upload-artifact@v4` | Lưu report HTML khi fail |
| Upload artifact | `actions/upload-artifact@v4` | Lưu `dist/` (chỉ khi merge main) |

> **E2E là quality gate:** Playwright E2E 53 tests phải pass. Không xóa assertion để pass.

### Job 3: Security audit

**Runner:** `ubuntu-latest`

```bash
# Backend
npm audit --audit-level=high

# Frontend
npm audit --audit-level=high
```

`continue-on-error: true` — audit fail không block CI nhưng được ghi nhận.

### Job 4: CI Success (required check)

Job tổng hợp — branch protection check vào job này:

```yaml
ci-success:
  needs: [backend, frontend]
  runs-on: ubuntu-latest
  if: always()
  steps:
    - name: Check all jobs passed
      run: |
        if [[ "${{ needs.backend.result }}" != "success" ]] || \
           [[ "${{ needs.frontend.result }}" != "success" ]]; then
          echo "One or more jobs failed"
          exit 1
        fi
```

---

## 3. CD Workflow — Deploy lên production

**Trigger:**
```yaml
on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - ".github/workflows/deploy-backend.yml"
  workflow_dispatch:
    inputs:
      skip_migrate:
        description: "Skip prisma migrate"
        type: boolean
        default: false
```

### Stage 1: Prisma migrate deploy (GitHub-hosted)

**Runner:** `ubuntu-latest` (GitHub infrastructure — đảm bảo kết nối tốt đến Neon)  
**Environment:** `production`

```bash
npm ci
npx prisma generate
npx prisma migrate deploy   # Idempotent — đã apply thì bỏ qua
```

Biến môi trường từ GitHub Secrets:
- `DATABASE_URL` = `secrets.PRODUCTION_DATABASE_URL` (Neon pooled)
- `DIRECT_URL` = `secrets.PRODUCTION_DIRECT_URL` (Neon direct — bắt buộc cho migrate)

> **Tại sao tách job migrate ra runner riêng?** Pi (self-hosted) đôi khi có mạng không ổn định. Migrate chạy trên GitHub-hosted runner đảm bảo Neon luôn reachable.

### Stage 2: Build & deploy backend (Self-hosted Pi)

**Runner:** `[self-hosted, diecast360-pi]`  
**Depends on:** `migrate` job thành công

Các bước:

1. **Checkout code** — lấy code mới nhất
2. **Setup Node 20** — tương thích với production
3. **Install & build:**
   ```bash
   # Phải set NPM_CONFIG_PRODUCTION=false để có devDependencies (@nestjs/cli)
   NPM_CONFIG_PRODUCTION=false NODE_ENV=development npm ci
   npm run build
   ```
4. **Verify build output:** Kiểm tra `dist/` tồn tại và không rỗng
5. **Sync artifact:**
   ```bash
   rsync -a --delete ./dist/ "${DEPLOY_REMOTE_PATH}/dist/"
   rsync -a ./package.json ./package-lock.json "${DEPLOY_REMOTE_PATH}/"
   rsync -a --delete ./prisma/ "${DEPLOY_REMOTE_PATH}/prisma/"
   ```
6. **Install prod deps + restart:**
   ```bash
   cd "${DEPLOY_REMOTE_PATH}"
   npm ci --omit=dev          # Chỉ production deps
   npx prisma generate         # Regenerate client
   sudo systemctl restart diecast360-api
   ```
7. **Health check:** Probe `GET http://127.0.0.1:${PORT}/api/v1/health` — retry 30 lần, interval 2s

### Stage 3: Deploy frontend (Cloudflare Pages)

Frontend được deploy tự động qua **GitHub integration với Cloudflare Pages**:

- Cloudflare Pages kết nối với GitHub repo
- Mỗi push lên `main` trigger build tự động trên Cloudflare
- Preview URLs tự động tạo cho mỗi PR (nếu cần)

**Cấu hình build trên Cloudflare Pages:**

| Setting | Giá trị |
|---------|---------|
| Framework preset | None (Vite) |
| Build command | `cd frontend && npm ci && npm run build` |
| Build output directory | `frontend/dist` |
| Root directory | `/` (monorepo root) |
| Node version | `20` |

**Environment variables (Production):**

```
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_MAX_SPINNER_FRAMES=48
VITE_PUBLIC_CATALOG_SHOP_ID=<shop-uuid>
```

**SPA routing (Cloudflare Pages `_redirects`):**

```
# frontend/public/_redirects
/*    /index.html    200
```

### Stage 4: Post-deploy health check

Tích hợp trong deploy job trên Pi:

```bash
HEALTH_RETRIES=30
HEALTH_INTERVAL_SEC=2

for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -sfS "http://127.0.0.1:${PORT}/api/v1/health" >/dev/null; then
    echo "Health check passed on attempt $i"
    break
  fi
  if [ "$i" -eq "$HEALTH_RETRIES" ]; then
    echo "ERROR: Health check failed after ${HEALTH_RETRIES} attempts"
    sudo systemctl --no-pager -l status diecast360-api || true
    journalctl -u diecast360-api -n 80 --no-pager || true
    exit 1
  fi
  sleep "${HEALTH_INTERVAL_SEC}"
done
```

---

## 4. Neon Preview Branches cho PR

**File:** `.github/workflows/neon-preview-branches.yml`

Khi mở PR, Neon tự động tạo database branch `preview/pr-<number>-<branch-name>`:

- Database schema được migrate trên branch preview
- PR build sử dụng database riêng biệt — không ảnh hưởng production
- Khi đóng/merge PR, branch Neon tự động xóa (hết hạn sau ~14 ngày)

**Yêu cầu:**
- Repo kết nối với Neon Console
- GitHub secrets: `NEON_PROJECT_ID`, `NEON_API_KEY`
- Fork PRs không chạy (thiếu secrets)

---

## 5. Environment-specific pipelines

### Development

```
Developer local → pnpm test → pnpm lint → pnpm build (thủ công)
```

Không có CI/CD tự động — developer tự chạy tests trước khi push.

### Staging (nếu có)

```
Push to develop branch
  → CI chạy (tất cả jobs)
  → Deploy backend lên staging server (separate self-hosted runner)
  → Deploy frontend lên Cloudflare Pages preview
  → Chạy smoke tests
```

Staging environment dùng:
- Neon staging DB branch
- Cloudflare Pages preview URL
- Staging-specific env vars

### Production

```
Merge PR vào main
  → CI pass (required)
  → CD: migrate → deploy Pi → deploy Cloudflare Pages → health check
```

---

## 6. Secrets management trong GitHub Actions

### GitHub repository secrets

Cấu hình tại `Settings > Secrets and variables > Actions`:

| Secret | Dùng ở | Mô tả |
|--------|--------|-------|
| `PRODUCTION_DATABASE_URL` | `migrate` job | Neon pooled URL cho runtime |
| `PRODUCTION_DIRECT_URL` | `migrate` job | Neon direct URL cho Prisma migrate |
| `DEPLOY_REMOTE_PATH` | `deploy` job | Path trên Pi, mặc định `/opt/diecast360-backend` |
| `NEON_PROJECT_ID` | Neon preview | ID project Neon |
| `NEON_API_KEY` | Neon preview | API key Neon |

### GitHub environment secrets (Environment: `production`)

Secrets được bảo vệ thêm bởi environment protection rules:

| Secret | Mô tả |
|--------|-------|
| `PRODUCTION_DATABASE_URL` | Như trên |
| `PRODUCTION_DIRECT_URL` | Như trên |

### Cloudflare Pages environment variables

Cấu hình trong Cloudflare Pages dashboard — không phải GitHub secrets:

| Variable | Môi trường |
|---------|-----------|
| `VITE_API_BASE_URL` | Production |
| `VITE_MAX_SPINNER_FRAMES` | Production |
| `VITE_PUBLIC_CATALOG_SHOP_ID` | Production |

### Nguyên tắc bảo mật

- **Không commit secrets** vào repo dù là `.env.example` có giá trị thật
- Secrets trên Pi nằm trong `backend/.env` — file này không được commit
- Rotate secrets ngay khi nghi ngờ lộ
- Neon URL có password — không paste vào Slack/issue public

---

## 7. Rollback procedure

### Rollback backend

**Phương án 1: Revert commit và redeploy (khuyến nghị)**

```bash
# Tìm commit trước đó
git log --oneline -10

# Revert commit gây lỗi
git revert <commit-hash> --no-edit
git push origin main

# CD tự động chạy lại và deploy version cũ
```

**Phương án 2: Rollback thủ công trên Pi**

```bash
# SSH vào Pi
ssh pi@raspberry-pi-hostname

# Xem systemd service status
sudo systemctl status diecast360-api
journalctl -u diecast360-api -n 100 --no-pager

# Checkout version cũ từ git
cd /opt/diecast360-backend
git log --oneline -5

# Nếu dùng rsync deploy (không có git trên DEPLOY_REMOTE_PATH):
# Restore từ backup (xem bên dưới)

# Restart service
sudo systemctl restart diecast360-api
```

**Phương án 3: Backup/restore trên Pi**

```bash
# Trước mỗi deploy, tạo backup (có thể thêm vào deploy workflow)
BACKUP_DIR="/opt/diecast360-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /opt/diecast360-backend/dist "$BACKUP_DIR/"

# Rollback từ backup
BACKUP_DIR="/opt/diecast360-backups/20260101_120000"
rsync -a "$BACKUP_DIR/dist/" /opt/diecast360-backend/dist/
sudo systemctl restart diecast360-api
```

### Rollback database migration

> **NGUY HIỂM:** Prisma không có built-in down migration. Chỉ rollback nếu thực sự cần thiết.

```bash
# Trên máy dev, kết nối trực tiếp vào Neon (DIRECT_URL)
# Xem migration history
cd backend
npx prisma migrate status

# Rollback bằng cách tạo migration mới đảo ngược thay đổi
# KHÔNG chỉnh sửa migration đã apply!
npx prisma migrate dev --name rollback_xxx_change
```

Với thay đổi additive (thêm cột, thêm bảng): thường không cần rollback DB.  
Với thay đổi destructive (xóa cột, đổi kiểu): cần migration đảo ngược.

### Rollback frontend (Cloudflare Pages)

```bash
# Qua Cloudflare Dashboard: Pages > Project > Deployments > Chọn version cũ > Rollback

# Hoặc qua wrangler CLI
npx wrangler pages deployment list --project-name=diecast360
npx wrangler pages deployment rollback <deployment-id> --project-name=diecast360
```

---

## 8. YAML examples đầy đủ

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

jobs:
  backend:
    name: Backend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - run: npm ci

      - name: Prisma generate
        run: npx prisma generate
        env:
          DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/diecast360'
          DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/diecast360'

      - run: npm run lint

      - run: npm run build

      - name: Unit tests
        run: npx jest --runInBand
        env:
          DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/diecast360'
          DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/diecast360'

      - uses: actions/upload-artifact@v4
        if: github.ref == 'refs/heads/main'
        with:
          name: backend-build
          path: backend/dist
          retention-days: 7

  frontend:
    name: Frontend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
      - run: npm run test:unit

      - uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('frontend/package-lock.json') }}

      - name: Install Playwright Chromium
        run: npx playwright install chromium --with-deps

      - name: E2E tests
        run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 14

  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Backend audit
        working-directory: ./backend
        run: npm audit --audit-level=high
        continue-on-error: true
      - name: Frontend audit
        working-directory: ./frontend
        run: npm audit --audit-level=high
        continue-on-error: true

  ci-success:
    name: CI Success
    needs: [backend, frontend]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Check all jobs passed
        run: |
          if [[ "${{ needs.backend.result }}" != "success" ]] || \
             [[ "${{ needs.frontend.result }}" != "success" ]]; then
            echo "One or more CI jobs failed"
            exit 1
          fi
          echo "All CI checks passed!"
```

### CD Workflow — Deploy Backend (`.github/workflows/deploy-backend.yml`)

> File đầy đủ đã có tại `.github/workflows/deploy-backend.yml`. Xem nội dung trong repo.

```yaml
name: Deploy backend (Pi)

on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - ".github/workflows/deploy-backend.yml"
  workflow_dispatch:
    inputs:
      skip_migrate:
        description: "Skip prisma migrate"
        required: false
        default: false
        type: boolean

concurrency:
  group: deploy-backend-${{ github.ref }}
  cancel-in-progress: true

jobs:
  migrate:
    name: Prisma migrate (production)
    runs-on: ubuntu-latest
    environment: production
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - name: Prisma generate & migrate deploy
        if: ${{ !fromJSON(github.event.inputs.skip_migrate || 'false') }}
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          DIRECT_URL: ${{ secrets.PRODUCTION_DIRECT_URL }}
        run: |
          npx prisma generate
          npx prisma migrate deploy

  deploy:
    name: Build & deploy on Pi
    needs: migrate
    runs-on: [self-hosted, diecast360-pi]
    environment: production
    env:
      DEPLOY_REMOTE_PATH: ${{ secrets.DEPLOY_REMOTE_PATH }}
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - name: Install & build
        env:
          NPM_CONFIG_PRODUCTION: "false"
          NODE_ENV: development
        run: |
          npm ci
          npm run build
      - name: Verify build output
        run: |
          test -d dist
          test -n "$(find dist -type f -print -quit)"
      - name: Sync to deploy directory
        run: |
          REDIR="${DEPLOY_REMOTE_PATH:-/opt/diecast360-backend}"
          mkdir -p "${REDIR}/dist" "${REDIR}/prisma"
          rsync -a --delete ./dist/ "${REDIR}/dist/"
          rsync -a ./package.json ./package-lock.json "${REDIR}/"
          rsync -a --delete ./prisma/ "${REDIR}/prisma/"
      - name: Install prod deps, generate, restart
        run: |
          REDIR="${DEPLOY_REMOTE_PATH:-/opt/diecast360-backend}"
          cd "$REDIR"
          source .env 2>/dev/null || true
          PORT="${PORT:-3000}"
          npm ci --omit=dev
          npx prisma generate
          sudo systemctl restart diecast360-api
          for i in $(seq 1 30); do
            curl -sfS "http://127.0.0.1:${PORT}/api/v1/health" >/dev/null && break
            [ "$i" -eq 30 ] && exit 1
            sleep 2
          done
```

---

## 9. Deployment notifications

### Slack notification (optional)

Thêm job notification sau deploy thành công:

```yaml
  notify:
    name: Notify deployment
    needs: [migrate, deploy]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify Slack on success
        if: needs.deploy.result == 'success'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Diecast360 deployed successfully to production",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Backend deployed to Pi. Commit: ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      - name: Notify Slack on failure
        if: needs.deploy.result == 'failure' || needs.migrate.result == 'failure'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "ALERT: Diecast360 deployment FAILED",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Deployment failed. Check: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Email notification (GitHub built-in)

GitHub Actions tự gửi email khi workflow fail cho người push/author PR. Không cần cấu hình thêm.

---

## Tài liệu liên quan

- [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) — CI workflow thực tế
- [`.github/workflows/deploy-backend.yml`](../../../.github/workflows/deploy-backend.yml) — CD workflow thực tế
- [`docs/BACKEND_SELF_HOSTED_RUNNER.md`](../../BACKEND_SELF_HOSTED_RUNNER.md) — Setup self-hosted runner trên Pi
- [`docs/project-docs/group5-devops/29_deployment_guide.md`](29_deployment_guide.md) — Deployment guide chi tiết
- [`docs/project-docs/group5-devops/30_environment_config_guide.md`](30_environment_config_guide.md) — Environment config

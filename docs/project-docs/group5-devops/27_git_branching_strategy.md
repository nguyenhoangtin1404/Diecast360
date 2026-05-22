---
title: "Git Branching Strategy & Workflow"
version: "1.0"
date: "2026-05-22"
author: "DevOps Team"
---

# File 27 — Git Branching Strategy & Workflow

## Mục lục

1. [Tổng quan chiến lược](#1-tổng-quan-chiến-lược)
2. [Main branches](#2-main-branches)
3. [Supporting branches](#3-supporting-branches)
4. [Workflow chi tiết](#4-workflow-chi-tiết)
5. [Commit message convention](#5-commit-message-convention)
6. [PR Template](#6-pr-template)
7. [Code Review Checklist](#7-code-review-checklist)
8. [Tag & Release convention](#8-tag--release-convention)
9. [Branch protection rules](#9-branch-protection-rules)
10. [Ví dụ thực tế](#10-ví-dụ-thực-tế)

---

## 1. Tổng quan chiến lược

Diecast360 dùng **GitFlow** được đơn giản hóa, phù hợp với team nhỏ và deployment thường xuyên.

```
main ─────────────────────────────────────────────── production-ready
  │
  └── develop ────────────────────────────────────── integration branch
        │
        ├── feature/DC-101-add-ai-draft
        ├── fix/DC-102-refresh-token-race
        ├── chore/bump-prisma-6.2
        └── release/v1.2.0
```

**Nguyên tắc cốt lõi:**
- `main` luôn deployable — chỉ merge qua PR được review
- `develop` là nơi tích hợp feature trước khi ra `main`
- Feature branches sống ngắn (< 5 ngày) — chia nhỏ nếu lớn hơn
- Không force push lên `main` hoặc `develop`
- Mỗi PR phải pass CI trước khi merge

---

## 2. Main branches

### `main`

- **Mục đích:** Production-ready code. Mọi commit trên `main` đều có thể deploy.
- **Nguồn gốc:** Chỉ merge từ `release/*` hoặc `hotfix/*`
- **Bảo vệ:** Branch protection bật — yêu cầu PR + CI pass + ít nhất 1 approval
- **Tag:** Mỗi merge lên `main` kèm tag `vX.Y.Z`

### `develop`

- **Mục đích:** Integration branch — nơi các feature hội tụ trước khi release
- **Nguồn gốc:** Feature, fix, chore branches merge vào đây
- **Bảo vệ:** Yêu cầu PR + CI pass

---

## 3. Supporting branches

### Quy ước đặt tên

| Loại | Pattern | Ví dụ |
|------|---------|-------|
| Feature | `feature/DC-XXX-short-description` | `feature/DC-101-add-ai-draft-endpoint` |
| Bug fix | `fix/DC-XXX-short-description` | `fix/DC-102-refresh-token-rotation` |
| Hotfix | `hotfix/DC-XXX-short-description` | `hotfix/DC-115-preorder-status-stuck` |
| Release | `release/vX.Y.Z` | `release/v1.2.0` |
| Maintenance | `chore/description` | `chore/bump-prisma-6.2` |
| Docs | `docs/description` | `docs/update-api-contract-preorder` |
| AI-generated | `claude/description` | `claude/relaxed-borg-a3aed5` |

### `feature/DC-XXX-*`

- **Tạo từ:** `develop`
- **Merge vào:** `develop`
- **Vòng đời:** Xóa sau khi merge
- **Dùng cho:** Tính năng mới, enhancement

```bash
git checkout develop
git pull origin develop
git checkout -b feature/DC-101-add-ai-draft-endpoint
```

### `fix/DC-XXX-*`

- **Tạo từ:** `develop`
- **Merge vào:** `develop`
- **Dùng cho:** Bug fix không khẩn cấp, phát hiện trong dev/testing

```bash
git checkout develop
git pull origin develop
git checkout -b fix/DC-102-refresh-token-rotation
```

### `hotfix/DC-XXX-*`

- **Tạo từ:** `main` (vì bug ở production)
- **Merge vào:** `main` VÀ `develop` (để không mất fix)
- **Dùng cho:** Lỗi nghiêm trọng trên production cần vá ngay

```bash
git checkout main
git pull origin main
git checkout -b hotfix/DC-115-preorder-status-stuck

# Sau khi fix xong:
# 1. Merge vào main (tạo tag)
# 2. Merge vào develop
```

### `release/vX.Y.Z`

- **Tạo từ:** `develop`
- **Merge vào:** `main` và `develop`
- **Dùng cho:** Chuẩn bị release — chỉ cho phép bug fix, không thêm feature mới

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Chỉ fix bugs, cập nhật version, CHANGELOG
# Không thêm feature mới

# Sau khi sẵn sàng:
# 1. Merge vào main + tag v1.2.0
# 2. Merge ngược lại develop
```

### `chore/*`

- **Tạo từ:** `develop`
- **Merge vào:** `develop`
- **Dùng cho:** Cập nhật dependencies, cấu hình CI, refactoring không ảnh hưởng logic

### `claude/*`

- **Tạo từ:** Bất kỳ branch nào (thường `develop` hoặc `main`)
- **Tạo bởi:** Claude Code (AI assistant)
- **Xử lý:** Developer review output trước khi merge — không tự động merge

---

## 4. Workflow chi tiết

### 4.1 Feature development flow

```
1. Tạo branch từ develop
   └─ git checkout -b feature/DC-XXX-feature-name develop

2. Phát triển + commit (Conventional Commits)
   └─ git commit -m "feat(items): add ai draft endpoint"

3. Push + mở PR về develop
   └─ git push origin feature/DC-XXX-feature-name
   └─ gh pr create --base develop

4. Code review (ít nhất 1 approval)
   └─ Reviewer check code + CI pass

5. Merge (squash merge hoặc merge commit)
   └─ Squash nếu PR nhỏ/WIP commits nhiều
   └─ Merge commit nếu cần preserve history

6. Xóa branch
   └─ git branch -d feature/DC-XXX-feature-name
   └─ git push origin --delete feature/DC-XXX-feature-name
```

### 4.2 Hotfix flow

```
1. Tạo branch từ main
   └─ git checkout -b hotfix/DC-XXX-desc main

2. Fix + commit
   └─ git commit -m "fix(preorders): status machine bypass on concurrent update"

3. Mở PR về main
   └─ gh pr create --base main

4. Review nhanh (khẩn cấp — 1 approval vẫn bắt buộc)

5. Merge vào main + tag
   └─ git tag -a v1.1.1 -m "hotfix: preorder status race condition"

6. Merge vào develop
   └─ gh pr create --base develop --head hotfix/DC-XXX-desc

7. Xóa hotfix branch
```

### 4.3 Release flow

```
1. Tạo release branch từ develop
   └─ git checkout -b release/v1.2.0 develop

2. Bump version, cập nhật CHANGELOG
   └─ Chỉ fix bug, KHÔNG thêm feature

3. Mở PR về main
   └─ CI pass + 2 approvals

4. Merge vào main + tag v1.2.0

5. Merge ngược vào develop
   └─ Để develop có version bump + fixes

6. Xóa release branch
```

### 4.4 Syncing develop → feature branch

Khi feature branch tồn tại lâu, cần rebase hoặc merge từ develop:

```bash
# Option A: Rebase (lịch sử gọn — khuyến nghị cho feature ngắn)
git checkout feature/DC-101-add-ai-draft
git fetch origin
git rebase origin/develop

# Option B: Merge (safe hơn cho branch lớn)
git checkout feature/DC-101-add-ai-draft
git merge origin/develop
```

> **Lưu ý:** Không rebase branch đã được push và shared với người khác. Dùng merge trong trường hợp đó.

---

## 5. Commit message convention

Diecast360 tuân theo **Conventional Commits** (https://www.conventionalcommits.org).

### Định dạng

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Dùng khi |
|------|---------|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa bug |
| `chore` | Maintenance, deps, config |
| `docs` | Cập nhật tài liệu |
| `refactor` | Refactor không thêm feature/fix bug |
| `test` | Thêm hoặc sửa test |
| `perf` | Cải thiện hiệu năng |
| `ci` | Thay đổi CI/CD pipeline |
| `style` | Formatting, không thay đổi logic |
| `revert` | Revert commit trước |

### Scopes (Diecast360)

| Scope | Module |
|-------|--------|
| `auth` | Authentication, JWT, cookie |
| `items` | Item CRUD, AI draft |
| `images` | Image upload, signed URL |
| `spinner` | 360 spinner upload/view |
| `preorders` | Pre-order state machine |
| `members` | Member management, points |
| `inventory` | Inventory ledger |
| `reports` | Reporting |
| `shops` | Shop/tenant management |
| `categories` | Category management |
| `ai` | AI features |
| `public` | Public catalog |
| `storage` | Local/R2 storage |
| `deps` | Dependency updates |
| `ci` | CI/CD |
| `api` | API contract changes |

### Ví dụ commit messages

```bash
# Feature
feat(items): add ai draft endpoint for auto-generating descriptions

# Bug fix (với issue reference)
fix(auth): refresh token not rotating on concurrent requests

Fixes DC-102. Race condition when two tabs refresh simultaneously.
Token rotation now uses optimistic locking via updatedAt comparison.

# Dependency update (từ Dependabot)
chore(deps): bump prisma from 6.1.0 to 6.2.0 in /backend

# Docs
docs(api): update preorder status transitions in API_CONTRACT.md

# Breaking change
feat(auth)!: remove Bearer token support for web clients

BREAKING CHANGE: JWT_ALLOW_AUTHORIZATION_BEARER now defaults to false.
Web clients must use HttpOnly cookies. API clients must update docs.

# CI
ci: add Playwright E2E to GitHub Actions workflow

# Chore
chore(deps-dev): bump autoprefixer from 10.4.23 to 10.5.0 in /frontend

# Multi-scope
fix(preorders,members): deduct points only on PAID transition
```

### Quy tắc subject line

- Viết thường (lowercase) sau `:`
- Không kết thúc bằng dấu chấm
- Tối đa 72 ký tự
- Dùng động từ ở thì hiện tại: "add", "fix", "update", không phải "added", "fixed"

---

## 6. PR Template

Tạo file `.github/pull_request_template.md`:

```markdown
## Mô tả thay đổi

<!-- Giải thích ngắn gọn tại sao thay đổi này cần thiết -->

## Loại thay đổi

- [ ] Bug fix (sửa lỗi, không breaking change)
- [ ] New feature (thêm tính năng, không breaking change)
- [ ] Breaking change (thay đổi ảnh hưởng backward compatibility)
- [ ] Documentation update
- [ ] Refactor / chore

## Liên quan

- Issue: DC-XXX
- PR liên quan: #XXX

## Kiểm tra thay đổi

<!-- Mô tả cách bạn đã test -->

- [ ] Thử thủ công trên local
- [ ] Đã chạy `pnpm lint` không có lỗi mới
- [ ] Đã chạy `pnpm test` pass
- [ ] Playwright E2E pass (nếu thay đổi liên quan đến flow đã có test)

## Checklist

- [ ] Code tuân theo style của codebase
- [ ] Đã cập nhật `docs/API_CONTRACT.md` (nếu thay đổi API shape)
- [ ] Đã cập nhật `docs/DOMAIN.md` (nếu thay đổi business logic)
- [ ] Không commit `.env` hoặc secret
- [ ] Migration mới (nếu có) không chỉnh sửa migration đã apply
- [ ] Không có `console.log` debug còn sót lại

## Screenshot (nếu có UI changes)

<!-- Paste screenshot trước/sau -->
```

---

## 7. Code Review Checklist

### Dành cho Reviewer

**Correctness:**
- [ ] Logic có đúng với yêu cầu không?
- [ ] Edge cases được xử lý (null, empty, concurrent)?
- [ ] Pre-order state machine chỉ cho phép transition hợp lệ?
- [ ] Multi-tenant: query có filter `shop_id` không?
- [ ] Member points thay đổi qua ledger, không mutate trực tiếp?

**Security:**
- [ ] Input validation đầy đủ (DTO, class-validator)?
- [ ] CSRF token có trên các mutating endpoint?
- [ ] Không lộ thông tin nhạy cảm trong response?
- [ ] RBAC guard đúng role (`shop_admin`, `shop_staff`, `platform_super`)?
- [ ] Không hardcode credential, URL, secret?

**Code quality:**
- [ ] Không có abstraction thừa (single-use)?
- [ ] Không có feature không được yêu cầu (YAGNI)?
- [ ] Mỗi thay đổi trace về yêu cầu cụ thể?
- [ ] Không refactor code ngoài scope của PR?

**Database:**
- [ ] Migration mới (không edit applied migration)?
- [ ] Query có index phù hợp?
- [ ] N+1 query không?

**Tests:**
- [ ] Playwright test được update nếu flow liên quan thay đổi?
- [ ] Không xóa assertion để pass test?

**Docs:**
- [ ] `API_CONTRACT.md` được update nếu thay đổi request/response?
- [ ] `DOMAIN.md` được update nếu thay đổi business rules?

### Dành cho Author

- Tự review diff trước khi request review
- Giải thích lý do các quyết định thiết kế trong PR description hoặc comment
- Respond với tất cả review comments (resolve hoặc discuss)
- Không merge khi còn unresolved threads

---

## 8. Tag & Release convention

### Semantic Versioning

Format: `vMAJOR.MINOR.PATCH`

| Version | Khi nào tăng |
|---------|-------------|
| MAJOR (v**X**.0.0) | Breaking change, incompatible API |
| MINOR (v1.**X**.0) | Tính năng mới, backward compatible |
| PATCH (v1.0.**X**) | Bug fix, hotfix |

### Tạo tag

```bash
# Annotated tag (khuyến nghị — có message và author)
git tag -a v1.2.0 -m "Release v1.2.0: AI draft, R2 storage cutover"
git push origin v1.2.0

# List tags
git tag -l "v*" --sort=-v:refname

# Xem thông tin tag
git show v1.2.0
```

### GitHub Release

Sau khi tag, tạo GitHub Release với:
- **Tag:** `v1.2.0`
- **Title:** `v1.2.0 — Tên release ngắn gọn`
- **Body:** Danh sách thay đổi (CHANGELOG excerpt), migration notes, breaking changes

```bash
# Tạo release qua gh CLI
gh release create v1.2.0 \
  --title "v1.2.0 — AI Draft & R2 Storage" \
  --notes-file CHANGELOG.md \
  --target main
```

### Pre-release / Beta

```bash
# Pre-release tag
git tag -a v1.2.0-beta.1 -m "Beta: AI draft feature"
git push origin v1.2.0-beta.1

# GitHub release (đánh dấu là pre-release)
gh release create v1.2.0-beta.1 --prerelease
```

---

## 9. Branch protection rules

### Cấu hình trên GitHub (Settings > Branches)

**`main` branch:**

```
Branch name pattern: main

Protect matching branches:
  [x] Require a pull request before merging
      Required approvals: 1 (tối thiểu)
  [x] Require status checks to pass before merging
      Required checks:
        - CI / Backend
        - CI / Frontend
        - CI / CI Success
  [x] Require branches to be up to date before merging
  [x] Require conversation resolution before merging
  [x] Do not allow bypassing the above settings
  [x] Restrict who can push to matching branches: (maintainers only)

  [ ] Allow force pushes  ← KHÔNG bật
  [ ] Allow deletions     ← KHÔNG bật
```

**`develop` branch:**

```
Branch name pattern: develop

Protect matching branches:
  [x] Require a pull request before merging
      Required approvals: 1
  [x] Require status checks to pass before merging
      Required checks:
        - CI / Backend
        - CI / Frontend
  [x] Require conversation resolution before merging

  [ ] Allow force pushes  ← KHÔNG bật
```

---

## 10. Ví dụ thực tế

### Scenario 1: Thêm tính năng mới

```bash
# 1. Bắt đầu từ develop mới nhất
git checkout develop
git pull origin develop

# 2. Tạo feature branch
git checkout -b feature/DC-201-member-tier-upgrade

# 3. Phát triển
# ... code ...
git add backend/src/members/members.service.ts
git commit -m "feat(members): auto-upgrade tier when points threshold crossed"

git add backend/src/members/members.service.ts docs/DOMAIN.md
git commit -m "docs(domain): document member tier upgrade rules"

# 4. Push và mở PR
git push origin feature/DC-201-member-tier-upgrade
gh pr create --base develop \
  --title "feat(members): auto-upgrade member tier on points threshold" \
  --body "..."

# 5. Sau khi merge, xóa branch
git branch -d feature/DC-201-member-tier-upgrade
git push origin --delete feature/DC-201-member-tier-upgrade
```

### Scenario 2: Hotfix khẩn cấp

```bash
# 1. Từ main (production code)
git checkout main
git pull origin main
git checkout -b hotfix/DC-999-preorder-stuck-pending

# 2. Fix
git commit -m "fix(preorders): stuck in PENDING when confirmation webhook fails"

# 3. PR về main (gấp — 1 reviewer)
gh pr create --base main

# 4. Sau khi merge vào main, tag
git checkout main && git pull
git tag -a v1.1.1 -m "hotfix: preorder stuck in PENDING"
git push origin v1.1.1

# 5. Merge fix vào develop
git checkout develop && git pull
git merge main
git push origin develop
# Hoặc mở PR riêng: gh pr create --base develop --head hotfix/DC-999-...
```

### Scenario 3: Release

```bash
# 1. Tạo release branch từ develop
git checkout develop && git pull
git checkout -b release/v1.3.0

# 2. Cập nhật version
# Chỉnh package.json version
# Cập nhật CHANGELOG.md

git commit -m "chore(release): bump version to 1.3.0"

# 3. Nếu phát hiện bug nhỏ, fix tại đây
git commit -m "fix(spinner): frame index validation off-by-one"

# 4. Merge vào main
gh pr create --base main --title "release: v1.3.0"
# Sau khi approve + merge:
git checkout main && git pull
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin v1.3.0

# 5. Merge ngược vào develop
git checkout develop
git merge main
git push origin develop
```

---

## Tài liệu liên quan

- [`CLAUDE.md`](../../CLAUDE.md) — Coding guidelines
- [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) — PR template
- [`docs/project-docs/group5-devops/28_cicd_pipeline.md`](28_cicd_pipeline.md) — CI/CD pipeline

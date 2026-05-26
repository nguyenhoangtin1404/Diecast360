# 2026-05-26 — Production `uploads/` wiped by deploy workflow

**Severity:** SEV-2 (user data loss, no auth/payment impact)
**Status:** Mitigated by PR #280 (workflow fix). Data recovery in progress.
**Authors:** Cursor Agent + nguyenhoangtin1404

## TL;DR

Sau khi PR #250 (`ci: pnpm-first pipelines, gated Pi deploy, and hygiene workflows`) merge, `deploy-backend.yml` chuyển sang `rsync -a --delete --exclude='.env'` ở mức **gốc** của `DEPLOY_REMOTE_PATH` (`/opt/diecast360-backend`). Vì `backend/.env.production.example` mặc định đặt `UPLOAD_DIR="/opt/diecast360-backend/uploads"` — **nằm trong** thư mục đó — bundle từ `pnpm deploy --prod --legacy` (không có `uploads/`) khiến rsync `--delete` xoá toàn bộ media người dùng trên mỗi lần backend deploy. 9 deploy chạy trước khi phát hiện. Database vẫn còn metadata + `file_path`, nhưng file ảnh/spinner/branding biến mất → public catalog 404 mọi signed media URL.

> **Recurrence note:** Đây là lần **thứ hai** trong 2026 mất sạch `UPLOAD_DIR` vì không có backup. Lần trước: [`2026-pi-ssd-failure.md`](2026-pi-ssd-failure.md) (hardware fail). Cùng root cause vận hành (no automated backup) — 2 đường khác nhau cùng dẫn tới mất data. Action item "backup tự động + test restore" còn open từ sự cố SSD trước đó là **contributing factor lớn nhất** của thiệt hại lần này.

## Impact

- **Data lost:** mọi file dưới `UPLOAD_DIR` tại thời điểm deploy đầu tiên sau PR #250 (item images, thumbnails, 360° spinner frames, shop branding logo + favicon, drafts AI image import).
- **Database:** không ảnh hưởng. Tất cả record (`item_images`, `spin_sets`, `spin_frames`, `shops.logo_url`, `shops.favicon_url`) còn nguyên `file_path`.
- **User-facing:** trang public + admin hiển thị ảnh vỡ. Browser console:
  ```
  GET https://api.nhtin.name.vn/api/v1/media?d=…&s=… 404 (Not Found)
  ```
- **Time-to-detection:** ~10 giờ (PR #250 merged 04:11 UTC+7, phát hiện ~14:00 UTC+7).
- **Time-to-mitigation:** ~30 phút sau khi phát hiện (PR #280).
- **Financial:** xem framework tính ở `docs/POSTMORTEMS/2026-05-26-uploads-wiped.md` section *Cost estimate* (cần input số liệu từ owner).

## Timeline (UTC+7, 2026-05-26)

| Time | Event |
|---|---|
| 04:11 | PR #250 merged to `main`. CI green. |
| 04:14 | First `Deploy backend (Pi)` workflow run; `rsync --delete` wipes `/opt/diecast360-backend/uploads/` for the first time. App restarts, `/api/v1/health` green. |
| 04:14 – 12:01 | 8 thêm deploy chạy (Dependabot bumps + #250 merge). Mỗi lần `rsync --delete` chạy lại trên thư mục rỗng + restart app, ghi đè inode đã giải phóng. |
| ~14:00 | User phát hiện ảnh vỡ trên trang production, console log 401 (`/auth/me`, harmless) + 404 (`/media?...`). |
| 14:10 | Investigation start. Pull main, đọc `deploy-backend.yml` + `signed-media.util.ts` + `media.controller.ts`. |
| 14:18 | Root cause confirmed: `rsync --delete` xoá `uploads/` vì `UPLOAD_DIR` nằm trong `REDIR`. |
| 14:23 | PR #280 mở (branch `cursor/fix-deploy-rsync-wipes-uploads`). |
| 14:30 | PR #280 merged. Production deploy tiếp theo sẽ không xoá `uploads/` (qua `--exclude`) ngay cả khi operator chưa di chuyển `UPLOAD_DIR`. |
| — | Recovery: ext4 `extundelete` / `testdisk` hoặc tái upload từ nguồn gốc (chưa kết thúc tại thời điểm viết). |

## Root cause

`rsync -a --delete --exclude='.env'` ở mức gốc của `DEPLOY_REMOTE_PATH`. Bundle nguồn (`pnpm deploy --prod --legacy`) chỉ chứa runtime files (`package.json`, `node_modules/`, `dist/`, `prisma/`). Thư mục `uploads/` nằm trong `DEPLOY_REMOTE_PATH` nhưng không có trong bundle → bị `--delete` xoá mỗi deploy.

```yaml
# .github/workflows/deploy-backend.yml (BEFORE PR #280)
rsync -a --delete --exclude='.env' "${{ steps.bundle.outputs.path }}/" "${REDIR}/"
```

## Contributing factors

1. **Layout coupling:** `backend/.env.production.example` đặt `UPLOAD_DIR` **trong** `DEPLOY_REMOTE_PATH`. Documentation drift — sample env và workflow assumption không khớp.
2. **Workflow PR quá rộng:** PR #250 gộp 4–5 mục tiêu (pnpm-first, gated deploy, hygiene workflows, dependabot config, lockfile cleanup). Dòng rsync `--delete` mức gốc bị nuốt giữa hàng trăm dòng diff khó review.
3. **Health check không touch storage:** `GET /api/v1/health` không kiểm `UPLOAD_DIR` non-empty hoặc fetch thử 1 signed media URL → deploy "thành công" theo CI dù dữ liệu mất.
4. **Không có backup tự động** cho `UPLOAD_DIR`. Không có 3-2-1, không có offsite.
5. **Không có staging** Pi giả lập để thử workflow thay đổi trước khi đụng production.
6. **`workflow_run` trigger đa tầng:** Mỗi merge vào main (kể cả Dependabot) đều fire deploy → tần suất ghi đè cao → ext4 recovery khó hơn.

## Detection

User phát hiện qua DevTools console. Không có alert tự động.

## Recovery

(Đang triển khai — sẽ cập nhật vào section này.)

Quy trình theo `docs/RUNBOOKS/data-loss-incident.md`:
1. `sudo systemctl stop diecast360-api` ngừng ghi đĩa.
2. Thử `extundelete` / `testdisk` trên ext4. Xác suất giảm do 9 deploy đã chạy.
3. Khi không recover được: tái upload từ nguồn gốc; DB `file_path` vẫn dùng được nếu key trùng.

## Action items

| # | Action | Owner | Status | Reference |
|---|---|---|---|---|
| 1 | Workflow exclude `/uploads`, env example chuyển `UPLOAD_DIR` ra `/var/lib/diecast360/uploads` | Cursor Agent | ✅ Done | PR #280 |
| 2 | Operator di chuyển `UPLOAD_DIR` thực tế trên Pi ra ngoài `REDIR` | nguyenhoangtin1404 | Pending | Section *Operator follow-up* trong PR #280 |
| 3 | Defensive rsync guardrails (`--max-delete`, dry-run preview, sanity check UPLOAD_DIR) | Cursor Agent | Planned | PR `cursor/harden-deploy-rsync-guardrails` (sắp mở) |
| 4 | Postmortem + runbook + invariants vào knowledge base | Cursor Agent | In PR | PR này |
| 5 | Backup tự động `UPLOAD_DIR` (restic → R2 + USB), test restore quarterly | nguyenhoangtin1404 | Planned | `docs/RUNBOOKS/backup.md` |
| 6 | Health check probe signed media URL thực tế trên Pi sau deploy | TBD | Planned | TBD |
| 7 | Staging Pi (container/VM) để thử CI/CD trước production | TBD | Backlog | TBD |
| 8 | Branch protection require 1 reviewer cho PR đụng `.github/workflows/deploy-*.yml` | nguyenhoangtin1404 | Planned | GitHub settings |

## Lessons (xem chi tiết tại commit message PR #280 và phần "5. Diecast360-specific invariants" trong `CLAUDE.md`)

1. **Tách artifact (`/opt/<app>`) khỏi state (`/var/lib/<app>`).** Không bao giờ đặt user data trong thư mục bị deploy ghi đè.
2. **`rsync --delete` ở root là vũ khí.** Dùng kèm `--max-delete=N` hoặc giới hạn vào subdir đã biết.
3. **Backup là không tuỳ chọn cho production.** 3-2-1, test restore.
4. **CI/CD change đụng production phải staging hoặc dry-run trước.**
5. **Health check phải đụng storage thực** — `/health` JSON không đủ.
6. **PR đụng deploy phải hẹp scope** — dễ review từng dòng `rsync`/`rm`/`--delete`.
7. **Nghi data loss → STOP service trước, điều tra sau** (bảo toàn inode ext4).

## References

- PR #250 (gây): https://github.com/nguyenhoangtin1404/Diecast360/pull/250
- PR #280 (vá): https://github.com/nguyenhoangtin1404/Diecast360/pull/280
- Postmortem trước (cùng pattern data loss): [`2026-pi-ssd-failure.md`](2026-pi-ssd-failure.md)
- Runbook: [`docs/RUNBOOKS/data-loss-incident.md`](../RUNBOOKS/data-loss-incident.md)
- Backup strategy: [`docs/RUNBOOKS/backup.md`](../RUNBOOKS/backup.md)
- Invariants: [`CLAUDE.md`](../../CLAUDE.md) §5, [`AGENTS.md`](../../AGENTS.md) §Key gotchas

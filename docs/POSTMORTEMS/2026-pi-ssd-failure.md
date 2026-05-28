# 2026 — Pi SSD failure, full disk loss

**Severity:** SEV-2 (full user-uploaded data loss, ~4h downtime)
**Status:** Resolved (Pi rebuilt from scratch). Action items still partially open.
**Date (approximate):** Mid 2026, sau khi DB đã chuyển sang Neon, trước sự cố [`2026-05-26-uploads-wiped`](2026-05-26-uploads-wiped.md). Date chính xác không ghi lại được tại thời điểm xảy ra — postmortem này viết hồi tố từ ký ức operator.

## TL;DR

Ổ SSD của Raspberry Pi production chết đột ngột (hardware failure, không phải lỗi software). Toàn bộ nội dung đĩa mất: OS, app artifact (`/opt/diecast360-backend`), `UPLOAD_DIR`, `.env`, cấu hình systemd/Cloudflare Tunnel/cron. Database trên **Neon** không bị ảnh hưởng nên giữ nguyên metadata. Không có backup tự động cho `UPLOAD_DIR` → toàn bộ ảnh/spinner/branding mất vĩnh viễn (phải tái upload từ nguồn gốc). Recovery kéo dài ~4h thủ công: flash OS mới, cài Node + pnpm + git, clone repo, build, viết lại `.env` từ trí nhớ + password manager, cấu hình lại Cloudflare Tunnel + systemd, khởi động lại API.

## Impact

- **Data lost:** mọi file dưới `UPLOAD_DIR` (item images, spinner frames, shop branding). Database không mất (đã ở Neon).
- **Downtime:** ~4 giờ từ lúc Pi không phản hồi tới lúc `/api/v1/health` trả 200 trở lại.
- **Cost (operator time):** 4h × labor rate. Re-upload sản phẩm sau đó tốn thêm nhiều giờ.
- **User-facing:** trang public hoàn toàn không truy cập được trong khoảng downtime (không phải chỉ ảnh vỡ). Sau khi backup online: ảnh vỡ 404 như sự cố tháng 5.
- **Brand:** mất uptime, có thể ảnh hưởng SEO / customer trust.

## Root cause

Hardware failure: ổ SSD trên Raspberry Pi ngừng phản hồi. Không có pre-failure indicator (SMART attributes không được monitor).

## Contributing factors

1. **Single point of failure:** toàn bộ production chạy trên 1 SD/SSD của 1 Pi, không có HA, không có hot standby.
2. **No automated backup:** `UPLOAD_DIR` chỉ tồn tại trên đĩa Pi. Không có copy tới USB external, không có sync tới R2/B2, không có snapshot.
3. **No SMART monitoring:** không có cảnh báo trước khi SSD chết. SSD trên consumer hardware có thể fail mà không warning, đặc biệt cheaper drives.
4. **No infrastructure-as-code:** mọi setup Pi (Node version, systemd unit, Cloudflare Tunnel config, firewall rule, cron) đều được làm thủ công. Khi rebuild phải nhớ từng bước → tốn thời gian + dễ sai sót.
5. **`.env` không có backup tách biệt:** secrets được viết lại từ trí nhớ + password manager, mất thời gian + rủi ro thiếu var.
6. **Pi consumer-grade hardware không phù hợp production-critical:** SD/SSD trên Pi không có endurance rating đảm bảo, kế hoạch capacity không tính tới fail rate.

## Timeline (approximate, reconstructed)

| Thời điểm | Sự kiện |
|---|---|
| T+0 | Pi ngừng phản hồi `ping` + Cloudflare Tunnel báo offline. |
| T+0:15 | Confirm bằng SSH thất bại + power-cycle không restart được. |
| T+0:30 | Xác định SSD/SD card chết (không boot, không nhận trong reader khác). |
| T+0:45 | Flash OS mới (Raspberry Pi OS 64-bit) lên SD/SSD thay thế. |
| T+1:30 | Cài Node 20 + corepack + pnpm + git. |
| T+2:00 | Clone repo, `pnpm install --frozen-lockfile`, `pnpm --filter ./backend build`. |
| T+2:30 | Viết lại `backend/.env` từ password manager + trí nhớ. |
| T+3:00 | Cấu hình lại systemd unit (`/etc/systemd/system/diecast360-api.service`). |
| T+3:30 | Cấu hình lại Cloudflare Tunnel (`cloudflared`). |
| T+3:45 | `prisma migrate deploy` (Neon đã có migration sẵn). |
| T+4:00 | `systemctl start diecast360-api`, `curl /api/v1/health` → 200. Public catalog: metadata hiện, ảnh 404 (chưa tái upload). |

## Lessons (reinforce + bổ sung so với sự cố 2026-05-26)

Bài học trùng với sự cố tháng 5:
- **Backup là không tuỳ chọn.** Hardware fail bất ngờ; software bug fail bất ngờ; cả hai cùng dẫn tới data loss nếu không có backup. 2 sự cố trong 1 năm vì cùng một thiếu sót.

Bài học bổ sung từ sự cố này:
- **Hardware single-point-of-failure phải có DR plan.** 1 Pi = 1 disk = 1 PSU = 1 SD/SSD chết là sập toàn bộ production.
- **Rebuild process phải scripted, không manual.** 4h thủ công là quá nhiều. Mục tiêu: <30 phút từ flash OS tới `/health` 200, với 1 script Ansible/bash provisioning + secrets từ password manager.
- **`.env` cần backup riêng** (mã hoá, offsite). Password manager (Bitwarden/1Password) lưu file attachment hoặc note multiline cho `.env` production.
- **SMART monitoring** trên Pi: cron 1 lần/giờ check `smartctl`, alert nếu pre-failure attribute xuất hiện. Cảnh báo trước 24–48h cho hardware-degradation phổ biến.
- **State migration sang R2** giảm dependency vào Pi disk: nếu uploads ở R2, Pi disk fail chỉ ảnh hưởng app process, không ảnh hưởng dữ liệu.

## Action items

| # | Action | Owner | Status | Reference |
|---|---|---|---|---|
| 1 | DB chuyển sang Neon | nguyenhoangtin1404 | ✅ Done (trước sự cố này) | — |
| 2 | Backup tự động `UPLOAD_DIR` (restic → R2 + USB) | nguyenhoangtin1404 | **Open — chưa làm** | [`docs/RUNBOOKS/backup.md`](../RUNBOOKS/backup.md) |
| 3 | `.env` production backup vào password manager (encrypted note/attachment) | nguyenhoangtin1404 | **Open** | TBD |
| 4 | Pi rebuild runbook + provisioning script (Ansible/bash) | TBD | **Open — chưa có** | `docs/RUNBOOKS/pi-rebuild.md` (chưa tồn tại) |
| 5 | SMART monitoring SSD + cron alert | TBD | **Open** | TBD |
| 6 | Cân nhắc cutover state sang R2 (giảm SPOF Pi disk) | nguyenhoangtin1404 | Backlog | [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md) §8 |
| 7 | Cân nhắc hot standby / failover Pi | nguyenhoangtin1404 | Backlog (cost trade-off) | TBD |

## References

- Postmortem cùng category (data loss, cùng thiếu backup): [`2026-05-26-uploads-wiped.md`](2026-05-26-uploads-wiped.md)
- Backup strategy: [`../RUNBOOKS/backup.md`](../RUNBOOKS/backup.md)
- Recovery runbook (live disk, ext4): [`../RUNBOOKS/data-loss-incident.md`](../RUNBOOKS/data-loss-incident.md) — **không áp dụng** cho disk chết hoàn toàn; cần `pi-rebuild.md` riêng.
- Invariants: [`../../CLAUDE.md`](../../CLAUDE.md) §5

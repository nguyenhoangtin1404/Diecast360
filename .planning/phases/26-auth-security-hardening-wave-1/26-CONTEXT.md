# Phase 26: Auth Security Hardening — Wave 1 — Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Source:** GitHub issues #232, #237, #243, #244, #246 (nhóm Wave 1 từ meta-issue #240)

---

## Phase boundary

Hoàn thiện lớp bảo vệ **anti brute-force** cho admin login theo thứ tự ưu tiên cao trong Wave 1 (issue #240):

1. **Login audit log + X-Trace-Id** (#232): Ghi log mọi sự kiện đăng nhập (success/failed) ra stdout JSON; sinh `trace_id` UUIDv7 gắn vào `X-Trace-Id` response header; optional persist vào bảng `login_audit_log` PostgreSQL để admin query.
2. **Email rate limit + account lockout** (#237): Giới hạn số lần thử login theo email (ví dụ 5 lần/15 phút); khóa tạm tài khoản khi vượt ngưỡng; tự động mở sau cooldown period.
3. **Admin UI xem login audit log + unlock** (#243): Trang admin xem danh sách login events, filter theo email/status/thời gian; nút unlock tài khoản bị khóa.
4. **Google reCAPTCHA v3 trên admin login** (#244): Tích hợp CAPTCHA ẩn (score-based) trên form login admin; backend verify token trước khi check credentials.
5. **Persist email rate-limit survive restart** (#246): Chuyển in-memory throttle state sang PostgreSQL hoặc file-based store để rate-limit không bị reset khi Pi restart.

Phạm vi: backend `auth/` module, `audit/` module mới, `admin/` rate-limit UI; không bao gồm Redis throttler (#239 — defer đến khi scale multi-instance) và Telegram alerts (#238 — Wave 2).

---

## Decisions (locked)

1. **MVP log store:** stdout JSON (fire-and-forget, không ảnh hưởng login latency < 10ms). DB persist (`login_audit_log`) là step 2 optional trong cùng phase.
2. **trace_id format:** UUIDv7 (time-ordered) sinh trước bất kỳ logic nào; trả về qua `X-Trace-Id` response header cho mọi `POST /auth/login` request.
3. **Rate-limit storage:** sử dụng PostgreSQL (không cần Redis) để survive Pi restart — đồng bộ với #246. Cột `login_attempt_count` + `locked_until` trên bảng mới hoặc trên `users`.
4. **CAPTCHA strategy:** Google reCAPTCHA v3 score-based (không hiện widget ẩn); backend reject nếu score < 0.5 và trả `CAPTCHA_FAILED` error code; threshold cấu hình qua env.
5. **Account lockout:** tự unlock sau `AUTH_LOCKOUT_DURATION_MINUTES` (mặc định 15 phút); admin có thể unlock sớm qua UI.
6. **Không log password hay token** dưới bất kỳ hình thức nào.
7. **Playwright E2E** cho lockout flow nằm trong Phase 27 (Wave 2 — issue #242).

---

## GitHub Issues

| Issue | Title | Scope |
|-------|-------|-------|
| #232 | Login audit log + X-Trace-Id tracing | Backend audit, stdout JSON, DB schema |
| #237 | Email rate limit + account lockout | Backend throttle service, PostgreSQL persist |
| #246 | Persist rate-limit (survive restart) | PostgreSQL-backed throttle store |
| #243 | Admin UI: login audit log + unlock | Frontend admin page, backend query API |
| #244 | Google reCAPTCHA v3 admin login | Frontend form, backend verify, ENV config |

---

## Depends on

- Phase 15 (admin RBAC — `shop_admin` guard trên audit API)
- Phase 21 (defense-in-depth headers — `X-Trace-Id` aligned với existing 4xx logging)

---

## Deferred ideas

- Redis distributed throttler (#239) — defer đến khi multi-instance.
- Telegram alerts (#238) — Wave 2, Phase 27.
- Playwright lockout/CAPTCHA E2E (#242) — Wave 2, Phase 27.

---

*Phase: 26-auth-security-hardening-wave-1*

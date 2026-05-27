# Phase 27: Auth Security Wave 2 — Alerting, E2E & Ops Checklist — Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Source:** GitHub issues #238, #242, #245, #289 (Wave 2 từ meta-issue #240)

---

## Phase boundary

Hoàn thiện lớp **phát hiện & phản ứng** cho bảo mật runtime, bao gồm:

1. **Telegram security alerts** (#238): Cảnh báo tấn công qua Telegram khi phát hiện brute-force, CAPTCHA fail liên tục, account lockout — với dedupe + ngưỡng để tránh spam.
2. **Playwright E2E security** (#242): Tự động hóa test luồng lockout, CAPTCHA bypass, rate limit, `X-Trace-Id` header verification.
3. **Production ops checklist** (#245): Document + automate bật Turnstile/CAPTCHA, Telegram webhook, migration bảo mật (sau Phase 26).
4. **CI/CD staging pipeline** (#289): Hoàn thiện staging branch workflow — còn mở sau Phase 25.

Phạm vi: backend alert service, Playwright tests, ops docs; không bao gồm Redis throttler (#239 — defer).

---

## Decisions (locked)

1. **Alert channel:** Telegram (phù hợp Pi single-instance; nhẹ hơn Slack). Bot token + chat_id qua ENV.
2. **Dedupe strategy:** in-memory `Map<alertKey, lastSentAt>` với TTL (ví dụ 5 phút); không cần Redis vì single-instance.
3. **Alert triggers:**
   - `account_locked`: email bị khóa
   - `captcha_failed_burst`: >= N CAPTCHA fail từ cùng IP trong window
   - `brute_force_detected`: >= M failed login từ cùng IP trong window
4. **Playwright E2E:** mock CAPTCHA score trong test env qua env var `RECAPTCHA_BYPASS_IN_TEST=true`.
5. **#289 staging:** align với workflow đã bắt đầu ở Phase 25 — hoàn thiện branch protection + status checks.

---

## GitHub Issues

| Issue | Title | Scope |
|-------|-------|-------|
| #238 | Telegram security alerts | Backend alert service, ENV config |
| #242 | Playwright E2E: lockout, CAPTCHA, rate limit | Frontend E2E, mock setup |
| #245 | Ops checklist production security | Docs, runbook, ENV checklist |
| #289 | CI/CD staging pipeline | GitHub Actions workflow |

---

## Depends on

- Phase 26 (login audit, rate limit, CAPTCHA — Wave 1 phải hoàn thành trước)
- Phase 23 (CI/CD baseline)
- Phase 25 (staging deploy baseline)

---

## Deferred ideas

- Redis distributed throttler (#239) — defer đến khi multi-instance.
- Slack alerts — defer; Telegram là MVP.

---

*Phase: 27-auth-security-wave-2-alerting-e2e-ops*

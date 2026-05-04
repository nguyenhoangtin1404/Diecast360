import axios from 'axios';
import { API_CONFIG } from '../config/api';

/**
 * Cross-site CSRF header support for cookie-based API auth.
 *
 * **Double-submit:** The API expects `X-CSRF-Token` to match the `csrf_token` cookie on each
 * mutating request. When the UI and API are on different sites, the cookie is set on the API
 * host and is not visible to `document.cookie` here, so we must copy the token from the JSON
 * body of `GET /api/v1/auth/csrf` into {@link memoryCsrfToken}.
 *
 * **XSS trade-off:** Any value used to build `X-CSRF-Token` is reachable from page JS if XSS
 * exists. Same-origin setups could already read the non-HttpOnly `csrf_token` from
 * `document.cookie`; cross-site relies on memory instead. Mitigate XSS (CSP, sanitization) —
 * this module does not widen impact beyond the need to send the header at all.
 *
 * **Per-tab state:** `memoryCsrfToken` and {@link csrfBootstrapInFlight} live in this JS realm
 * (typically one browser tab). Other tabs have their own copy; each tab should bootstrap after
 * auth. Concurrent calls within one tab share one in-flight bootstrap via {@link csrfBootstrapInFlight}.
 */
let memoryCsrfToken: string | undefined;

/** Coalesce concurrent bootstraps; one GET /auth/csrf in flight at a time. */
let csrfBootstrapInFlight: Promise<void> | null = null;

const CSRF_BOOTSTRAP_ATTEMPTS = 3;
const CSRF_BOOTSTRAP_BASE_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry on network errors, 5xx, or missing token in body; do not spin on 401/403. */
function shouldRetryCsrfBootstrap(err: unknown, attemptIndex: number): boolean {
  if (attemptIndex >= CSRF_BOOTSTRAP_ATTEMPTS - 1) return false;
  if (!axios.isAxiosError(err)) return true;
  const status = err.response?.status;
  if (status === 401 || status === 403) return false;
  if (!err.response) return true;
  return typeof status === 'number' && status >= 500;
}

export function clearMemoryCsrfToken(): void {
  memoryCsrfToken = undefined;
}

/** Parse wrapped ({ ok, data }) or raw ({ csrf_token }) API bodies from auth endpoints. */
export function extractCsrfTokenFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const o = body as Record<string, unknown>;
  if (typeof o.csrf_token === 'string' && o.csrf_token.length > 0) {
    return o.csrf_token;
  }
  const data = o.data;
  if (data && typeof data === 'object') {
    const t = (data as Record<string, unknown>).csrf_token;
    if (typeof t === 'string' && t.length > 0) return t;
  }
  return undefined;
}

export function rememberCsrfFromResponseBody(body: unknown): void {
  const t = extractCsrfTokenFromBody(body);
  if (t) memoryCsrfToken = t;
}

/**
 * Double-submit CSRF: readable cookie + X-CSRF-Token header (must match).
 * Prefer cookie when document.cookie can read it (same-origin dev); otherwise use memory from
 * GET /auth/csrf for cross-site API hosts (third-party cookie not visible to JS).
 */
export function readCsrfTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name !== 'csrf_token') continue;
    const raw = part.slice(idx + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

export function csrfHeaderPair(): Record<string, string> {
  /**
   * Token source order (do not reverse without security review):
   * 1. **Cookie** when readable — same-origin dev; matches the cookie the server sees.
   * 2. **Memory** — cross-site production; cookie is not in `document.cookie`.
   *
   * Edge case (same-origin only): if the server rotated `csrf_token` and the browser still
   * exposes an older first-party cookie value until the next response, cookie could briefly win
   * over a fresher `memoryCsrfToken`. Production cross-site UI never reads the API cookie from
   * JS, so only memory applies. Call {@link ensureCsrfBootstrap} after login / refresh / switch-shop
   * so memory stays aligned.
   */
  const token = readCsrfTokenFromCookie() || memoryCsrfToken;
  return token ? { 'X-CSRF-Token': token } : {};
}

/** Lấy CSRF từ backend (GET an toàn) và lưu token vào memory khi cookie là cross-site. */
export async function ensureCsrfBootstrap(): Promise<void> {
  if (csrfBootstrapInFlight) {
    return csrfBootstrapInFlight;
  }

  csrfBootstrapInFlight = (async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < CSRF_BOOTSTRAP_ATTEMPTS; attempt++) {
      try {
        const res = await axios.get(`${API_CONFIG.BASE_URL}/auth/csrf`, {
          withCredentials: true,
          timeout: 15000,
        });
        const token = extractCsrfTokenFromBody(res.data);
        if (token) {
          memoryCsrfToken = token;
          return;
        }
        lastError = new Error('CSRF bootstrap: missing csrf_token in response');
        if (!shouldRetryCsrfBootstrap(lastError, attempt)) break;
      } catch (e) {
        lastError = e;
        if (!shouldRetryCsrfBootstrap(e, attempt)) break;
      }
      await sleep(CSRF_BOOTSTRAP_BASE_DELAY_MS * (attempt + 1));
    }
    clearMemoryCsrfToken();
    if (import.meta.env.DEV) {
      console.warn('[csrf] ensureCsrfBootstrap failed after retries', lastError);
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  })().finally(() => {
    csrfBootstrapInFlight = null;
  });

  return csrfBootstrapInFlight;
}

function isCsrfInvalidAxiosError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  if (err.response?.status !== 403) return false;
  const code = (err.response?.data as { error?: { code?: string } })?.error?.code;
  return code === 'CSRF_INVALID';
}

/** Một lần bootstrap CSRF rồi gửi lại request (tránh vòng lặp vô hạn). */
export async function fetchWithCsrfRetry<T>(send: () => Promise<T>): Promise<T> {
  try {
    return await send();
  } catch (e) {
    if (!isCsrfInvalidAxiosError(e)) throw e;
    await ensureCsrfBootstrap();
    return await send();
  }
}

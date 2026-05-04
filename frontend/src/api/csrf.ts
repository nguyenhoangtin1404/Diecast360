import axios from 'axios';
import { API_CONFIG } from '../config/api';

/**
 * In-memory CSRF value for cross-site setups (e.g. UI on www.shop.com, API on api.shop.com).
 * The csrf_token cookie is set on the API host; browsers do not expose third-party cookies to
 * document.cookie, so the double-submit header must be filled from the GET /auth/csrf JSON body.
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
  return status >= 500;
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

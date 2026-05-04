import axios from 'axios';
import { API_CONFIG } from '../config/api';

/**
 * In-memory CSRF value for cross-site setups (e.g. UI on www.shop.com, API on api.shop.com).
 * The csrf_token cookie is set on the API host; browsers do not expose third-party cookies to
 * document.cookie, so the double-submit header must be filled from the GET /auth/csrf JSON body.
 */
let memoryCsrfToken: string | undefined;

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
 * Same-origin: cookie is readable from document.cookie.
 * Cross-site API: use memory filled from GET /auth/csrf (and login/refresh responses if present).
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
  const token = memoryCsrfToken || readCsrfTokenFromCookie();
  return token ? { 'X-CSRF-Token': token } : {};
}

/** Lấy CSRF từ backend (GET an toàn) và lưu token vào memory khi cookie là cross-site. */
export async function ensureCsrfBootstrap(): Promise<void> {
  const res = await axios.get(`${API_CONFIG.BASE_URL}/auth/csrf`, { withCredentials: true });
  rememberCsrfFromResponseBody(res.data);
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

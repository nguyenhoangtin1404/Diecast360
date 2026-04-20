import axios from 'axios';
import { API_CONFIG } from '../config/api';

/**
 * Double-submit CSRF: readable cookie + X-CSRF-Token header (must match).
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
  const token = readCsrfTokenFromCookie();
  return token ? { 'X-CSRF-Token': token } : {};
}

/** Lấy cookie csrf_token từ backend (GET an toàn). */
export async function ensureCsrfBootstrap(): Promise<void> {
  await axios.get(`${API_CONFIG.BASE_URL}/auth/csrf`, { withCredentials: true });
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

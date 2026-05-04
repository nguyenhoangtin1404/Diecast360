/** Cross-tab signal: bump after logout so other tabs re-check cookies via /auth/me. */
export const AUTH_SESSION_STORAGE_KEY = 'diecast360_auth_session_rev';

export function readAuthSessionRevision(): string {
  try {
    return localStorage.getItem(AUTH_SESSION_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function bumpAuthSessionRevision(): void {
  try {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, String(Date.now()));
  } catch {
    /* private mode / disabled storage */
  }
}

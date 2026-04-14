/**
 * Optional URL fields: empty is valid; otherwise must be an absolute http(s) URL.
 * Blocks javascript:, data:, etc. for safer use in <img src> and future <a href>.
 */
export function isOptionalHttpOrHttpsUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return true;
  }
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Safe value for URL-bearing DOM attributes; invalid or empty → "". */
export function safeHttpUrlForAttribute(raw: string | null | undefined): string {
  if (raw == null) {
    return '';
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return '';
    }
    return trimmed;
  } catch {
    return '';
  }
}

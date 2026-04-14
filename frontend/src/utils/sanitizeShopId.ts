/**
 * Public `shop_id` query / config values: allow slug-like or UUID-style ids
 * (alphanumeric + hyphen), bounded length. Rejects spaces, slashes, etc.
 */
const SHOP_ID_PARAM_PATTERN = /^[a-zA-Z0-9-]{1,128}$/;

export function sanitizeShopIdQueryParam(raw: string | null | undefined): string {
  if (raw == null) {
    return '';
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 128) {
    return '';
  }
  return SHOP_ID_PARAM_PATTERN.test(trimmed) ? trimmed : '';
}

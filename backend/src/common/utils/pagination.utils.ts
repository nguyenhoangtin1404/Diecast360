/**
 * Page count for list APIs: empty results still expose one logical page so clients
 * never show "page 1 of 0".
 */
export function totalPagesFromCount(total: number, pageSize: number): number {
  const safeSize = Math.max(1, pageSize);
  return Math.max(1, Math.ceil(total / safeSize));
}

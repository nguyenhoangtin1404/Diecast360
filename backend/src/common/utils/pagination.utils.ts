/**
 * Page count for offset pagination. When `total` is 0, `Math.ceil(0 / pageSize)` is 0,
 * which breaks UIs that display "page N of M" — we normalize empty lists to one logical page.
 */
export function totalPagesFromCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

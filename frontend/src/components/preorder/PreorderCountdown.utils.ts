const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

export { HOUR_MS };

export function getBarColor(remainingPct: number): string {
  if (remainingPct > 50) return 'var(--ct-primary)';
  if (remainingPct >= 25) return '#f59e0b';
  return '#dc3545';
}

/** Colour thresholds when opensAt is missing — absolute time to deadline. */
export function getRemainingPctFromDiff(diffMs: number): number {
  if (diffMs >= 2 * DAY_MS) return 75;
  if (diffMs >= DAY_MS) return 40;
  return 10;
}

export function formatRemaining(diffMs: number, compact: boolean): string {
  const totalHours = Math.floor(diffMs / HOUR_MS);
  const minutes = Math.floor((diffMs % HOUR_MS) / MINUTE_MS);
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;

  if (compact) {
    if (days > 0) return `Còn ${days}d`;
    if (totalHours > 0) return `Còn ${totalHours}h`;
    return `Còn ${minutes}m`;
  }
  if (diffMs < DAY_MS) {
    return `Còn ${totalHours} giờ ${minutes} phút`;
  }
  return `Còn ${days} ngày ${remHours} giờ`;
}

export interface CountdownMetrics {
  diffMs: number;
  fillPct: number;
  remainingPct: number;
  hasValidWindow: boolean;
  isExpired: boolean;
}

export function computeCountdownMetrics(
  now: number,
  opensAt: string | null | undefined,
  closesAt: string,
): CountdownMetrics | null {
  const closesAtMs = new Date(closesAt).getTime();
  if (Number.isNaN(closesAtMs)) return null;

  const diffMs = closesAtMs - now;
  if (diffMs <= 0) {
    return { diffMs, fillPct: 0, remainingPct: 0, hasValidWindow: false, isExpired: true };
  }

  const parsedOpensAt = opensAt ? new Date(opensAt).getTime() : Number.NaN;
  const opensAtMs = Number.isNaN(parsedOpensAt) ? null : parsedOpensAt;
  const totalMs = opensAtMs !== null ? closesAtMs - opensAtMs : 0;
  const hasValidWindow = totalMs > 0;

  if (hasValidWindow) {
    const elapsedMs = now - opensAtMs!;
    const fillPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    return { diffMs, fillPct, remainingPct: 100 - fillPct, hasValidWindow: true, isExpired: false };
  }

  return {
    diffMs,
    fillPct: 0,
    remainingPct: getRemainingPctFromDiff(diffMs),
    hasValidWindow: false,
    isExpired: false,
  };
}

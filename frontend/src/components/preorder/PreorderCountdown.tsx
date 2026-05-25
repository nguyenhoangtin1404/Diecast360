import { useEffect, useState } from 'react';

interface PreorderCountdownProps {
  opensAt?: string | null;
  closesAt: string | null;
  compact?: boolean;
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

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

export const PreorderCountdown = ({ opensAt, closesAt, compact = false }: PreorderCountdownProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!closesAt) return;
    const msUntilClose = new Date(closesAt).getTime() - Date.now();
    if (msUntilClose <= 0 || msUntilClose > HOUR_MS) return;
    const id = setTimeout(() => setNow(Date.now()), msUntilClose + 100);
    return () => clearTimeout(id);
  }, [closesAt]);

  if (!closesAt) return null;

  const metrics = computeCountdownMetrics(now, opensAt, closesAt);
  if (!metrics) return null;

  if (metrics.isExpired) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: compact ? '2px 6px' : '3px 10px',
          borderRadius: '999px',
          background: '#f1f5f9',
          color: 'var(--ct-muted)',
          fontSize: compact ? '11px' : '12px',
          fontWeight: 500,
        }}
      >
        Đã đóng
      </span>
    );
  }

  const { diffMs, fillPct, remainingPct, hasValidWindow } = metrics;
  const barColor = getBarColor(remainingPct);
  const label = formatRemaining(diffMs, compact);
  const trackHeight = compact ? 4 : 6;
  const barClass = remainingPct < 25 ? 'animate-pulse-slow' : undefined;

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '72px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: barColor, whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <div
          style={{
            height: `${trackHeight}px`,
            background: '#e2e8f0',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            className={barClass}
            style={{
              height: '100%',
              width: `${fillPct}%`,
              background: barColor,
              borderRadius: '999px',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: barColor }}>{label}</span>
        {hasValidWindow && (
          <span style={{ fontSize: '11px', color: 'var(--ct-muted)' }}>
            {Math.round(remainingPct)}% còn lại
          </span>
        )}
      </div>
      <div
        style={{
          height: `${trackHeight}px`,
          background: '#e2e8f0',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          className={barClass}
          style={{
            height: '100%',
            width: `${fillPct}%`,
            background: barColor,
            borderRadius: '999px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
};

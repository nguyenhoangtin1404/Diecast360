import { useEffect, useState } from 'react';

import {
  computeCountdownMetrics,
  formatRemaining,
  getBarColor,
  HOUR_MS,
} from './PreorderCountdown.utils';

interface PreorderCountdownProps {
  opensAt?: string | null;
  closesAt: string | null;
  compact?: boolean;
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

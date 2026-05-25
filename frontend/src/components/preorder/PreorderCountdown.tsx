import { useEffect, useState } from 'react';

interface PreorderCountdownProps {
  opensAt?: string | null;
  closesAt: string | null;
  compact?: boolean;
}

function getBarColor(remainingPct: number): string {
  if (remainingPct > 50) return 'var(--ct-primary)';
  if (remainingPct >= 25) return '#f59e0b';
  return '#dc3545';
}

function formatRemaining(diffMs: number, compact: boolean): string {
  const totalHours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;

  if (compact) {
    if (days > 0) return `Còn ${days}d`;
    if (totalHours > 0) return `Còn ${totalHours}h`;
    return `Còn ${minutes}m`;
  }
  if (diffMs < 86_400_000) {
    return `Còn ${totalHours}h ${minutes}m`;
  }
  return `Còn ${days} ngày ${remHours} giờ`;
}

export const PreorderCountdown = ({ opensAt, closesAt, compact = false }: PreorderCountdownProps) => {
  const [now, setNow] = useState(() => Date.now());

  // Regular 60-second tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Precise transition to "Đã đóng" when window closes within the next hour
  useEffect(() => {
    if (!closesAt) return;
    const msUntilClose = new Date(closesAt).getTime() - Date.now();
    if (msUntilClose <= 0 || msUntilClose > 3_600_000) return;
    const id = setTimeout(() => setNow(Date.now()), msUntilClose + 100);
    return () => clearTimeout(id);
  }, [closesAt]);

  if (!closesAt) return null;

  const closesAtMs = new Date(closesAt).getTime();
  const diffMs = closesAtMs - now;

  if (diffMs <= 0) {
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

  // When opensAt is unavailable, fillPct = 0 (bar starts empty — remaining unknown)
  const opensAtMs = opensAt ? new Date(opensAt).getTime() : null;
  const totalMs = opensAtMs !== null ? closesAtMs - opensAtMs : 0;
  const elapsedMs = opensAtMs !== null ? now - opensAtMs : 0;
  const fillPct = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
  const remainingPct = 100 - fillPct;
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
        <span style={{ fontSize: '11px', color: 'var(--ct-muted)' }}>
          {Math.round(remainingPct)}% còn lại
        </span>
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

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import {
  computeCountdownMetrics,
  formatRemaining,
  getPreorderBarTone,
  MAX_TIMEOUT_MS,
} from './PreorderCountdown.utils';

interface PreorderCountdownProps {
  opensAt?: string | null;
  closesAt: string | null;
  compact?: boolean;
  /** Extra layout classes (e.g. spacing in a card grid). */
  className?: string;
}

const labelToneClass = {
  safe: 'text-primary',
  warn: 'text-amber-600 dark:text-amber-500',
  critical: 'text-destructive',
} as const;

const fillToneClass = {
  safe: 'bg-primary',
  warn: 'bg-amber-500',
  critical: 'bg-destructive',
} as const;

export const PreorderCountdown = ({
  opensAt,
  closesAt,
  compact = false,
  className,
}: PreorderCountdownProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  /** Reschedule on each tick so the bar flips to “Đã đóng” on time (not up to ~60s late). */
  useEffect(() => {
    if (!closesAt) return;
    const msUntilClose = new Date(closesAt).getTime() - Date.now();
    if (!Number.isFinite(msUntilClose)) return;
    if (msUntilClose <= 0) {
      const id = window.setTimeout(() => setNow(Date.now()), 0);
      return () => clearTimeout(id);
    }
    const delay = Math.min(msUntilClose + 100, MAX_TIMEOUT_MS);
    const id = window.setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(id);
  }, [closesAt, now]);

  if (!closesAt) return null;

  const metrics = computeCountdownMetrics(now, opensAt, closesAt);
  if (!metrics) return null;

  if (metrics.isExpired) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border',
          compact && 'px-1.5 py-px text-[11px]',
          className,
        )}
      >
        Đã đóng
      </span>
    );
  }

  const { diffMs, fillPct, remainingPct, hasValidWindow } = metrics;
  const tone = getPreorderBarTone(remainingPct);
  const label = formatRemaining(diffMs, compact);
  const barClass = remainingPct < 25 ? 'animate-pulse-slow' : undefined;

  if (compact) {
    return (
      <div className={cn('flex min-w-[4.5rem] flex-col gap-1', className)} data-testid="preorder-countdown-compact">
        <span className={cn('whitespace-nowrap text-[11px] font-semibold leading-none', labelToneClass[tone])}>
          {label}
        </span>
        <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fillToneClass[tone], barClass)}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} data-testid="preorder-countdown">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={cn('text-sm font-semibold leading-tight', labelToneClass[tone])}>{label}</span>
        {hasValidWindow && (
          <span className="shrink-0 text-xs text-muted-foreground">{Math.round(remainingPct)}% còn lại</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fillToneClass[tone], barClass)}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
};

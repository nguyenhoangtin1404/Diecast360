import { describe, expect, it } from 'vitest';
import {
  computeCountdownMetrics,
  formatRemaining,
  getBarColor,
  getRemainingPctFromDiff,
} from '../../src/components/preorder/PreorderCountdown.utils';

describe('PreorderCountdown helpers', () => {
  const opensAt = '2026-05-01T00:00:00.000Z';
  const closesAt = '2026-05-11T00:00:00.000Z';
  const midWindow = new Date('2026-05-06T00:00:00.000Z').getTime();

  it('formats full variant with Vietnamese units under 24h', () => {
    const diffMs = 5 * 3_600_000 + 30 * 60_000;
    expect(formatRemaining(diffMs, false)).toBe('Còn 5 giờ 30 phút');
  });

  it('formats full variant with days and hours at or above 24h', () => {
    const diffMs = 2 * 86_400_000 + 3 * 3_600_000;
    expect(formatRemaining(diffMs, false)).toBe('Còn 2 ngày 3 giờ');
  });

  it('maps bar colour to remaining percentage thresholds', () => {
    expect(getBarColor(60)).toBe('var(--ct-primary)');
    expect(getBarColor(40)).toBe('#f59e0b');
    expect(getBarColor(10)).toBe('#dc3545');
  });

  it('computes fill and remaining percentages from opensAt and closesAt', () => {
    const metrics = computeCountdownMetrics(midWindow, opensAt, closesAt);
    expect(metrics).toEqual(
      expect.objectContaining({
        hasValidWindow: true,
        isExpired: false,
        fillPct: 50,
        remainingPct: 50,
      }),
    );
  });

  it('falls back to absolute time colour when opensAt is missing', () => {
    const now = new Date('2026-05-10T12:00:00.000Z').getTime();
    const metrics = computeCountdownMetrics(now, null, closesAt);
    expect(metrics).toEqual(
      expect.objectContaining({
        hasValidWindow: false,
        fillPct: 0,
        remainingPct: getRemainingPctFromDiff(metrics!.diffMs),
      }),
    );
  });

  it('returns expired metrics when closesAt is in the past', () => {
    const metrics = computeCountdownMetrics(
      new Date('2026-05-12T00:00:00.000Z').getTime(),
      opensAt,
      closesAt,
    );
    expect(metrics?.isExpired).toBe(true);
  });
});

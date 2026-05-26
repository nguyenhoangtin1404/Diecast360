import { describe, expect, it } from 'vitest';
import {
  computeCountdownMetrics,
  formatRemaining,
  getPreorderBarTone,
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

  it('avoids “0 phút” when under one minute remains', () => {
    const diffMs = 30_000;
    expect(formatRemaining(diffMs, false)).toBe('Còn 0 giờ 1 phút');
    expect(formatRemaining(diffMs, true)).toBe('Còn 1m');
  });

  it('maps bar tone to remaining percentage thresholds', () => {
    expect(getPreorderBarTone(60)).toBe('safe');
    expect(getPreorderBarTone(40)).toBe('warn');
    expect(getPreorderBarTone(10)).toBe('critical');
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

  it('uses heuristic urgency fill when opensAt is missing', () => {
    const now = new Date('2026-05-10T12:00:00.000Z').getTime();
    const metrics = computeCountdownMetrics(now, null, closesAt);
    const remaining = getRemainingPctFromDiff(metrics!.diffMs);
    expect(metrics).toEqual(
      expect.objectContaining({
        hasValidWindow: false,
        remainingPct: remaining,
        fillPct: 100 - remaining,
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

  it('returns null when closesAt is not a finite date', () => {
    expect(computeCountdownMetrics(Date.now(), opensAt, 'not-a-date')).toBeNull();
  });
});

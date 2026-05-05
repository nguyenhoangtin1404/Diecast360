import { describe, expect, it } from 'vitest';

import {
  accentSurfaceFromPrimary,
  defaultAccentHex,
  defaultPrimaryHex,
  foregroundHslForBackground,
  relativeLuminance,
  resolveAccentRgb,
  resolvePrimaryRgb,
  rgbToHslTriplet,
} from '../../src/utils/shopThemeCss';

describe('shopThemeCss', () => {
  it('defaultPrimaryHex / defaultAccentHex match design tokens', () => {
    expect(defaultPrimaryHex()).toBe('#4f46e5');
    expect(defaultAccentHex()).toBe('#7c3aed');
  });

  it('resolvePrimaryRgb parses 6-digit and 3-digit hex', () => {
    expect(resolvePrimaryRgb('#4f46e5')).toEqual({ r: 79, g: 70, b: 229 });
    expect(resolvePrimaryRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('resolvePrimaryRgb / resolveAccentRgb fall back when empty', () => {
    expect(resolvePrimaryRgb('   ')).toEqual({ r: 79, g: 70, b: 229 });
    expect(resolveAccentRgb('')).toEqual({ r: 124, g: 58, b: 237 });
  });

  it('rgbToHslTriplet produces shadcn-style H S% L% string', () => {
    const triplet = rgbToHslTriplet({ r: 79, g: 70, b: 229 });
    expect(triplet).toMatch(/^\d{1,3} \d{1,3}% \d{1,3}%$/);
    expect(triplet).toBe('243 75% 59%');
  });

  it('foregroundHslForBackground picks contrasting foreground', () => {
    expect(foregroundHslForBackground({ r: 255, g: 255, b: 255 })).toBe('222 47% 11%');
    expect(foregroundHslForBackground({ r: 15, g: 23, b: 42 })).toBe('0 0% 100%');
  });

  it('relativeLuminance is in 0..1 range', () => {
    const l = relativeLuminance({ r: 79, g: 70, b: 229 });
    expect(l).toBeGreaterThan(0);
    expect(l).toBeLessThan(1);
  });

  it('accentSurfaceFromPrimary derives surface from hue', () => {
    const { surface, fg } = accentSurfaceFromPrimary({ r: 79, g: 70, b: 229 });
    expect(surface).toMatch(/^243 /);
    expect(fg).toMatch(/^243 /);
  });
});

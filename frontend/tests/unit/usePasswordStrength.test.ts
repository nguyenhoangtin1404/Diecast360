import { describe, expect, it } from 'vitest';
import {
  analyzePasswordStrength,
  isPasswordStrongEnough,
  PASSWORD_POLICY_MESSAGE,
  passwordStrengthLabelColor,
  passwordStrengthMeterFill,
} from '../../src/pages/admin/shops/hooks/usePasswordStrength';

describe('usePasswordStrength helpers', () => {
  it('treats empty password as optional (meets policy)', () => {
    expect(analyzePasswordStrength('')).toEqual({
      label: '—',
      labelKey: 'empty',
      meterLevel: 0,
      meetsPolicy: true,
    });
    expect(isPasswordStrongEnough('')).toBe(true);
  });

  it('rejects weak password missing character classes', () => {
    const info = analyzePasswordStrength('password');
    expect(info.meetsPolicy).toBe(false);
    expect(info.labelKey).toBe('weak');
    expect(isPasswordStrongEnough('password')).toBe(false);
  });

  it('accepts password meeting full policy', () => {
    const strong = 'Abcd1234!';
    const info = analyzePasswordStrength(strong);
    expect(info.labelKey).toBe('strong');
    expect(info.meetsPolicy).toBe(true);
    expect(isPasswordStrongEnough(strong)).toBe(true);
  });

  it('exports policy message with minimum length', () => {
    expect(PASSWORD_POLICY_MESSAGE).toContain('8');
  });

  it('maps label colors and meter fills', () => {
    expect(passwordStrengthLabelColor('strong')).toBe('#16a34a');
    expect(passwordStrengthMeterFill('weak')).toBe('#fca5a5');
    expect(passwordStrengthMeterFill('empty')).toBe('#e5e7eb');
  });
});

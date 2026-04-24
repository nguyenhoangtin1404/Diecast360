import { describe, expect, it } from 'vitest';
import {
  validateAdjustPointsInput,
  validateCreateMemberInput,
} from '../../src/pages/admin/members/memberFormValidation';

describe('memberFormValidation', () => {
  it('rejects invalid email/phone for create member', () => {
    expect(
      validateCreateMemberInput({
        full_name: 'User A',
        email: 'not-an-email',
      }),
    ).toBe('Email không hợp lệ.');
    expect(
      validateCreateMemberInput({
        full_name: 'User B',
        phone: 'abc',
      }),
    ).toBe('Số điện thoại không hợp lệ.');
    expect(
      validateCreateMemberInput({
        full_name: 'User D',
        email: `${'a'.repeat(191)}@example.com`,
      }),
    ).toBe('Email không được vượt quá 190 ký tự.');
  });

  it('accepts valid create member input', () => {
    expect(
      validateCreateMemberInput({
        full_name: 'User C',
        email: 'u@example.com',
        phone: '0988888888',
      }),
    ).toBeNull();
  });

  it('validates adjust points range and sign', () => {
    expect(validateAdjustPointsInput({ type: 'earn', points: 0 })).toBe(
      'Điểm cộng/trừ phải là số nguyên dương.',
    );
    expect(validateAdjustPointsInput({ type: 'adjust', points: 0 })).toBe(
      'Điểm điều chỉnh phải là số nguyên khác 0 và trong khoảng -1,000,000 đến 1,000,000.',
    );
    expect(validateAdjustPointsInput({ type: 'adjust', points: -1000001 })).toBe(
      'Điểm điều chỉnh phải là số nguyên khác 0 và trong khoảng -1,000,000 đến 1,000,000.',
    );
    expect(validateAdjustPointsInput({ type: 'adjust', points: -20 })).toBeNull();
  });
});

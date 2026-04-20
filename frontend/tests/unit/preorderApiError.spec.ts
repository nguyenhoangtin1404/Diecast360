import axios from 'axios';
import { describe, expect, it } from 'vitest';
import { messageFromPreorderTransitionError } from '../../src/utils/preorderApiError';

describe('messageFromPreorderTransitionError', () => {
  it('returns API message from plain object (unwrapped axios response)', () => {
    expect(
      messageFromPreorderTransitionError({
        ok: false,
        message: 'Invalid pre-order status transition from "ARRIVED" to "PAID"',
      }),
    ).toBe('Invalid pre-order status transition from "ARRIVED" to "PAID"');
  });

  it('returns API message from AxiosError', () => {
    const err = new axios.AxiosError('fail');
    err.response = {
      status: 400,
      statusText: 'Bad Request',
      data: { ok: false, message: 'Invalid pre-order status transition from "X" to "Y"' },
      headers: {},
      config: {} as never,
    };
    expect(messageFromPreorderTransitionError(err)).toBe('Invalid pre-order status transition from "X" to "Y"');
  });

  it('returns default when message missing', () => {
    expect(messageFromPreorderTransitionError({ ok: false })).toBe(
      'Chuyển trạng thái thất bại. Vui lòng thử lại.',
    );
  });
});

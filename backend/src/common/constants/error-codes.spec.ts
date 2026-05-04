import { ErrorCode, HTTP_STATUS_MAP } from './error-codes';
import { HttpStatus } from '@nestjs/common';

describe('error-codes', () => {
  it('maps PUBLIC_SHOP_REQUIRED to 422', () => {
    expect(HTTP_STATUS_MAP[ErrorCode.PUBLIC_SHOP_REQUIRED]).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});

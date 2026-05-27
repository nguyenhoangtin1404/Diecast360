import { createLoginTraceId } from './login-trace-id';

describe('createLoginTraceId', () => {
  it('returns a UUIDv7 string', () => {
    const traceId = createLoginTraceId();
    expect(traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});

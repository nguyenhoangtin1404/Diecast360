import { createAccessTokenExtractor } from './jwt-from-request';
import type { Request } from 'express';

function makeReq(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('createAccessTokenExtractor', () => {
  it('prefers access_token cookie over Bearer when both present', () => {
    const extract = createAccessTokenExtractor(true);
    const token = extract(
      makeReq({
        cookies: { access_token: 'from-cookie' },
        headers: { authorization: 'Bearer from-header' },
      }),
    );
    expect(token).toBe('from-cookie');
  });

  it('reads Bearer when cookie missing and bearer allowed', () => {
    const extract = createAccessTokenExtractor(true);
    expect(extract(makeReq({ headers: { authorization: 'Bearer abc.def' } }))).toBe('abc.def');
  });

  it('returns null for Bearer when bearer disallowed', () => {
    const extract = createAccessTokenExtractor(false);
    expect(extract(makeReq({ headers: { authorization: 'Bearer abc.def' } }))).toBeNull();
  });

  it('returns null when no auth', () => {
    const extract = createAccessTokenExtractor(true);
    expect(extract(makeReq({}))).toBeNull();
  });
});

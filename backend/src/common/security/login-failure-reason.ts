export type LoginFailureReason =
  | 'invalid_credentials'
  | 'account_locked'
  | 'captcha_failed'
  | 'validation_error'
  | 'rate_limited'
  | 'internal_error';

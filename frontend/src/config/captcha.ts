export const CAPTCHA_SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string | undefined;
export const CAPTCHA_PROVIDER = (import.meta.env.VITE_CAPTCHA_PROVIDER as string | undefined) || 'cloudflare';
export const CAPTCHA_ENABLED =
  import.meta.env.VITE_CAPTCHA_ENABLED === 'true' &&
  !!CAPTCHA_SITE_KEY;

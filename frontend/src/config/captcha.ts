export const CAPTCHA_SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string | undefined;
export const CAPTCHA_PROVIDER = (import.meta.env.VITE_CAPTCHA_PROVIDER as string | undefined) || 'cloudflare';
export const CAPTCHA_ENABLED = !!CAPTCHA_SITE_KEY;

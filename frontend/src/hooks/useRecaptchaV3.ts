import { useCallback, useEffect } from 'react';
import { CAPTCHA_ENABLED, CAPTCHA_PROVIDER, CAPTCHA_SITE_KEY } from '../config/captcha';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export const useRecaptchaV3 = () => {
  useEffect(() => {
    if (!CAPTCHA_ENABLED || CAPTCHA_PROVIDER !== 'google') return;
    if (document.getElementById('recaptcha-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${CAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const execute = useCallback(async (): Promise<string | undefined> => {
    if (!CAPTCHA_ENABLED || CAPTCHA_PROVIDER !== 'google') return undefined;
    return new Promise((resolve, reject) => {
      window.grecaptcha?.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(CAPTCHA_SITE_KEY!, { action: 'login' });
          resolve(token);
        } catch (err) {
          reject(err);
        }
      });
    });
  }, []);

  return { execute };
};

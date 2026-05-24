import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string | undefined;
export const CAPTCHA_PROVIDER = (import.meta.env.VITE_CAPTCHA_PROVIDER as string | undefined) || 'cloudflare';
export const CAPTCHA_ENABLED = !!SITE_KEY;

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire: () => void;
  onError?: () => void;
  resetKey?: number;
}

export const TurnstileWidget = ({ onToken, onExpire, onError, resetKey }: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>();

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !SITE_KEY) return;
    if (widgetIdRef.current !== undefined) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onToken,
      'expired-callback': onExpire,
      'error-callback': onError,
      theme: 'light',
    });
  }, [onToken, onExpire, onError]);

  useEffect(() => {
    if (!SITE_KEY) return;

    if (window.turnstile) {
      renderWidget();
    } else {
      window.onTurnstileLoad = renderWidget;
      if (!document.getElementById('cf-turnstile-script')) {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetIdRef.current !== undefined && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, [renderWidget]);

  useEffect(() => {
    if (!resetKey) return;
    if (widgetIdRef.current !== undefined && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  if (!SITE_KEY || CAPTCHA_PROVIDER !== 'cloudflare') return null;
  return <div ref={containerRef} className="flex justify-center" />;
};

export const useRecaptchaV3 = () => {
  useEffect(() => {
    if (!SITE_KEY || CAPTCHA_PROVIDER !== 'google') return;
    if (document.getElementById('recaptcha-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const execute = useCallback(async (): Promise<string | undefined> => {
    if (!SITE_KEY || CAPTCHA_PROVIDER !== 'google') return undefined;
    return new Promise((resolve, reject) => {
      window.grecaptcha?.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(SITE_KEY, { action: 'login' });
          resolve(token);
        } catch (err) {
          reject(err);
        }
      });
    });
  }, []);

  return { execute };
};

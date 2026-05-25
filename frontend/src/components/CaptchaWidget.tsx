import { useCallback, useEffect, useRef } from 'react';
import { CAPTCHA_PROVIDER, CAPTCHA_SITE_KEY } from '../config/captcha';

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
    onTurnstileLoad?: () => void;
  }
}

interface CaptchaWidgetProps {
  onToken: (token: string) => void;
  onExpire: () => void;
  /** Called when the widget itself reports an error (token validation, network). */
  onError?: () => void;
  /** Called when the Turnstile script fails to load (blocked by ad-blocker, CSP, network). */
  onLoadError?: () => void;
  /** Increment to trigger a widget reset. 0 = initial state (no reset). */
  resetKey?: number;
}

export const CaptchaWidget = ({ onToken, onExpire, onError, onLoadError, resetKey }: CaptchaWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !CAPTCHA_SITE_KEY) return;
    if (widgetIdRef.current !== undefined) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: CAPTCHA_SITE_KEY,
      callback: onToken,
      'expired-callback': onExpire,
      'error-callback': onError,
      theme: 'light',
    });
  }, [onToken, onExpire, onError]);

  useEffect(() => {
    if (!CAPTCHA_SITE_KEY) return;

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
        script.onerror = () => onLoadError?.();
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetIdRef.current !== undefined && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, [renderWidget, onLoadError]);

  useEffect(() => {
    if (!resetKey || resetKey <= 0) return;
    if (widgetIdRef.current !== undefined && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  if (!CAPTCHA_SITE_KEY || CAPTCHA_PROVIDER !== 'cloudflare') return null;
  return <div ref={containerRef} className="flex justify-center" />;
};

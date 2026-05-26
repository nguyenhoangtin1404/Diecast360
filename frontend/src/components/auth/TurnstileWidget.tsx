import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
};

export function TurnstileWidget({ siteKey, onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    if (widgetIdRef.current != null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    onToken(null);
  }, [onToken]);

  useEffect(() => {
    onToken(null);
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) {
        return;
      }
      if (widgetIdRef.current != null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existing.addEventListener('load', renderWidget);
      }
      return () => {
        cancelled = true;
        existing.removeEventListener('load', renderWidget);
        if (widgetIdRef.current != null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            /* ignore */
          }
        }
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
    };
  }, [siteKey, onToken]);

  return (
    <div className="flex flex-col items-stretch gap-2">
      <div ref={containerRef} data-testid="turnstile-widget" />
      <button
        type="button"
        className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        onClick={reset}
      >
        Làm mới xác minh
      </button>
    </div>
  );
}

export function isCaptchaEnabled(): boolean {
  const provider = import.meta.env.VITE_CAPTCHA_PROVIDER?.trim();
  const siteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY?.trim();
  return Boolean(provider && siteKey);
}

export function getCaptchaProvider(): string | undefined {
  return import.meta.env.VITE_CAPTCHA_PROVIDER?.trim() || undefined;
}

import { useEffect } from 'react';

export const DEFAULT_DOCUMENT_TITLE = 'Diecast360 — Mô hình xe 1:64';

/**
 * Sets document title and optional favicon link while `enabled`.
 * Cleans up on disable/unmount (restores default title, removes injected links by marker).
 */
export function useDocumentTitleAndFavicon(params: {
  enabled: boolean;
  title: string;
  faviconUrl: string;
  /** Attribute on <link> for targeted cleanup (avoid touching vite.svg default). */
  markerAttr: 'data-shop-branding' | 'data-admin-shop-branding';
}): void {
  const { enabled, title, faviconUrl, markerAttr } = params;

  useEffect(() => {
    if (!enabled) return undefined;

    document.title = title;

    let appended: HTMLLinkElement | null = null;
    if (faviconUrl) {
      appended = document.createElement('link');
      appended.rel = 'icon';
      appended.href = faviconUrl;
      appended.setAttribute(markerAttr, '1');
      document.head.appendChild(appended);
    }

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
      appended?.remove();
      document.querySelectorAll(`link[${markerAttr}="1"]`).forEach((el) => el.remove());
    };
  }, [enabled, title, faviconUrl, markerAttr]);
}

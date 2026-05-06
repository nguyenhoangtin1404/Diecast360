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

    // Keep managed favicon links and place them before default icons so browser
    // prefers shop branding over built-in vite favicon.
    const managedLinks: HTMLLinkElement[] = [];
    if (faviconUrl) {
      // Remove Vite scaffold favicon if present; runtime-managed favicon should take precedence.
      document
        .querySelectorAll<HTMLLinkElement>('link[href="/vite.svg"]')
        .forEach((el) => el.remove());

      const existingManaged = Array.from(
        document.querySelectorAll<HTMLLinkElement>(`link[${markerAttr}="1"]`),
      );
      // Stable cache-buster per URL (avoid forcing a fresh download on every re-render).
      const withVersion = `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(faviconUrl)}`;
      const firstExistingIcon = document.querySelector<HTMLLinkElement>(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel~="icon"]',
      );
      const rels: Array<'icon' | 'shortcut icon'> = ['icon', 'shortcut icon'];

      rels.forEach((rel, index) => {
        const link = existingManaged[index] ?? document.createElement('link');
        link.rel = rel;
        link.href = withVersion;
        link.type = 'image/png';
        link.setAttribute(markerAttr, '1');
        if (!existingManaged[index]) {
          if (firstExistingIcon?.parentNode) {
            firstExistingIcon.parentNode.insertBefore(link, firstExistingIcon);
          } else {
            document.head.appendChild(link);
          }
        }
        managedLinks.push(link);
      });

      // Ensure we never accumulate duplicate managed links.
      existingManaged.slice(rels.length).forEach((el) => el.remove());
    }

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
      managedLinks.forEach((el) => el.remove());
      document.querySelectorAll(`link[${markerAttr}="1"]`).forEach((el) => el.remove());
    };
  }, [enabled, title, faviconUrl, markerAttr]);
}

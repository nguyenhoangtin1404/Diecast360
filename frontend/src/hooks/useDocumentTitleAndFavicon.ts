import { useEffect } from 'react';

export const DEFAULT_DOCUMENT_TITLE = 'Diecast360 — Mô hình xe 1:64';

/**
 * Sets document title and optional favicon link while `enabled`.
 * Cleans up on disable/unmount (restores default title, removes injected links by marker,
 * and re-inserts any default icon links removed while a shop favicon was active).
 */
export function useDocumentTitleAndFavicon(params: {
  enabled: boolean;
  title: string;
  faviconUrl: string;
  /** Attribute on <link> for targeted cleanup (default document icons are restored on cleanup). */
  markerAttr: 'data-shop-branding' | 'data-admin-shop-branding';
}): void {
  const { enabled, title, faviconUrl, markerAttr } = params;

  useEffect(() => {
    if (!enabled) return undefined;

    document.title = title;

    // Keep managed favicon links and place them before default icons so browser
    // prefers shop branding over built-in vite favicon.
    const managedLinks: HTMLLinkElement[] = [];
    /** Clones of default <link rel="icon"> nodes removed so we can restore them after branding ends. */
    const removedDefaultIconRestores: Array<{
      parent: ParentNode;
      nextSibling: ChildNode | null;
      clone: HTMLLinkElement;
    }> = [];
    if (faviconUrl) {
      // Remove Vite scaffold favicon if present; runtime-managed favicon should take precedence.
      document.querySelectorAll<HTMLLinkElement>('link[href="/vite.svg"]').forEach((el) => {
        const parent = el.parentNode;
        if (!parent) return;
        const nextSibling = el.nextSibling;
        const clone = el.cloneNode(true) as HTMLLinkElement;
        removedDefaultIconRestores.push({ parent, nextSibling, clone });
        el.remove();
      });

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
      for (const { parent, nextSibling, clone } of removedDefaultIconRestores) {
        if (clone.isConnected) continue;
        try {
          parent.insertBefore(clone, nextSibling);
        } catch {
          /* parent detached from document — skip */
        }
      }
    };
  }, [enabled, title, faviconUrl, markerAttr]);
}

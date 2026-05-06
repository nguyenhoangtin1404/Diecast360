import { useEffect, useRef } from 'react';

export const DEFAULT_DOCUMENT_TITLE = 'Diecast360 — Mô hình xe 1:64';

function shortHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function guessIconMimeType(url: string): string {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.svg')) return 'image/svg+xml';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
}

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
  const lastAppliedHrefRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return undefined;

    document.title = title;

    const managedLinks: HTMLLinkElement[] = [];
    const removedDefaultIconRestores: Array<{
      parent: ParentNode;
      nextSibling: ChildNode | null;
      clone: HTMLLinkElement;
    }> = [];

    if (faviconUrl) {
      const defaultIconSelector =
        'link[rel="icon"]:not([data-shop-branding]):not([data-admin-shop-branding]),' +
        'link[rel="shortcut icon"]:not([data-shop-branding]):not([data-admin-shop-branding])';
      document.querySelectorAll<HTMLLinkElement>(defaultIconSelector).forEach((el) => {
        const parent = el.parentNode;
        if (!parent) return;
        const nextSibling = el.nextSibling;
        const clone = el.cloneNode(true) as HTMLLinkElement;
        removedDefaultIconRestores.push({ parent, nextSibling, clone });
        el.remove();
      });

      const existingManaged = Array.from(
        document.querySelectorAll<HTMLLinkElement>(`link[${markerAttr}]`),
      );
      const withVersion = `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${shortHash(faviconUrl)}`;
      const mimeType = guessIconMimeType(faviconUrl);
      const firstExistingIcon = document.querySelector<HTMLLinkElement>(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel~="icon"]',
      );
      const rels: Array<'icon' | 'shortcut icon'> = ['icon', 'shortcut icon'];

      rels.forEach((rel, index) => {
        const link = existingManaged[index] ?? document.createElement('link');
        link.rel = rel;
        // Do not compare `link.href` to `withVersion`: browsers resolve to absolute URLs and
        // encoding can differ. `lastAppliedHrefRef` is enough to skip redundant assignments.
        if (lastAppliedHrefRef.current !== withVersion) {
          link.href = withVersion;
        }
        link.type = mimeType;
        link.setAttribute(markerAttr, rel);
        if (!existingManaged[index]) {
          if (firstExistingIcon?.parentNode) {
            firstExistingIcon.parentNode.insertBefore(link, firstExistingIcon);
          } else {
            document.head.appendChild(link);
          }
        }
        managedLinks.push(link);
      });
      lastAppliedHrefRef.current = withVersion;
      existingManaged.slice(rels.length).forEach((el) => el.remove());
    }

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
      lastAppliedHrefRef.current = '';
      managedLinks.forEach((el) => el.remove());
      document.querySelectorAll(`link[${markerAttr}]`).forEach((el) => el.remove());
      for (const { parent, nextSibling, clone } of removedDefaultIconRestores) {
        if (clone.isConnected) continue;
        try {
          if (nextSibling && nextSibling.parentNode === parent) {
            parent.insertBefore(clone, nextSibling);
          } else {
            parent.appendChild(clone);
          }
        } catch {
          // parent detached from document
        }
      }
    };
  }, [enabled, title, faviconUrl, markerAttr]);
}

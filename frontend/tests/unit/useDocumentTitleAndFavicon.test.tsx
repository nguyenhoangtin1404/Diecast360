// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_DOCUMENT_TITLE,
  useDocumentTitleAndFavicon,
} from '../../src/hooks/useDocumentTitleAndFavicon';

describe('useDocumentTitleAndFavicon', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    const defaultIcon = document.createElement('link');
    defaultIcon.rel = 'icon';
    defaultIcon.type = 'image/svg+xml';
    defaultIcon.href = '/vite.svg';
    document.head.appendChild(defaultIcon);
    document.title = 'prior';
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  it('removes default vite.svg while a shop favicon is active, then restores it on cleanup', () => {
    const faviconUrl = 'https://cdn.example.com/fav.png';

    const { rerender, unmount } = renderHook(
      (props: { enabled: boolean; faviconUrl: string }) => {
        useDocumentTitleAndFavicon({
          enabled: props.enabled,
          title: 'Shop — Catalog',
          faviconUrl: props.faviconUrl,
          markerAttr: 'data-shop-branding',
        });
      },
      { initialProps: { enabled: true, faviconUrl } },
    );

    expect(document.querySelectorAll('link[href="/vite.svg"]')).toHaveLength(0);
    const managed = document.querySelectorAll('link[data-shop-branding="1"]');
    expect(managed.length).toBeGreaterThanOrEqual(1);
    expect(managed[0]?.getAttribute('href')).toContain(faviconUrl);
    expect(document.title).toBe('Shop — Catalog');

    act(() => {
      rerender({ enabled: true, faviconUrl: '' });
    });

    expect(document.querySelectorAll('link[data-shop-branding="1"]')).toHaveLength(0);
    expect(document.querySelectorAll('link[href="/vite.svg"]')).toHaveLength(1);
    // Title still follows `title` while the hook stays enabled (only favicon cleared).
    expect(document.title).toBe('Shop — Catalog');

    act(() => {
      rerender({ enabled: true, faviconUrl });
    });
    expect(document.querySelectorAll('link[href="/vite.svg"]')).toHaveLength(0);

    unmount();
    expect(document.querySelectorAll('link[href="/vite.svg"]')).toHaveLength(1);
    expect(document.querySelectorAll('link[data-shop-branding="1"]')).toHaveLength(0);
    expect(document.title).toBe(DEFAULT_DOCUMENT_TITLE);
  });
});

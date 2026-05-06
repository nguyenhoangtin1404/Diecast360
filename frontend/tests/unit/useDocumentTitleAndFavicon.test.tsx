// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_DOCUMENT_TITLE, useDocumentTitleAndFavicon } from '../../src/hooks/useDocumentTitleAndFavicon';

function HookProbe({
  enabled,
  title,
  faviconUrl,
  markerAttr,
}: {
  enabled: boolean;
  title: string;
  faviconUrl: string;
  markerAttr: 'data-shop-branding' | 'data-admin-shop-branding';
}) {
  useDocumentTitleAndFavicon({ enabled, title, faviconUrl, markerAttr });
  return null;
}

describe('useDocumentTitleAndFavicon', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  it('replaces default favicon links with marker-managed links', () => {
    const defaultIcon = document.createElement('link');
    defaultIcon.rel = 'icon';
    defaultIcon.href = '/placeholder-item.svg';
    document.head.appendChild(defaultIcon);

    render(
      <HookProbe
        enabled
        title="Shop A"
        faviconUrl="https://cdn.example.com/shop/favicon.png"
        markerAttr="data-shop-branding"
      />,
    );

    expect(document.querySelector('link[href="/placeholder-item.svg"]')).toBeNull();
    const managed = document.querySelectorAll('link[data-shop-branding]');
    expect(managed).toHaveLength(2);
  });

  it('removes legacy /vite.svg default icon alongside placeholder, then restores both on unmount', () => {
    const placeholder = document.createElement('link');
    placeholder.rel = 'icon';
    placeholder.type = 'image/svg+xml';
    placeholder.href = '/placeholder-item.svg';
    document.head.appendChild(placeholder);

    const legacy = document.createElement('link');
    legacy.rel = 'icon';
    legacy.type = 'image/svg+xml';
    legacy.href = '/vite.svg';
    document.head.appendChild(legacy);

    const { unmount } = render(
      <HookProbe
        enabled
        title="Shop"
        faviconUrl="https://cdn.example.com/f.png"
        markerAttr="data-shop-branding"
      />,
    );

    expect(document.querySelector('link[href="/vite.svg"]')).toBeNull();
    expect(document.querySelector('link[href="/placeholder-item.svg"]')).toBeNull();

    unmount();

    expect(document.querySelectorAll('link[href="/vite.svg"]')).toHaveLength(1);
    expect(document.querySelectorAll('link[href="/placeholder-item.svg"]')).toHaveLength(1);
  });

  it('uses a short v= cache token in the managed favicon href', () => {
    const faviconUrl = 'https://cdn.example.com/shop/favicon.png';
    render(
      <HookProbe enabled title="T" faviconUrl={faviconUrl} markerAttr="data-shop-branding" />,
    );

    const icon = document.querySelector('link[data-shop-branding="icon"]') as HTMLLinkElement | null;
    expect(icon).not.toBeNull();
    const u = new URL(icon!.href);
    const v = u.searchParams.get('v');
    expect(v).toBeTruthy();
    expect(v!.length).toBeLessThan(24);
    expect(icon!.href).toContain(faviconUrl.split('?')[0]);
  });

  it('keeps a stable managed href when faviconUrl is unchanged', () => {
    const { rerender } = render(
      <HookProbe
        enabled
        title="Shop A"
        faviconUrl="https://cdn.example.com/shop/favicon-a.png"
        markerAttr="data-shop-branding"
      />,
    );

    const first = document.querySelector('link[data-shop-branding="icon"]') as HTMLLinkElement | null;
    expect(first).not.toBeNull();
    const firstHref = first?.href ?? '';
    const firstShortcutHref =
      (document.querySelector('link[data-shop-branding="shortcut icon"]') as HTMLLinkElement | null)?.href ?? '';

    rerender(
      <HookProbe
        enabled
        title="Shop A Updated"
        faviconUrl="https://cdn.example.com/shop/favicon-a.png"
        markerAttr="data-shop-branding"
      />,
    );
    const second = document.querySelector('link[data-shop-branding="icon"]') as HTMLLinkElement | null;
    expect(second?.href).toBe(firstHref);
    expect(
      (document.querySelector('link[data-shop-branding="shortcut icon"]') as HTMLLinkElement | null)?.href ?? '',
    ).toBe(firstShortcutHref);
    expect(document.querySelectorAll('link[data-shop-branding]')).toHaveLength(2);

    rerender(
      <HookProbe
        enabled
        title="Shop A Updated"
        faviconUrl="https://cdn.example.com/shop/favicon-b.png"
        markerAttr="data-shop-branding"
      />,
    );
    const third = document.querySelector('link[data-shop-branding="icon"]') as HTMLLinkElement | null;
    expect(third?.href).not.toBe(firstHref);
  });

  it('cleans up only links for the given marker', () => {
    const adminIcon = document.createElement('link');
    adminIcon.rel = 'icon';
    adminIcon.setAttribute('data-admin-shop-branding', 'icon');
    adminIcon.href = 'https://cdn.example.com/admin.png';
    document.head.appendChild(adminIcon);

    const { unmount } = render(
      <HookProbe
        enabled
        title="Public Shop"
        faviconUrl="https://cdn.example.com/public.png"
        markerAttr="data-shop-branding"
      />,
    );

    unmount();
    expect(document.querySelector('link[data-shop-branding]')).toBeNull();
    expect(document.querySelector('link[data-admin-shop-branding="icon"]')).not.toBeNull();
  });

  it('restores default icon on unmount and resets title', () => {
    const defaultIcon = document.createElement('link');
    defaultIcon.rel = 'icon';
    defaultIcon.type = 'image/svg+xml';
    defaultIcon.href = '/placeholder-item.svg';
    document.head.appendChild(defaultIcon);

    const { unmount } = render(
      <HookProbe
        enabled
        title="Shop — Catalog"
        faviconUrl="https://cdn.example.com/shop/favicon.png"
        markerAttr="data-shop-branding"
      />,
    );

    expect(document.querySelector('link[href="/placeholder-item.svg"]')).toBeNull();
    unmount();

    expect(document.querySelector('link[href="/placeholder-item.svg"]')).not.toBeNull();
    expect(document.querySelector('link[data-shop-branding]')).toBeNull();
    expect(document.title).toBe(DEFAULT_DOCUMENT_TITLE);
  });
});

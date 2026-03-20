// @vitest-environment jsdom
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MOBILE_BREAKPOINT, useIsMobile } from '../../src/hooks/useIsMobile';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

describe('useIsMobile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a stable desktop value during SSR when window is undefined', async () => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);

    const { useIsMobile: useIsMobileForSsr } = await import('../../src/hooks/useIsMobile');

    function SsrProbe() {
      const isMobile = useIsMobileForSsr();
      return <span>{String(isMobile)}</span>;
    }

    expect(() => renderToString(<SsrProbe />)).not.toThrow();
    expect(renderToString(<SsrProbe />)).toContain('false');
  });

  it('updates from desktop to mobile and back on resize', async () => {
    setViewportWidth(MOBILE_BREAKPOINT + 32);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      setViewportWidth(MOBILE_BREAKPOINT - 32);
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    act(() => {
      setViewportWidth(MOBILE_BREAKPOINT + 64);
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('honors a custom maxWidth parameter', async () => {
    setViewportWidth(900);

    const { result } = renderHook(() => useIsMobile(1024));
    expect(result.current).toBe(true);

    act(() => {
      setViewportWidth(1200);
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});

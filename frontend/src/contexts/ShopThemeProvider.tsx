import { useEffect, useMemo, type FC, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePublicShopContext } from '../hooks/usePublicShopContext';
import { publicShopContactQueryKey, usePublicShopContact } from '../hooks/usePublicShopContact';
import { parseAppearanceFormDefaults } from '../utils/shopAppearance';
import {
  accentSurfaceFromPrimary,
  defaultAccentHex,
  defaultPrimaryHex,
  foregroundHslForBackground,
  resolveAccentRgb,
  resolvePrimaryRgb,
  rgbToCssTriplet,
  rgbToHslTriplet,
} from '../utils/shopThemeCss';
import { SHOP_APPEARANCE_UPDATED_EVENT } from '../utils/shopThemeBridge';

function applyBrandingVars(root: HTMLElement, primaryCss: string, accentCss: string): void {
  const pRgb = resolvePrimaryRgb(primaryCss);
  const aRgb = resolveAccentRgb(accentCss);
  const pHsl = rgbToHslTriplet(pRgb);
  const aHsl = rgbToHslTriplet(aRgb);
  const pTriplet = rgbToCssTriplet(pRgb);
  const aTriplet = rgbToCssTriplet(aRgb);
  const pFg = foregroundHslForBackground(pRgb);
  const aFg = foregroundHslForBackground(aRgb);
  const { surface: accentBg, fg: accentFg } = accentSurfaceFromPrimary(pRgb);

  root.style.setProperty('--shop-primary-rgb', pTriplet);
  root.style.setProperty('--shop-accent-rgb', aTriplet);
  root.style.setProperty('--ct-primary', primaryCss.trim() || defaultPrimaryHex());
  root.style.setProperty('--ct-secondary', accentCss.trim() || defaultAccentHex());
  root.style.setProperty('--primary', pHsl);
  root.style.setProperty('--primary-foreground', pFg);
  root.style.setProperty('--secondary', aHsl);
  root.style.setProperty('--secondary-foreground', aFg);
  root.style.setProperty('--ring', pHsl);
  root.style.setProperty('--chart-1', pHsl);
  root.style.setProperty('--chart-2', aHsl);
  root.style.setProperty('--accent', accentBg);
  root.style.setProperty('--accent-foreground', accentFg);
}

function clearBrandingVars(root: HTMLElement): void {
  const keys = [
    '--shop-primary-rgb',
    '--shop-accent-rgb',
    '--ct-primary',
    '--ct-secondary',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--ring',
    '--chart-1',
    '--chart-2',
    '--accent',
    '--accent-foreground',
  ] as const;
  for (const k of keys) {
    root.style.removeProperty(k);
  }
}

export const ShopThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { effectiveShopId, shopContextReady, publicApiShopReady } = usePublicShopContext();
  const queryClient = useQueryClient();

  const enabled = shopContextReady && publicApiShopReady && Boolean(effectiveShopId);

  const publicContactQuery = usePublicShopContact(true);

  const { primaryCss, accentCss } = useMemo(() => {
    const parsed = parseAppearanceFormDefaults(publicContactQuery.data?.appearance ?? {});
    const primary = parsed.primary_color.trim() || defaultPrimaryHex();
    const accent = parsed.accent_color.trim() || defaultAccentHex();
    return { primaryCss: primary, accentCss: accent };
  }, [publicContactQuery.data?.appearance]);

  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      clearBrandingVars(root);
      return;
    }
    applyBrandingVars(root, primaryCss, accentCss);
    return () => {
      clearBrandingVars(root);
    };
  }, [enabled, primaryCss, accentCss]);

  useEffect(() => {
    const onInvalidate = () => {
      if (effectiveShopId) {
        void queryClient.invalidateQueries({ queryKey: publicShopContactQueryKey(effectiveShopId) });
      }
    };
    window.addEventListener(SHOP_APPEARANCE_UPDATED_EVENT, onInvalidate);
    return () => window.removeEventListener(SHOP_APPEARANCE_UPDATED_EVENT, onInvalidate);
  }, [queryClient, effectiveShopId]);

  return <>{children}</>;
};

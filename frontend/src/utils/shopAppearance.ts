import type { ShopAppearanceFormState } from '@/types/shopAppearance';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Normalize `appearance_json` (or undefined) into form state strings. */
export function parseAppearanceFormDefaults(appearanceJson: unknown): ShopAppearanceFormState {
  const root =
    appearanceJson && typeof appearanceJson === 'object' && !Array.isArray(appearanceJson)
      ? (appearanceJson as Record<string, unknown>)
      : {};
  return {
    logo_url: str(root.logo_url),
    favicon_url: str(root.favicon_url),
    primary_color: str(root.primary_color),
    accent_color: str(root.accent_color),
    font_family: str(root.font_family),
  };
}

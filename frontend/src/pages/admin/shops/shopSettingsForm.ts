import type { ShopAppearanceFormState } from './types/shopSettings';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

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

export function buildAppearancePatch(form: ShopAppearanceFormState): Record<string, string> {
  return {
    logo_url: form.logo_url.trim(),
    favicon_url: form.favicon_url.trim(),
    primary_color: form.primary_color.trim(),
    accent_color: form.accent_color.trim(),
    font_family: form.font_family.trim(),
  };
}

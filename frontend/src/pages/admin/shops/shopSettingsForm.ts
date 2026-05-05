import type { ShopAppearanceFormState } from '@/types/shopAppearance';

export function buildAppearancePatch(form: ShopAppearanceFormState): Record<string, string> {
  return {
    logo_url: form.logo_url.trim(),
    favicon_url: form.favicon_url.trim(),
    primary_color: form.primary_color.trim(),
    accent_color: form.accent_color.trim(),
    font_family: form.font_family.trim(),
  };
}

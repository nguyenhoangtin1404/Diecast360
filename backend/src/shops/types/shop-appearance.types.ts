import { Prisma } from '../../generated/prisma/client';

export type ShopAppearanceSettings = {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  font_family?: string;
};

export function parseShopAppearanceJson(raw: Prisma.JsonValue | null | undefined): ShopAppearanceSettings {
  if (raw === null || raw === undefined) {
    return {};
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return raw as ShopAppearanceSettings;
}

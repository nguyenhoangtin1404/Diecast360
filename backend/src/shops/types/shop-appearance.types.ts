import { Prisma } from '../../generated/prisma/client';

export type ShopAppearanceSettings = {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  font_family?: string;
};

const KEYS: (keyof ShopAppearanceSettings)[] = [
  'logo_url',
  'favicon_url',
  'primary_color',
  'accent_color',
  'font_family',
];

export function parseShopAppearanceJson(raw: Prisma.JsonValue | null | undefined): ShopAppearanceSettings {
  if (raw === null || raw === undefined) {
    return {};
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const root = raw as Record<string, unknown>;
  const out: ShopAppearanceSettings = {};
  for (const k of KEYS) {
    const v = root[k as string];
    if (typeof v === 'string') {
      out[k] = v;
    }
  }
  return out;
}

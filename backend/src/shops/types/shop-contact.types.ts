import { Prisma } from '../../generated/prisma/client';

/**
 * Shape stored in Shop.contact_json and returned by GET /public/shops/:id/contact.
 */
export type ShopContactSettings = {
  page_title?: string;
  page_subtitle?: string;
  phone?: {
    /** Display label e.g. "Điện thoại" */
    title?: string;
    /** Shown to users (e.g. 0856694766) */
    label?: string;
    /** tel: href without scheme, e.g. +84856694766 */
    tel?: string;
    hint?: string;
  };
  facebook?: {
    title?: string;
    /** Full URL */
    url?: string;
    /** Short label for link text */
    label?: string;
    hint?: string;
  };
  zalo?: {
    title?: string;
    /** Full URL e.g. https://zalo.me/0856694766 */
    url?: string;
    label?: string;
    hint?: string;
  };
  hours?: {
    title?: string;
    /** Main line e.g. "Thứ 2 - Chủ nhật: 9:00 - 21:00" */
    schedule_line?: string;
    footer_note?: string;
  };
};

function strField(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function readNestedStrings(
  raw: Record<string, unknown>,
  key: string,
): Record<string, string | undefined> {
  const v = raw[key];
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    return {};
  }
  const o = v as Record<string, unknown>;
  const out: Record<string, string | undefined> = {};
  for (const k of Object.keys(o)) {
    out[k] = strField(o[k]);
  }
  return out;
}

function compactNested(
  fields: Record<string, string | undefined>,
): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== '') {
      out[k] = v;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Coerce DB JSON to typed strings only — avoids runtime errors on corrupt types. */
export function parseShopContactJson(raw: Prisma.JsonValue | null | undefined): ShopContactSettings {
  if (raw === null || raw === undefined) {
    return {};
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const root = raw as Record<string, unknown>;
  const phone = readNestedStrings(root, 'phone');
  const facebook = readNestedStrings(root, 'facebook');
  const zalo = readNestedStrings(root, 'zalo');
  const hours = readNestedStrings(root, 'hours');

  const out: ShopContactSettings = {};
  const pt = strField(root.page_title);
  const ps = strField(root.page_subtitle);
  if (pt !== undefined) out.page_title = pt;
  if (ps !== undefined) out.page_subtitle = ps;

  const phoneC = compactNested(phone as Record<string, string | undefined>);
  if (phoneC) out.phone = phoneC as ShopContactSettings['phone'];
  const fbC = compactNested(facebook as Record<string, string | undefined>);
  if (fbC) out.facebook = fbC as ShopContactSettings['facebook'];
  const zaloC = compactNested(zalo as Record<string, string | undefined>);
  if (zaloC) out.zalo = zaloC as ShopContactSettings['zalo'];
  const hoursC = compactNested(hours as Record<string, string | undefined>);
  if (hoursC) out.hours = hoursC as ShopContactSettings['hours'];

  return out;
}

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

export function parseShopContactJson(raw: Prisma.JsonValue | null | undefined): ShopContactSettings {
  if (raw === null || raw === undefined) {
    return {};
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return raw as ShopContactSettings;
}

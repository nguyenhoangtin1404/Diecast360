import type { Shop } from './types';
import type { ShopContactPayload } from './types/shopContact';

function readNested(obj: Record<string, unknown>, key: string): Record<string, unknown> {
  const v = obj[key];
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Hydrate edit-modal state from GET /admin/shops list row (`contact_json`). */
export function parseShopContactFormDefaults(contactJson: Shop['contact_json']): ShopContactPayload & {
  page_title: string;
  page_subtitle: string;
} {
  const root =
    contactJson && typeof contactJson === 'object' && !Array.isArray(contactJson)
      ? (contactJson as Record<string, unknown>)
      : {};
  const phone = readNested(root, 'phone');
  const facebook = readNested(root, 'facebook');
  const zalo = readNested(root, 'zalo');
  const hours = readNested(root, 'hours');

  return {
    page_title: str(root.page_title),
    page_subtitle: str(root.page_subtitle),
    phone: {
      title: str(phone.title),
      label: str(phone.label),
      tel: str(phone.tel),
      hint: str(phone.hint),
    },
    facebook: {
      title: str(facebook.title),
      url: str(facebook.url),
      label: str(facebook.label),
      hint: str(facebook.hint),
    },
    zalo: {
      title: str(zalo.title),
      url: str(zalo.url),
      label: str(zalo.label),
      hint: str(zalo.hint),
    },
    hours: {
      title: str(hours.title),
      schedule_line: str(hours.schedule_line),
      footer_note: str(hours.footer_note),
    },
  };
}

export function buildShopContactPatch(form: ReturnType<typeof parseShopContactFormDefaults>): {
  contact: ShopContactPayload;
} {
  return {
    contact: {
      page_title: form.page_title.trim(),
      page_subtitle: form.page_subtitle.trim(),
      phone: {
        title: form.phone.title.trim(),
        label: form.phone.label.trim(),
        tel: form.phone.tel.trim(),
        hint: form.phone.hint.trim(),
      },
      facebook: {
        title: form.facebook.title.trim(),
        url: form.facebook.url.trim(),
        label: form.facebook.label.trim(),
        hint: form.facebook.hint.trim(),
      },
      zalo: {
        title: form.zalo.title.trim(),
        url: form.zalo.url.trim(),
        label: form.zalo.label.trim(),
        hint: form.zalo.hint.trim(),
      },
      hours: {
        title: form.hours.title.trim(),
        schedule_line: form.hours.schedule_line.trim(),
        footer_note: form.hours.footer_note.trim(),
      },
    },
  };
}

/** Payload for PATCH /admin/shops/:id { contact: ... } */
export type ShopContactPayload = {
  page_title?: string;
  page_subtitle?: string;
  phone?: {
    title?: string;
    label?: string;
    tel?: string;
    hint?: string;
  };
  facebook?: {
    title?: string;
    url?: string;
    label?: string;
    hint?: string;
  };
  zalo?: {
    title?: string;
    url?: string;
    label?: string;
    hint?: string;
  };
  hours?: {
    title?: string;
    schedule_line?: string;
    footer_note?: string;
  };
  address?: string;
};

/** Full form state in admin modal — nested sections always present */
export type ShopContactFormState = {
  page_title: string;
  page_subtitle: string;
  address: string;
  phone: {
    title: string;
    label: string;
    tel: string;
    hint: string;
  };
  facebook: {
    title: string;
    url: string;
    label: string;
    hint: string;
  };
  zalo: {
    title: string;
    url: string;
    label: string;
    hint: string;
  };
  hours: {
    title: string;
    schedule_line: string;
    footer_note: string;
  };
};

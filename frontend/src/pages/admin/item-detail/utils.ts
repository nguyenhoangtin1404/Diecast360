import type { AttributeRow } from "./types";

export const MAX_ITEM_ATTRIBUTE_KEYS = 50;
export const MAX_ITEM_ATTRIBUTE_KEY_LENGTH = 50;
export const RESERVED_ITEM_ATTRIBUTE_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
]);

export function toLocalDatetimeInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export const formatNumber = (value: string): string => {
  if (!value || value === "") return "";
  const cleaned = value.replace(/,/g, "").replace(/\s/g, "");
  if (!cleaned) return "";
  const num = parseFloat(cleaned);
  if (isNaN(num)) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const parseNumber = (value: string): string => {
  return value.replace(/,/g, "").replace(/\s/g, "");
};

export function newAttributeRowId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `attr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );
}

export function attributeRowsFromApi(attributes: unknown): AttributeRow[] {
  if (
    !attributes ||
    typeof attributes !== "object" ||
    Array.isArray(attributes)
  ) {
    return [{ id: newAttributeRowId(), key: "", value: "" }];
  }
  const entries = Object.entries(attributes as Record<string, unknown>);
  if (entries.length === 0) {
    return [{ id: newAttributeRowId(), key: "", value: "" }];
  }
  return entries.map(([k, v]) => ({
    id: newAttributeRowId(),
    key: k,
    value:
      v === null || v === undefined
        ? ""
        : typeof v === "boolean" || typeof v === "number"
          ? String(v)
          : String(v),
  }));
}

export function parseAttributeInputValue(
  raw: string,
): string | number | boolean | null {
  const t = raw.trim();
  if (t === "") return null;
  const low = t.toLowerCase();
  if (low === "true") return true;
  if (low === "false") return false;
  if (/^-?(0|[1-9]\d*)$/.test(t)) return parseInt(t, 10);
  return t;
}

export function buildAttributesPayload(
  rows: AttributeRow[],
):
  | { ok: true; value: Record<string, string | number | boolean | null> }
  | { ok: false; message: string } {
  const out: Record<string, string | number | boolean | null> = {};
  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    if (key.length > MAX_ITEM_ATTRIBUTE_KEY_LENGTH) {
      return {
        ok: false,
        message: `Tên thuộc tính quá dài (tối đa ${MAX_ITEM_ATTRIBUTE_KEY_LENGTH} ký tự).`,
      };
    }
    if (key !== row.key) {
      return {
        ok: false,
        message: "Tên thuộc tính không được có khoảng trắng đầu hoặc cuối.",
      };
    }
    if (RESERVED_ITEM_ATTRIBUTE_KEYS.has(key)) {
      return { ok: false, message: `Tên thuộc tính "${key}" không được phép.` };
    }
    if (seen.has(key)) {
      return { ok: false, message: `Trùng tên thuộc tính: ${key}` };
    }
    seen.add(key);
    out[key] = parseAttributeInputValue(row.value);
  }
  if (Object.keys(out).length > MAX_ITEM_ATTRIBUTE_KEYS) {
    return {
      ok: false,
      message: `Tối đa ${MAX_ITEM_ATTRIBUTE_KEYS} thuộc tính.`,
    };
  }
  return { ok: true, value: out };
}

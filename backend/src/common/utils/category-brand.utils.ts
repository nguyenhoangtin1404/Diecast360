/** Same max length as admin category create (`CreateCategoryDto`). */
export const MAX_CATEGORY_BRAND_NAME_LENGTH = 100;

/** Normalizes optional car_brand / model_brand values (trim; empty → null). */
export function normalizeCategoryBrandField(value: string | undefined | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const t = typeof value === 'string' ? value.trim() : '';
  return t.length === 0 ? null : t;
}

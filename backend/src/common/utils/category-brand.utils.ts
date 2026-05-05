/** Normalizes optional car_brand / model_brand values (trim; empty → null). */
export function normalizeCategoryBrandField(value: string | undefined | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const t = typeof value === 'string' ? value.trim() : '';
  return t.length === 0 ? null : t;
}

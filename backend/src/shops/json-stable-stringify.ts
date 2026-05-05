/**
 * Deterministic JSON string for comparing Prisma Json values (key order independent at every depth).
 */
export function jsonStableStringify(value: unknown): string {
  const normalize = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') {
      return v;
    }
    if (Array.isArray(v)) {
      return v.map((item) => normalize(item));
    }
    const obj = v as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalize(obj[key]);
        return acc;
      }, {});
  };
  return JSON.stringify(normalize(value));
}

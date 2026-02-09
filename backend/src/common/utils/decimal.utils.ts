import { Prisma } from '../../generated/prisma/client';

/**
 * Prisma Decimal type definition for type safety
 */
type PrismaDecimal = Prisma.Decimal | { toNumber: () => number };

/**
 * Convert Prisma Decimal to number
 * Handles both Prisma.Decimal objects and regular numbers
 */
export function toNumber(value: PrismaDecimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof (value as PrismaDecimal).toNumber === 'function') {
    return (value as PrismaDecimal).toNumber();
  }
  return Number(value);
}

/**
 * Convert price fields in an item object
 * Returns a new object with price and original_price as numbers
 */
export function convertPriceFields<T extends { price?: unknown; original_price?: unknown }>(
  item: T
): Omit<T, 'price' | 'original_price'> & { price: number | null; original_price: number | null } {
  return {
    ...item,
    price: toNumber(item.price as PrismaDecimal | number | null),
    original_price: toNumber(item.original_price as PrismaDecimal | number | null),
  };
}

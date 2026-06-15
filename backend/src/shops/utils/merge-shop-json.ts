import { Prisma } from '../../generated/prisma/client';
import { ShopContactPatchDto } from '../dto/update-shop.dto';
import { ShopAppearancePatchDto, ShopLoyaltyPatchDto } from '../dto/update-shop-appearance.dto';
import { parseShopLoyaltyJson } from '../shop-loyalty-json.util';

export function mergeContactJson(
  existing: Prisma.JsonValue,
  patch: ShopContactPatchDto,
): Prisma.InputJsonValue {
  const baseObj =
    typeof existing === 'object' && existing !== null && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const next: Record<string, unknown> = { ...baseObj };

  const mergeStringRecord = (
    prevRaw: unknown,
    patchRecord: Record<string, unknown> | undefined,
  ): Record<string, unknown> => {
    const prev =
      typeof prevRaw === 'object' && prevRaw !== null && !Array.isArray(prevRaw)
        ? { ...(prevRaw as Record<string, unknown>) }
        : {};
    if (!patchRecord) return prev;
    for (const [k, v] of Object.entries(patchRecord)) {
      if (v === undefined) continue;
      if (typeof v === 'string' && v.trim() === '') {
        delete prev[k];
      } else {
        prev[k] = v;
      }
    }
    return prev;
  };

  if (patch.page_title !== undefined) {
    if (patch.page_title.trim() === '') delete next.page_title;
    else next.page_title = patch.page_title;
  }
  if (patch.page_subtitle !== undefined) {
    if (patch.page_subtitle.trim() === '') delete next.page_subtitle;
    else next.page_subtitle = patch.page_subtitle;
  }
  if (patch.address !== undefined) {
    if (patch.address === null || patch.address.trim() === '') delete next.address;
    else next.address = patch.address;
  }

  const nested = ['phone', 'facebook', 'zalo', 'hours'] as const;
  for (const key of nested) {
    if (patch[key] !== undefined) {
      next[key] = mergeStringRecord(next[key], patch[key] as Record<string, unknown>);
    }
  }

  return next as Prisma.InputJsonValue;
}

export function mergeAppearanceJson(
  existing: Prisma.JsonValue,
  patch: ShopAppearancePatchDto,
): Prisma.InputJsonValue {
  const baseObj =
    typeof existing === 'object' && existing !== null && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const next: Record<string, unknown> = { ...baseObj };
  const entries: [keyof typeof patch, unknown][] = [
    ['logo_url', patch.logo_url],
    ['favicon_url', patch.favicon_url],
    ['primary_color', patch.primary_color],
    ['accent_color', patch.accent_color],
    ['font_family', patch.font_family],
  ];
  for (const [key, val] of entries) {
    if (val === undefined) continue;
    if (typeof val === 'string' && val.trim() === '') {
      delete next[key as string];
    } else {
      next[key as string] = val;
    }
  }
  return next as Prisma.InputJsonValue;
}

export function mergeLoyaltyJson(
  existing: Prisma.JsonValue,
  patch: ShopLoyaltyPatchDto,
): Prisma.InputJsonValue {
  const baseObj =
    typeof existing === 'object' && existing !== null && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const next: Record<string, unknown> = { ...baseObj };
  if (patch.vnd_per_point !== undefined) {
    next.vnd_per_point = patch.vnd_per_point;
  }
  if (patch.preorder_points_basis !== undefined) {
    next.preorder_points_basis = patch.preorder_points_basis;
  }
  const normalized = parseShopLoyaltyJson(next);
  return {
    vnd_per_point: normalized.vnd_per_point,
    preorder_points_basis: normalized.preorder_points_basis,
  };
}
